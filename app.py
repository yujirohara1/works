from flask import Flask, render_template, g, request, redirect, url_for, Response, abort, session, jsonify, make_response, send_file
from hamlish_jinja import HamlishExtension
from werkzeug.datastructures import ImmutableDict
import os
from flask_login import LoginManager, login_user, logout_user, login_required, UserMixin, current_user
from collections import defaultdict
from datetime import date, timedelta
import datetime
from flask_bootstrap import Bootstrap
from marshmallow_sqlalchemy import ModelSchema

from api.database import db, ma

from models.dailyissues import DailyIssues, DailyIssuesSchema
from models.issue_subjects import IssueSubjects, IssueSubjectsSchema
from models.env_variable import EnvVariable, EnvVariableSchema
from models.duty_members import DutyMembers, DutyMembersSchema
from models.dataa import DataA, DataASchema

from sqlalchemy.sql import text
from sqlalchemy import distinct
from sqlalchemy import desc
from sqlalchemy import asc
from sqlalchemy.sql import func
import json
# from rq import Queue
# from worker import conn
# import PyPDF2
# from bottle import route, run
# import smtplib
# from email.mime.text import MIMEText
# from email.utils import formatdate
import csv
import requests
from bs4 import BeautifulSoup
import pandas as pd
import math
from decimal import Decimal
import openpyxl

# DELIMIT = "@|@|@"


from redminelib import Redmine
import random

import collections
from janome.tokenizer import Tokenizer
from wordcloud import WordCloud



class FlaskWithHamlish(Flask):
    jinja_options = ImmutableDict(
        extensions=[HamlishExtension]
    )
app = FlaskWithHamlish(__name__)
bootstrap = Bootstrap(app)


login_manager = LoginManager()
login_manager.init_app(app)
app.config['SECRET_KEY'] = "secret"
mail_address = os.environ.get('MAIL_ADDR')
mail_password = os.environ.get('MAIL_PASS')

class User(UserMixin):
    def __init__(self, id, user_id, user_nm, api_key):
        self.id = id
        self.user_id = user_id
        self.user_nm = user_nm
        self.api_key = api_key

# ログイン用ユーザー作成
users = {    }

def create_message(from_addr, to_addr, bcc_addrs, subject, body):
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = from_addr
    msg['To'] = to_addr
    msg['Bcc'] = bcc_addrs
    msg['Date'] = formatdate()
    return msg


def send(from_addr, to_addrs, my_pwd, msg):
    smtpobj = smtplib.SMTP('smtp.gmail.com', 587) # gmail
    smtpobj.ehlo()
    smtpobj.starttls()
    smtpobj.ehlo()
    smtpobj.login(from_addr, my_pwd)
    smtpobj.sendmail(from_addr, to_addrs, msg.as_string())
    smtpobj.close()

@login_manager.user_loader
def load_user(user_id):
  uuser = User(user_id, user_id, session["user_nm"], session["api_key"])
  login_user(uuser)
  return uuser

#  db_uri = "postgresql://postgres:yjrhr1102@localhost:5432/newdb3" #開発用aa
db_uri = os.environ.get('DATABASE_URL') #本番用HEROKU_POSTGRESQL_COBALTHEROKU_POSTGRESQL_DIANA_URL
app.config['SQLALCHEMY_DATABASE_URI'] = db_uri 
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
ma.init_app(app)
# q = Queue(connection=conn)
        
# @app.route("/favicon.ico")
# def favicon():
#     return app.send_static_file("favicon.ico")

        
def isfloat(strval):
  try:
    if strval=="nan" :
      return False
      
    float(strval)  # 文字列をfloatにキャスト
    return True
  except ValueError:
    return False

def null2blank(val):
  if val == "null":
    return ""
  else:
    return val
      
def date_range(start, stop, step = timedelta(1)):
    current = start
    while current < stop:
        yield current
        current += step

def toDateTime(str):
  return datetime.datetime.strptime(str.replace("T"," ").replace("+09:00",""), '%Y-%m-%d %H:%M:%S')

def getLastUpdatedOn(projectId):
  sql = ""
  sql = sql + " select "
  sql = sql + "     coalesce(max(updated_on), cast('20200414 00:00:00' as timestamp) ) last_updated_on " #+ cast( '5 days' as INTERVAL ) 
  sql = sql + " from "
  sql = sql + "     issue_subjects "
  sql = sql + " where "
  sql = sql + "     project_id = '" + projectId + "' "

  datalist = []
  datalist = db.session.execute(text(sql)).fetchall()

  return datalist[0].last_updated_on


def getMaxIssueId(projectId):
  sql = ""
  sql = sql + " select "
  sql = sql + "     coalesce(max(issue_id),  " 
  if projectId=="606":
    sql = sql + "         48740 " 

  elif projectId=="1":
    sql = sql + "         1 " 
  
  sql = sql + "      ) max_issue_id " 
  sql = sql + " from "
  sql = sql + "     issue_subjects "
  sql = sql + " where "
  sql = sql + "     project_id = '" + projectId + "' "

  datalist = []
  datalist = db.session.execute(text(sql)).fetchall()

  return datalist[0].max_issue_id


def getRealMaxIssueId(projectId):
  sql = ""
  sql = sql + " select "
  sql = sql + "     coalesce(max(value)::integer,1) max_issue_id " 
  sql = sql + " from "
  sql = sql + "     env_variable "
  sql = sql + " where "
  sql = sql + "     pid = '" + projectId + "' and " #
  sql = sql + "     key = 'realMaxIssueId' and " #realMaxIssueId
  sql = sql + "     code = '0' " #realMaxIssueId

  datalist = []
  datalist = db.session.execute(text(sql)).fetchall()

  return datalist[0].max_issue_id

@app.route('/getMaxIssueIdA/<projectId>')
@login_required
def getMaxIssueIdA(projectId):
  ret = 0
  try:
    ret = getMaxIssueId(projectId)
  except:
    ret = 0

  return str(ret)

@app.route('/getRealMaxIssueIdA/<projectId>')
@login_required
def getRealMaxIssueIdA(projectId):
  ret = 0
  tmp = 0
  try:
    ret = getRealMaxIssueId(projectId)
    tmp = getMaxIssueId(projectId)
    if ret < tmp:
      ret = tmp
  except:
    ret = 0

  return str(ret)


@app.route('/getRestIssueCount/<projectId>')
@login_required
def getRestIssueCount(projectId):
  ret = 0
  realMaxId = 0
  try:
    # ret = "500"
    redmine = Redmine(session["redmine_url"], key=current_user.api_key) #session["redmine_url"]
    
    issues = redmine.issue.filter(project_id = projectId)
    try:
      for issue in issues:
        realMaxId = issue.id
        ret = issues.total_count
        break
    except:
      ret = 0
      for issue in issues:
        if realMaxId < issue.id:
          realMaxId = issue.id

        for cf in issue.custom_fields:
          try:
            if cf.id==77 and projectId == "606":
              if cf.value == "": 
                ret = ret + 1
            elif cf.id==19 and projectId == "1":
              if cf.value == "": 
                ret = ret + 1
          except:
            pass
      #   

  except:
    ret = 0
  
  envVariable = EnvVariable.query.filter( 
    EnvVariable.pid==projectId,
    EnvVariable.key=="realMaxIssueId",
    EnvVariable.code=="0"
  ).first()
  if envVariable != None:
    if int(envVariable.value) > realMaxId:
      realMaxId = int(envVariable.value)
  
  envVariable = EnvVariable.query.filter( 
    EnvVariable.pid==projectId,
    EnvVariable.key=="realMaxIssueId",
    EnvVariable.code=="0"
  ).delete()

  insertEnvVariable(projectId, "realMaxIssueId", "0", realMaxId)
  db.session.commit()

  return str(ret)

# envVariable = EnvVariable.query.filter(
#       EnvVariable.pid==projectId,
#       EnvVariable.key=='userName',
#       EnvVariable.code==str(userId)
#     ).first()
#     if envVariable != None:
#       return envVariable.value
#     else:
#       return "unknown"



@app.route('/tryScrapeKiji/<projectId>/<year>')
@login_required
def tryScrapeKiji(projectId, year):

  textA = ""
  redmine = Redmine(session["redmine_url"], key=current_user.api_key) #session["redmine_url"]

  sql = ""
  sql = sql + " select "
  sql = sql + "     ARRAY_TO_STRING(ARRAY_AGG(issue_subject), ',') textA " 
  sql = sql + " from "
  sql = sql + "     issue_subjects "
  sql = sql + " where "
  sql = sql + "     project_id = '" + projectId + "' and "
  sql = sql + "     case                                                           "
  sql = sql + "         when to_char(start_date, 'MM') ::integer between 1 and 3 "
  sql = sql + "             then to_char(start_date, 'yyyy') ::integer - 1       "
  sql = sql + "         else to_char(start_date, 'yyyy') ::integer               "
  sql = sql + "     end = " + year + "                                             "

  datalist = []
  datalist = db.session.execute(text(sql)).fetchall()

  textA = datalist[0]["texta"]
  if textA == None:
    textA = "データなし"

  dictJuchu = {}
  dictJuchu['aaData']=[]

  # 文字の整形（改行削除）
  # text = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

  # 単語ごとに抽出
  docs=[]
  t = Tokenizer()
  tokens = t.tokenize(textA)
  for token in tokens:
      if len(token.base_form) > 2:
          docs.append(token.surface)
  
  c_word = ' '.join(docs)
  
  filepath = ''
  filename = ''
  if c_word != '':
    wordcloud = WordCloud(background_color='white',
                        font_path='NotoSansJP-Regular.otf',
                        width=1200, height=600).generate(c_word)
    ## 結果を画像に保存
    timestamp = datetime.datetime.now()
    timestampStr = timestamp.strftime('%Y%m%d%H%M%S%f')
    filename = "wordcloud_" + timestampStr + "_" + projectId + ".png"
    filepath = "./static/image/" + filename
    wordcloud.to_file(filepath)

  dictJuchu["aaData"].append( \
    {"id":projectId, \
      "filepath": filename} 
  )

  return json.dumps(dictJuchu, skipkeys=True, ensure_ascii=False)

def decimal_default_proc(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError



@app.route('/updateUserNm/<projectId>/<userId>')
@login_required
def updateUserNm(projectId, userId):
  redmine = Redmine(session["redmine_url"], key=current_user.api_key) #session["redmine_url"]
  ret = "unknown_" + userId
  try:
    ruser = redmine.user.get(userId)
    ret = ruser.login
  except:
    pass

  
  EnvVariable.query.filter( 
    EnvVariable.pid==projectId,
    EnvVariable.key=="userName",
    EnvVariable.code==userId
  ).delete()

  envvariable = EnvVariable()
  envvariable.pid = projectId
  envvariable.key = "userName"
  envvariable.code = userId
  envvariable.value = ret
  db.session.add(envvariable)

  db.session.commit()

  return jsonify({'data': ret})

@app.route('/getOsEnviron/<projectId>')
@login_required
def getOsEnviron(projectId):
  redmine = Redmine(session["redmine_url"], key=current_user.api_key) #session["redmine_url"]
  resultset=getOsEnvironList(projectId)

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})

@app.route('/getUserInfo/<projectId>')
@login_required
def getUserInfo(projectId):
  redmine = Redmine(session["redmine_url"], key=current_user.api_key) #session["redmine_url"]
  resultset=getUserIdList(projectId)

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})



@app.route('/getUserInfoAndTodaysDuty/<projectId>/<dutyDate>')
@login_required
def getUserInfoAndTodaysDuty(projectId, dutyDate):
  redmine = Redmine(session["redmine_url"], key=current_user.api_key) #session["redmine_url"]
  resultset=getUserIdListAndTodaysDuty(projectId, dutyDate)

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})




@app.route('/getDutyStatusByMemberId/<projectId>/<dutyDate>/<memberId>')
@login_required
def getDutyStatusByMemberId(projectId, dutyDate, memberId):
  redmine = Redmine(session["redmine_url"], key=current_user.api_key) #session["redmine_url"]
  updateLatestIssues(projectId, dutyDate, memberId)
  sql = ""
  sql = sql + " select "
  sql = sql + "     count (1) duty_count ,"
  sql = sql + "     coalesce(sum (case when status in (5,6) then 1 else 0 end),0) finished_count "
  sql = sql + " from "
  sql = sql + "     issue_subjects  "
  sql = sql + " where "
  sql = sql + "     project_id = '" + projectId + "' and "
  sql = sql + "     to_char(start_date,'yyyy-mm-dd') = '" + dutyDate + "' and "
  sql = sql + "     assigned_to = '" + memberId + "' "
  
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "duty_count":d["duty_count"],
        "finished_count":d["finished_count"],
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})


@app.route('/getDutyMemberSchedule/<projectId>')
@login_required
def getDutyMemberSchedule(projectId):
  sql = ""
  sql = sql + " select "
  sql = sql + "    a.duty_date,"
  sql = sql + "    string_agg(c.member_nm,', ') member_nms "
  sql = sql + " from "
  sql = sql + "     (select "
  sql = sql + "         to_char(start_date,'yyyy-mm-dd') duty_date "
  sql = sql + "     from "
  sql = sql + "         issue_subjects  "
  sql = sql + "     where "
  sql = sql + "         project_id = '" + projectId + "' "
  sql = sql + "     group by "
  sql = sql + "         to_char(start_date,'yyyy-mm-dd') "
  sql = sql + "     ) a "
  sql = sql + " left join "
  sql = sql + "     (select "
  sql = sql + "         to_char(duty_date,'yyyy-mm-dd') duty_date, "
  sql = sql + "         member_id "
  sql = sql + "     from "
  sql = sql + "         duty_members "
  sql = sql + "     where "
  sql = sql + "         project_id = '" + projectId + "' "
  sql = sql + "     ) b "
  sql = sql + " on "
  sql = sql + "     a.duty_date = b.duty_date "
  sql = sql + " left join "
  sql = sql + "     (select "
  sql = sql + "         code::integer member_id,"
  sql = sql + "         value member_nm"
  sql = sql + "     from "
  sql = sql + "         env_variable "
  sql = sql + "     where "
  sql = sql + "         pid = '" + projectId + "' and "
  sql = sql + "         key = 'userName' "
  sql = sql + "     ) c "
  sql = sql + " on "
  sql = sql + "     b.member_id = c.member_id "
  sql = sql + " group by "
  sql = sql + "     a.duty_date "
  sql = sql + " order by "
  sql = sql + "     a.duty_date desc "
  
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "duty_date":d["duty_date"],
        "member_nms":d["member_nms"]
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})





@app.route('/getTodaysMembers/<projectId>/<dutyDate>')
@login_required
def getTodaysMembers(projectId, dutyDate):
  sql = ""
  sql = sql + " select "
  sql = sql + "    a.member_id,"
  sql = sql + "    coalesce(b.member_nm,'') member_nm, "
  sql = sql + "    coalesce(c.duty_count,0) duty_count, "
  sql = sql + "    coalesce(c.finished_count,0) finished_count "
  sql = sql + " from "
  sql = sql + "     (select "
  sql = sql + "         member_id"
  sql = sql + "     from "
  sql = sql + "         duty_members  "
  sql = sql + "     where "
  sql = sql + "         project_id = '" + projectId + "' and "
  sql = sql + "         to_char(duty_date,'yyyy-mm-dd') = '" + dutyDate + "' "
  sql = sql + "     ) a left join "
  sql = sql + "     (select "
  sql = sql + "         code member_id,"
  sql = sql + "         value member_nm"
  sql = sql + "     from "
  sql = sql + "         env_variable "
  sql = sql + "     where "
  sql = sql + "         pid = '" + projectId + "' and "
  sql = sql + "         key = 'userName' "
  sql = sql + "     ) b "
  sql = sql + " on "
  sql = sql + "    a.member_id = b.member_id::integer "
  sql = sql + " left join "
  sql = sql + "      (select "
  sql = sql + "         assigned_to, "
  sql = sql + "         count (1) duty_count ,"
  sql = sql + "         coalesce(sum (case when status in (5,6) then 1 else 0 end),0) finished_count "
  sql = sql + "     from "
  sql = sql + "         issue_subjects  "
  sql = sql + "     where "
  sql = sql + "         project_id = '" + projectId + "' and "
  sql = sql + "         to_char(start_date,'yyyy-mm-dd') = '" + dutyDate + "' "
  sql = sql + "     group by "
  sql = sql + "         assigned_to "
  sql = sql + "     ) c "
  sql = sql + " on "
  sql = sql + "    a.member_id = c.assigned_to "
  sql = sql + " order by b.member_nm "
  
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "member_id":d["member_id"],
        "member_nm":d["member_nm"],
        "duty_count":d["duty_count"],
        "finished_count":d["finished_count"],
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})




@app.route('/getUserNmList/<projectId>')
@login_required
def getUserNmList(projectId):
  sql = ""
  sql = sql + " select "
  sql = sql + "     code user_id,"
  sql = sql + "     value user_nm"
  sql = sql + " from "
  sql = sql + "     env_variable "
  sql = sql + " where "
  sql = sql + "     pid = '" + projectId + "' and "
  sql = sql + "     key = 'userName' "
  sql = sql + " order by value "
    
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "user_id":d["user_id"],
        "user_nm":d["user_nm"],
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})



# def getUserNm(projectId, userId):
#   sql = ""
#   sql = sql + " select "
#   sql = sql + "     value user_nm"
#   sql = sql + " from "
#   sql = sql + "     env_variable "
#   sql = sql + " where "
#   sql = sql + "     pid = '" + projectId + "' and "
#   sql = sql + "     key = 'userName' and "
#   sql = sql + "     key = '" + userId + "'  "
    
#   datalist = []
#   resultset=[]
#   datalist = db.session.execute(text(sql)).fetchall()

#   for d in datalist:
#     resultset.append(
#       {
#         "user_id":d["user_id"],
#         "user_nm":d["user_nm"],
#       }
#     )

#   return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})


@app.route('/getLeverageSummary/<projectId>')
@login_required
def getLeverageSummary(projectId):
  redmine = Redmine(session["redmine_url"], key=current_user.api_key) #session["redmine_url"]
  sql = ""
  sql = sql + "     select "
  sql = sql + "         customer_id, "
  sql = sql + "         issue_subject, "
  sql = sql + "         count(1) incident_count, "
  sql = sql + "         to_char(min(start_date),'yyyy-mm-dd') min_start_date,"
  sql = sql + "         to_char(max(start_date),'yyyy-mm-dd') max_start_date"
  sql = sql + "     from "
  sql = sql + "         issue_subjects  "
  sql = sql + "     where "
  sql = sql + "         project_id = '" + projectId + "' and "
  sql = sql + "         length(issue_subject) > 1"
  sql = sql + "     group by "
  sql = sql + "         customer_id, "
  sql = sql + "         issue_subject "
  sql = sql + "     having "
  sql = sql + "         count(1) >= 10"
  sql = sql + "     order by count(1) desc "

  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "customer_id":d["customer_id"],
        "issue_subject":d["issue_subject"],
        "incident_count":d["incident_count"],
        "min_start_date":d["min_start_date"],
        "max_start_date":d["max_start_date"]
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})



@app.route('/getCommitmentSummary/<projectId>')
@login_required
def getCommitmentSummary(projectId):
  redmine = Redmine(session["redmine_url"], key=current_user.api_key) #session["redmine_url"]
  resultset=getRecordCommitmentSummaryList(projectId)

  # for r in resultset:
  #   try:
  #     if r["user_name"]=="" :
  #       ruser = redmine.user.get(int(r["assigned_to"]))
  #       r["user_name"] = ruser.login
  #   except:
  #     pass

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})

@app.route('/getAssignedSammary/<projectId>')
@login_required
def getAssignedSammary(projectId):
  redmine = Redmine(session["redmine_url"], key=current_user.api_key) #session["redmine_url"]
  resultset=getGroupByAssignedNumberOfCountList(projectId)

  for r in resultset:
    try:
      if r["user_name"]=="" :
        ruser = redmine.user.get(int(r["assigned_to"]))
        r["user_name"] = ruser.login
    except:
      pass

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})

def getGroupByAssignedNumberOfCountList(projectId):
  sql = ""
  sql = sql + " select "
  sql = sql + "     a.incident_count, "
  sql = sql + "     a.finished_count, "
  sql = sql + "     a.total_count, "
  sql = sql + "     a.assigned_to, "
  sql = sql + "     coalesce(b.user_name,'') user_name "
  sql = sql + " from  "
  sql = sql + "     (select "
  sql = sql + "         assigned_to "
  sql = sql + "         ,sum (case when status not in (5,6) then 1 else 0 end) incident_count "
  sql = sql + "         ,sum (case when status in (5,6) then 1 else 0 end) finished_count "
  sql = sql + "         , count(1) total_count   "
  sql = sql + "     from "
  sql = sql + "         issue_subjects  "
  sql = sql + "     where "
  sql = sql + "         project_id = '" + projectId + "' "
  sql = sql + "     group by "
  sql = sql + "         assigned_to "
  sql = sql + "     ) a left join  "
  sql = sql + "     (select "
  sql = sql + "         code user_id,"
  sql = sql + "         value user_name"
  sql = sql + "     from "
  sql = sql + "         env_variable "
  sql = sql + "     where "
  sql = sql + "         pid = '" + projectId + "' and "
  sql = sql + "         key = 'userName' "
  sql = sql + "     ) b "
  sql = sql + " on "
  sql = sql + "    a.assigned_to = b.user_id::integer "
  sql = sql + " order by a.finished_count desc "

  
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "assigned_to":d["assigned_to"],
        "incident_count":d["incident_count"],
        "finished_count":d["finished_count"],
        "total_count":d["total_count"],
        "incident_ratio": round(int(d["incident_count"]) / int(d["total_count"])*100,2) ,
        "assigned_to":d["assigned_to"],
        "user_name":d["user_name"]
      }
    )

  return resultset #jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})



def getRecordCommitmentSummaryList(projectId):
  sql = ""
  sql = sql + " select "
  sql = sql + "     assigned_to "
  sql = sql + "     , member.member_nm "
  sql = sql + "     , count(1) finished_count_total "
  sql = sql + "     , sum(  "
  sql = sql + "         case  "
  sql = sql + "             when duty_mem.duty_date is null  "
  sql = sql + "                 then 0  "
  sql = sql + "             else 1  "
  sql = sql + "             end "
  sql = sql + "     ) duty_finished_count "
  sql = sql + "     , sum(  "
  sql = sql + "         case  "
  sql = sql + "             when duty_mem.duty_date is null  "
  sql = sql + "                 then 1  "
  sql = sql + "             else 0  "
  sql = sql + "             end "
  sql = sql + "     ) unduty_finished_count "
  sql = sql + "     , coalesce(duty_days.days_count, 0) duty_days "
  sql = sql + "     , total_days.days_count - coalesce(duty_days.days_count, 0) unduty_days "
  sql = sql + " from "
  sql = sql + "     issue_subjects iss  "
  sql = sql + "     left join duty_members duty_mem  "
  sql = sql + "         on iss.assigned_to = duty_mem.member_id  "
  sql = sql + "         and iss.finished_date = duty_mem.duty_date  "
  sql = sql + "     left join (  "
  sql = sql + "         select "
  sql = sql + "             member_id "
  sql = sql + "             , count(1) days_count  "
  sql = sql + "         from "
  sql = sql + "             duty_members  "
  sql = sql + "         group by "
  sql = sql + "             member_id "
  sql = sql + "     ) duty_days  "
  sql = sql + "         on iss.assigned_to = duty_days.member_id  "
  sql = sql + "     left join (  "
  sql = sql + "         select "
  sql = sql + "             count(distinct duty_date) days_count  "
  sql = sql + "         from "
  sql = sql + "             duty_members "
  sql = sql + "     ) total_days  "
  sql = sql + "         on 1 = 1  "
  sql = sql + "     left join ( "
  sql = sql + "         select "
  sql = sql + "             code::integer member_id,"
  sql = sql + "             value member_nm"
  sql = sql + "         from "
  sql = sql + "             env_variable "
  sql = sql + "         where "
  sql = sql + "             pid = '" + projectId + "' and "
  sql = sql + "             key = 'userName' "
  sql = sql + "     ) member "
  sql = sql + "         on "
  sql = sql + "            iss.assigned_to = member.member_id "
  sql = sql + " where coalesce(duty_days.days_count, 0) > 0 and"
  sql = sql + "     iss.project_id = '" + projectId + "' "
  sql = sql + " group by "
  sql = sql + "     iss.assigned_to "
  sql = sql + "     , member.member_nm "
  sql = sql + "     , duty_days.days_count "
  sql = sql + "     , total_days.days_count "
  sql = sql + " order by "
  sql = sql + "     iss.assigned_to "

  
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "assigned_to":d["assigned_to"],
        "member_nm":d["member_nm"],
        "finished_count_total":d["finished_count_total"],
        "duty_finished_count":d["duty_finished_count"],
        "unduty_finished_count":d["unduty_finished_count"],
        "duty_days":d["duty_days"],
        "unduty_days":d["unduty_days"],
        "duty_days_average": round(int(d["duty_finished_count"]) / int(d["duty_days"]),2) ,
      }
    )

  return resultset #jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})


@app.route('/updateOsEnvironValue/<projectId>/<valsJsonStr>')
@login_required
def updateOsEnvironValue(projectId, valsJsonStr):
  valsList = None
  ret = 0
  try:
    valsList = json.loads(valsJsonStr) # = 2 # getMaxIssueId(projectId)

    if valsList != None:
      for i in valsList:
        key = i["key"]
        value = i["value"]
        
        EnvVariable.query.filter( 
          EnvVariable.pid==projectId,
          EnvVariable.key==key,
          EnvVariable.code == "0"
        ).delete()

        
        envVariable = EnvVariable()
        envVariable.pid = projectId
        envVariable.key = key
        envVariable.code = "0"
        envVariable.value = value
        db.session.add(envVariable)
      
        db.session.commit()
        
  except:
    ret=1

  return str(ret)

# UpdateTodaysMember

@app.route('/UpdateTodaysMember/<projectId>/<dutyDate>/<members>')
@login_required
def UpdateTodaysMember(projectId, dutyDate, members):
  ret = 0
  membersArray = members.split(",")
  try:
    DutyMembers.query.filter( 
      DutyMembers.project_id==projectId,
      DutyMembers.duty_date ==dutyDate
    ).delete()

    for memberId in membersArray:
      if isfloat(memberId):
        dutyMembers = DutyMembers()
        dutyMembers.project_id = projectId
        dutyMembers.duty_date = dutyDate
        dutyMembers.member_id = memberId
        db.session.add(dutyMembers)
        db.session.commit()

  except:
    ret=1

  return str(ret)

@app.route('/UpdateCustomFieldsValue/<projectId>/<defineStartDate>/<defineFinishedDate>/<defineCustomer>/<defineAssignedTo>')
@login_required
def UpdateCustomFieldsValue(projectId, defineStartDate, defineFinishedDate, defineCustomer, defineAssignedTo):
  ret = 0
  try:
    EnvVariable.query.filter( 
      EnvVariable.pid==projectId,
      EnvVariable.key=="customFieldDefine"
    ).delete()
    insertEnvVariable(projectId, "customFieldDefine", "1", defineStartDate)
    insertEnvVariable(projectId, "customFieldDefine", "2", defineFinishedDate)
    insertEnvVariable(projectId, "customFieldDefine", "3", defineCustomer)
    insertEnvVariable(projectId, "customFieldDefine", "4", defineAssignedTo)
  
    db.session.commit()

  except:
    ret=1

  return str(ret)

def insertEnvVariable(pid, key, code, value):
  if value != "dummy":
    envVariable = EnvVariable()
    envVariable.pid = pid
    envVariable.key = key
    envVariable.code = code
    envVariable.value = value
    db.session.add(envVariable)


@app.route('/customFieldsDefine/<projectId>')
@login_required
def customFieldsDefine(projectId):
  resultset=getCustomFieldsDefineList(projectId)
  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})

def getCustomFieldsDefineList(projectId):
  sql = ""
  sql = sql + " select "
  sql = sql + "     code , "
  sql = sql + "     value "
  sql = sql + " from "
  sql = sql + "     env_variable "
  sql = sql + " where "
  sql = sql + "     pid = '" + projectId + "' and "
  sql = sql + "     key = 'customFieldDefine' "
  sql = sql + " order by code "
  
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "code":d["code"],
        "value":d["value"],
      }
    )

  return resultset #jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})


def getOsEnvironList(projectId):
  sql = ""
  sql = sql + " select "
  sql = sql + "    a.akey,"
  sql = sql + "    b.value "
  sql = sql + " from "
  sql = sql + "     (select 'REDMINE_URL_KEY' aKEY UNION ALL "
  sql = sql + "      select 'HOGE_FOO_BAR' aKEY "
  sql = sql + "     ) a left join "
  sql = sql + "     (select "
  sql = sql + "         key bkey, "
  sql = sql + "         value "
  sql = sql + "     from "
  sql = sql + "         env_variable "
  sql = sql + "     where "
  sql = sql + "         pid = '" + projectId + "' and "
  sql = sql + "         code = '0' "
  sql = sql + "     ) b "
  sql = sql + " on "
  sql = sql + "    a.akey = b.bkey "
  
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "key":d["akey"],
        "value":d["value"],
      }
    )

  return resultset #jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})



def getUserIdList(projectId):
  sql = ""
  sql = sql + " select "
  sql = sql + "    a.user_id,"
  sql = sql + "    coalesce(b.user_nm,'') user_nm "
  sql = sql + " from "
  sql = sql + "     (select "
  sql = sql + "         assigned_to user_id"
  sql = sql + "     from "
  sql = sql + "         issue_subjects  "
  sql = sql + "     where "
  sql = sql + "         project_id = '" + projectId + "' "
  sql = sql + "     group by "
  sql = sql + "         assigned_to "
  sql = sql + "     ) a left join "
  sql = sql + "     (select "
  sql = sql + "         code user_id,"
  sql = sql + "         value user_nm"
  sql = sql + "     from "
  sql = sql + "         env_variable "
  sql = sql + "     where "
  sql = sql + "         pid = '" + projectId + "' and "
  sql = sql + "         key = 'userName' "
  sql = sql + "     ) b "
  sql = sql + " on "
  sql = sql + "    a.user_id = b.user_id::integer "
  sql = sql + " order by a.user_id "
    
  
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "user_id":d["user_id"],
        "user_nm":d["user_nm"],
      }
    )

  return resultset #jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})


def getUserIdListAndTodaysDuty(projectId, dutyDate):
  sql = ""
  sql = sql + " select "
  sql = sql + "    a.user_id,"
  sql = sql + "    coalesce(b.user_nm,'') user_nm, "
  sql = sql + "    c.member_id today_on "
  sql = sql + " from "
  sql = sql + "     (select "
  sql = sql + "         assigned_to user_id"
  sql = sql + "     from "
  sql = sql + "         issue_subjects  "
  sql = sql + "     where "
  sql = sql + "         project_id = '" + projectId + "' "
  sql = sql + "     group by "
  sql = sql + "         assigned_to "
  sql = sql + "     ) a "
  sql = sql + "         left join "
  sql = sql + "             (select "
  sql = sql + "                 code user_id,"
  sql = sql + "                 value user_nm"
  sql = sql + "             from "
  sql = sql + "                 env_variable "
  sql = sql + "             where "
  sql = sql + "                 pid = '" + projectId + "' and "
  sql = sql + "                 key = 'userName' "
  sql = sql + "             ) b "
  sql = sql + "         on "
  sql = sql + "            a.user_id = b.user_id::integer "
  sql = sql + "         left join "
  sql = sql + "             (select "
  sql = sql + "                 member_id"
  sql = sql + "             from "
  sql = sql + "                 duty_members "
  sql = sql + "             where "
  sql = sql + "                 project_id = '" + projectId + "' and "
  sql = sql + "                 duty_date = '" + dutyDate + "' "
  sql = sql + "             ) c "
  sql = sql + "         on "
  sql = sql + "            a.user_id = c.member_id "
  sql = sql + " order by a.user_id "
    
  
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "user_id":d["user_id"],
        "user_nm":d["user_nm"],
        "today_on":d["today_on"]
      }
    )

  return resultset #jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})



def insertIssueSubjects(issue, projectId):


  try:
    IssueSubjects.query.filter( 
      IssueSubjects.issue_id == issue.id,
      IssueSubjects.project_id == projectId
    ).delete()

    issueSubjects = IssueSubjects()
    issueSubjects.issue_id = issue.id
    issueSubjects.issue_subject = issue.subject
    
    try:
      issueSubjects.start_date = issue.start_date
    except:
      pass
    
    issueSubjects.project_id = issue.project.id
    issueSubjects.updated_on = issue.updated_on

    if projectId == "1":
      if (issue.status.id == 5 or issue.status.id == 10):
        issueSubjects.status = 5 #issue.status.id
      else:
        issueSubjects.status = issue.status.id
    elif projectId == "606":
      issueSubjects.status = issue.status.id

    for cf in issue.custom_fields:
      try:
        if cf.id==77 and projectId == "606":
          if cf.value != "": 
            issueSubjects.finished_date = cf.value
        elif cf.id==86 and projectId == "606":
          if cf.value != "": 
            issueSubjects.customer_id = cf.value
        elif cf.id==199 and projectId == "606":
          if cf.value != "": 
            issueSubjects.enter = cf.value
        elif cf.id==19 and projectId == "1":
          if cf.value != "": 
            issueSubjects.finished_date = cf.value
        elif cf.id==6 and projectId == "1":
          if cf.value != "": 
            issueSubjects.customer_id = cf.value
        elif cf.id==87 and projectId == "1":
          if cf.value != "": 
            issueSubjects.start_date = cf.value
      except:
        pass

    issueSubjects.assigned_to = 0
    try:
      issueSubjects.assigned_to = issue.assigned_to.id
    except:
      if projectId == "1":
        try:
          for cf in issue.custom_fields:
            if cf.id==18:
              if cf.value != "": 
                issueSubjects.assigned_to = cf.value
        except:
          pass

    db.session.add(issueSubjects)
    db.session.commit()

    return 1

  except:
    return 0


def getIssuesCount(projectId, measureDate):
  sql = ""
  sql = sql + " select sum(finished_count) finished_count, sum(incident_count) incident_count, max(finished_tooltip) finished_tooltip  "
  sql = sql + " from "
  sql = sql + "       (select "
  sql = sql + "           sum(a.finished_count) finished_count, "
  sql = sql + "           0 incident_count, "
  sql = sql + "           string_agg( concat(b.member_nm,':', a.finished_count)  ,',' order by a.finished_count desc)  finished_tooltip "
  sql = sql + "       from "
  sql = sql + "           ( "
  sql = sql + "               select "
  sql = sql + "                   assigned_to "
  sql = sql + "                   , count(1) finished_count "
  sql = sql + "               from "
  sql = sql + "                   issue_subjects "
  sql = sql + "               where "
  sql = sql + "                   project_id = '" + projectId + "' and "
  sql = sql + "                   to_char(finished_date,'yyyy-mm-dd') = '" + measureDate + "' "
  sql = sql + "               group by "
  sql = sql + "                   assigned_to "
  sql = sql + "           ) a "
  sql = sql + "           left join ( "
  sql = sql + "               select "
  sql = sql + "                   code ::integer member_id ,"
  sql = sql + "                   value member_nm "
  sql = sql + "               from "
  sql = sql + "                   env_variable "
  sql = sql + "               where "
  sql = sql + "                   pid = '" + projectId + "' and "
  sql = sql + "                   key = 'userName' "
  sql = sql + "           ) b "
  sql = sql + "               on a.assigned_to = b.member_id "

  # sql = sql + "         (select  "
  # sql = sql + "             assigned_to,  "
  # sql = sql + "             count(1) finished_count_eachother  "
  # sql = sql + "         from  "
  # sql = sql + "             issue_subjects  "
  # sql = sql + "         where "
  # sql = sql + "             main.project_id = '" + projectId + "' and "
  # sql = sql + "             to_char(main.finished_date,'yyyy-mm-dd') = '" + measureDate + "' "
  # sql = sql + "         group by  "
  # sql = sql + "             assigned_to "
  # sql = sql + "         ) a "
  # sql = sql + "         left join  "
  # sql = sql + "             (select "
  # sql = sql + "                 code::integer member_id,"
  # sql = sql + "                 value member_nm"
  # sql = sql + "             from "
  # sql = sql + "                 env_variable "
  # sql = sql + "             where "
  # sql = sql + "                 pid = '" + projectId + "' and "
  # sql = sql + "                 key = 'userName' "
  # sql = sql + "             ) b "
  # sql = sql + "         on a.assigned_to = b.member_id "
  # sql = sql + "     where "
  # sql = sql + "         main.project_id = '" + projectId + "' and "
  # sql = sql + "         to_char(main.finished_date,'yyyy-mm-dd') = '" + measureDate + "' "
  sql = sql + "     union all "
  sql = sql + "     select 0 finished_count, count(1) incident_count, null finished_tooltip from issue_subjects "
  sql = sql + "     where "
  sql = sql + "         project_id = '" + projectId + "' and "
  sql = sql + "         to_char(start_date,'yyyy-mm-dd') = '" + measureDate + "' "
  sql = sql + "     ) a "

  datalist = []
  datalist = db.session.execute(text(sql)).fetchall()

  return datalist[0] #.last_updated_on



def updateLatestIssues(projectId, measureDate, memberId):
  lastUpdateDate = datetime.datetime.now() - timedelta(days=1)
  redmine = Redmine(session["redmine_url"], key=current_user.api_key) #session["redmine_url"]
  
  for d in date_range(lastUpdateDate, datetime.datetime.now()):
    if memberId == -1:
      issues = redmine.issue.filter(project_id = projectId, updated_on = d.date())
    else:
      issues = redmine.issue.filter(project_id = projectId, updated_on = d.date(), assigned_to = memberId)
    
    for issue in issues:
      insertIssueSubjects(issue, projectId)


@app.route('/getIssues/<projectId>/<measureDate>/<issueStatus>/<reget>')
@login_required
def getIssues(projectId, measureDate, issueStatus, reget):

  if reget=="true":
    updateLatestIssues(projectId, measureDate, memberId=-1)

  tmp = getIssuesCount(projectId, measureDate)
  resultset=[]
  resultset.append({"projectId":projectId, "measureDate":measureDate, "countOfIncindence":tmp["incident_count"], "countOfFinish":tmp["finished_count"], "finished_tooltip":tmp["finished_tooltip"]})
  # startDate += delta
  
  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})


@app.route('/getEnterIssue/<projectId>')
@login_required
def getEnterIssue(projectId):
  redmine = Redmine(session["redmine_url"], key=current_user.api_key) #session["redmine_url"]
  resultset=[]
  issues = redmine.issue.filter(project_id=projectId, status_id =2, cf_199="入場あり")
  for issue in issues:
    # ret = issues.total_count
    resultset.append({
      "issueId":issue.id, 
      "projectId":issue.project.id, 
      "startDate":str(issue.start_date),
      "updatedOn":str(issue.updated_on).replace("T"," ").replace("+09:00",""), 
      "assignedTo":getUserNm(projectId, issue.assigned_to.id),
      "subject":issue.subject,
      "customerId":getCustomFieldValue(issue,projectId,86),
      "orginalUrl":str(session["redmine_url"]) + "/issues/" + str(issue.id)
    })
  
  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})

def getCustomFieldValue(issue, projectId, cfId):
  for cf in issue.custom_fields:
    try:
      if cf.id==cfId and issue.project.id == int(projectId):
        if cf.value != "": 
          return cf.value
    except:
      pass

  return ""

def getUserNm(projectId, userId):
    envVariable = EnvVariable.query.filter(
      EnvVariable.pid==projectId,
      EnvVariable.key=='userName',
      EnvVariable.code==str(userId)
    ).first()
    if envVariable != None:
      return envVariable.value
    else:
      return "unknown"

@app.route('/getAssignedBarChartData/<projectId>/<memberIds>/<rdStatus>')
@login_required
def getAssignedBarChartData(projectId, memberIds, rdStatus):
  assignList = []
  customerList = []
  strWhereIn = " in ('"+memberIds.replace(",","','")+"-1')"
  assignList = db.session.execute(text("select code, value from env_variable where pid = '" + projectId + "' and key = 'userName' and code " + strWhereIn)).fetchall()

  sqlB = ""
  if rdStatus == "finished":
    sqlB = "select customer_id, count(1) total_count from issue_subjects where project_id = '" + projectId + "' and assigned_to " + strWhereIn + " and status in (5,6) group by customer_id order by total_count desc"
  elif rdStatus == "unfinished":
    sqlB = "select customer_id, count(1) total_count from issue_subjects where project_id = '" + projectId + "' and assigned_to " + strWhereIn + " and status not in (5,6)  group by customer_id order by total_count desc"

  customerList = db.session.execute(text(sqlB)).fetchall()

  resultset=[]
  for customer in customerList:
    # resultset.append({"projectId":projectId, "customer_id":customer["customer_id"], "total_count":customer["total_count"})
    assignedTotal = 0
    dictOne = {"projectId":projectId, "customer_id":customer["customer_id"], "total_count":customer["total_count"]}
    for assignTo in assignList:
      sql = ""
      sql = sql + " select "
      sql = sql + "     count(1) assigned_count "
      sql = sql + " from "
      sql = sql + "     issue_subjects "
      sql = sql + " where "
      sql = sql + "     project_id = '" + projectId + "' and "
      sql = sql + "     customer_id = '" + customer["customer_id"] + "' and "
      sql = sql + "     assigned_to = '" + assignTo["code"] + "' "
      
      if rdStatus == "finished":
        sql = sql + "    and status in (5,6) "
      elif rdStatus == "unfinished":
        sql = sql + "    and status not in (5,6) "
      sql = sql + " group by "
      sql = sql + "     assigned_to, "
      sql = sql + "     customer_id "

      assignedCount = 0
      countRecord = db.session.execute(text(sql)).first()
      if countRecord != None:
        assignedCount = countRecord["assigned_count"]
        assignedTotal = assignedTotal + assignedCount
      
      if assignTo["value"] in dictOne:
        dictOne[assignTo["value"]] = int(dictOne[assignTo["value"]]) + assignedCount
      else:
        dictOne[assignTo["value"]] = assignedCount
      # dictOne{assignTo["code"]] : str(assignedCount)}
    
    #dictOne["dummy"] = int(customer["total_count"]) - assignedTotal
    resultset.append(dictOne)

    resultset2=[]
    for assignTo in assignList:
      if assignTo["value"] not in resultset2:
        resultset2.append(assignTo["value"])
      # resultset2.append({"assigned_to":assignTo["code"], "assigned_name":assignTo["value"]})

  # startDate += delta
  
  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc),'data2': json.dumps(resultset2,default=decimal_default_proc)})


@app.route('/getOrderInfomation')
def getOrderInfomation():
  sql = ""
  sql = sql + "   select '2020/12/1' order_date, '令和元年度財務書類作成' request_content, 'すずき会計事務所' supplier_name union all "
  sql = sql + "   select '2021/8/4' order_date, '令和２年度財務書類作成' request_content, 'さとう会計事務所' supplier_name      "
  sql = sql + "       "

  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "order_date":d["order_date"],
        "request_content":d["request_content"],
        "supplier_name":d["supplier_name"],
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})




@app.route('/getCompleteInfomation')
def getCompleteInfomation():
  sql = ""
  sql = sql + " select '2020/9/30' upload_date, '令和元年度財務書類_納品用.zip' file_name, null approved_date , '財務書類一式、付属明細書、固定資産台帳、その他関係書類' content_description union all "
  sql = sql + " select '2020/10/2' upload_date, '令和元年度財務書類_納品用_修正版.zip' file_name, '2020/10/15' approved_date , '財務書類一式、付属明細書、固定資産台帳、その他関係書類' content_description union all "
  sql = sql + " select '2020/9/18' upload_date, '令和２年度財務書類_納品用.zip' file_name, '2021/9/30' approved_date , '財務書類一式、付属明細書、固定資産台帳、その他関係書類' content_description "
  

  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "upload_date":d["upload_date"],
        "file_name":d["file_name"],
        "approved_date":d["approved_date"],
        "content_description":d["content_description"],
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})


@app.route('/getRecordSizeInfomation')
def getRecordSizeInfomation():
  sql = ""
  sql = sql + "   select 2020 kai_nen, 12345 account_record_size, 23456 journal_record_size, 80000 asset_record_size union all"
  sql = sql + "   select 2021 kai_nen, 54321 account_record_size, 65432 journal_record_size, 80001 asset_record_size "
  sql = sql + "       "

  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "kai_nen":d["kai_nen"],
        "account_record_size":d["account_record_size"],
        "journal_record_size":d["journal_record_size"],
        "asset_record_size":d["asset_record_size"],
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})


@app.route('/getHotOrColdSammary/<projectId>/<year>/<issueStatus>')
@login_required
def getHotOrColdSammary(projectId, year, issueStatus):
  sql = ""

  if issueStatus == "incident" :
      
    sql = sql + " select "
    sql = sql + "     project_id, "
    sql = sql + "     to_char(start_date,'yyyy-mm-dd') measure_date, "
    sql = sql + "     min(status) status_id, "
    sql = sql + "     count(1) number_of_count "
    sql = sql + " from "
    sql = sql + "     issue_subjects "
    sql = sql + " where "
    sql = sql + "     project_id = '" + projectId + "' and "
    sql = sql + "     case                                                           "
    sql = sql + "         when to_char(start_date, 'MM') ::integer between 1 and 3 "
    sql = sql + "             then to_char(start_date, 'yyyy') ::integer - 1       "
    sql = sql + "         else to_char(start_date, 'yyyy') ::integer               "
    sql = sql + "     end = " + year + "                                             "
    sql = sql + " group by "
    sql = sql + "     project_id, "
    sql = sql + "     to_char(start_date,'yyyy-mm-dd') "
    sql = sql + " order by "
    sql = sql + "     to_char(start_date,'yyyy-mm-dd') "

  elif issueStatus == "finished" :
      
    sql = sql + " select "
    sql = sql + "     project_id, "
    sql = sql + "     to_char(finished_date,'yyyy-mm-dd') measure_date, "
    sql = sql + "     min(status) status_id, "
    sql = sql + "     count(1) number_of_count "
    sql = sql + " from "
    sql = sql + "     issue_subjects "
    sql = sql + " where "
    sql = sql + "     project_id = '" + projectId + "' and "
    sql = sql + "     status in (5,6) and"
    sql = sql + "     case                                                           "
    sql = sql + "         when to_char(finished_date, 'MM') ::integer between 1 and 3 "
    sql = sql + "             then to_char(finished_date, 'yyyy') ::integer - 1       "
    sql = sql + "         else to_char(finished_date, 'yyyy') ::integer               "
    sql = sql + "     end = " + year + "                                             "
    sql = sql + " group by "
    sql = sql + "     project_id, "
    sql = sql + "     to_char(finished_date,'yyyy-mm-dd') "
    sql = sql + " order by "
    sql = sql + "     to_char(finished_date,'yyyy-mm-dd') "

  elif issueStatus == "diff" :
    #   sql = sql + "     sum(case when status_id = 0 then -number_of_count when status_id = 5 then number_of_count else 0 end) number_of_count "

    sql = sql + " select "
    sql = sql + "     project_id, "
    sql = sql + "     measure_date, "
    sql = sql + "     0 status_id, "
    sql = sql + "     sum(case when status_id = 0 then -number_of_count when status_id = 5 then number_of_count else 0 end) number_of_count "
    sql = sql + " from "
    sql = sql + "     (select "
    sql = sql + "          project_id, "
    sql = sql + "          to_char(start_date,'yyyy-mm-dd') measure_date, "
    sql = sql + "          0 status_id, "
    sql = sql + "          count(1) number_of_count "
    sql = sql + "      from "
    sql = sql + "          issue_subjects "
    sql = sql + "      where "
    sql = sql + "          project_id = '" + projectId + "' and "
    sql = sql + "          case                                                           "
    sql = sql + "              when to_char(start_date, 'MM') ::integer between 1 and 3 "
    sql = sql + "                  then to_char(start_date, 'yyyy') ::integer - 1       "
    sql = sql + "              else to_char(start_date, 'yyyy') ::integer               "
    sql = sql + "          end = " + year + "                                             "
    sql = sql + "      group by "
    sql = sql + "          project_id, "
    sql = sql + "          to_char(start_date,'yyyy-mm-dd') "
    sql = sql + "      union all "
    sql = sql + "      select "
    sql = sql + "          project_id, "
    sql = sql + "          to_char(finished_date,'yyyy-mm-dd') measure_date, "
    sql = sql + "          5 status_id, "
    sql = sql + "          count(1) number_of_count "
    sql = sql + "      from "
    sql = sql + "          issue_subjects "
    sql = sql + "      where "
    sql = sql + "          project_id = '" + projectId + "' and "
    sql = sql + "          status in (5,6) and"
    sql = sql + "          case                                                           "
    sql = sql + "              when to_char(finished_date, 'MM') ::integer between 1 and 3 "
    sql = sql + "                  then to_char(finished_date, 'yyyy') ::integer - 1       "
    sql = sql + "              else to_char(finished_date, 'yyyy') ::integer               "
    sql = sql + "          end = " + year + "                                             "
    sql = sql + "      group by "
    sql = sql + "          project_id, "
    sql = sql + "          to_char(finished_date,'yyyy-mm-dd') "
    sql = sql + "      ) a "
    sql = sql + " group by "
    sql = sql + "     project_id, "
    sql = sql + "     measure_date "

  datalist = []
  datalist = db.session.execute(text(sql)).fetchall()

  resultset=[]

  for mon in range(4, 16):
    if mon <= 12:
      resultset.append({"month":mon})
    else:
      resultset.append({"month":mon-12})
  
  for a in resultset:
    for dat in range(1, 32):
      a[str(dat)] = 0


  for a in datalist:
    m = int(a["measure_date"].split("-")[1])
    d = int(a["measure_date"].split("-")[2])
    for b in resultset:
      if b["month"] == m:
        b[str(d)] = a["number_of_count"]


  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})


def getRandomKey():
   return datetime.datetime.now().strftime('%Y%m%d%H%M%S%f') + "_" + str(random.randint(1, 9999999999999999))

@app.route('/uploadFiles',methods=["PUT"])
def uploadFiles():
  files = request.files['excelFile']
  filenameOrg = files.filename
  idx = len(files.filename.split("."))-1
  extention = files.filename.split(".")[idx]
  filename = getRandomKey() + "." + extention
  files.save('tmp/' + filename)
  xlFile = pd.read_excel(files, sheet_name=None)

  retList = []
  shidx = 0
  for sh in xlFile:
    shidx = shidx + 1
    retList.append(
      {
        "rowSize":str(xlFile[sh].values.shape[0]),
        "colSize":str(xlFile[sh].values.shape[1]),
        "sheetIdx":shidx,
        "sheetName":sh,
        "fileName":filename,
        "fileNameOrg":filenameOrg
      }
    )

  return jsonify({'data': json.dumps(retList)})


@app.route('/collectSheetData/<fileName>/<fileNameOrg>/<sheetIdx>/<sheetName>/<rowId>')
def collectSheetData(fileName, fileNameOrg, sheetIdx, sheetName, rowId):
  sheet = pd.read_excel("tmp/"+fileName, sheetName)
  colId = 0

  if rowId == "0":
    row = sheet.columns
  else:
    row = sheet.values[int(rowId)-1]

  for cell in row:
    colId = colId + 1
    # a = str(cell)
    dataA = DataA()
    dataA.file_key = fileName.split(".")[0]
    dataA.file_name = fileNameOrg
    dataA.file_name_org = fileNameOrg
    dataA.sheet_idx = sheetIdx
    dataA.sheet_name_org = sheetName
    dataA.data_name = sheetName
    dataA.row_id = rowId
    dataA.col_id = colId
    dataA.value_char = str(cell)
    dataA.is_row_header = "N"
    dataA.is_col_header = "N"
    db.session.add(dataA)

  db.session.commit()

  retList = []
  retList.append(
    {
      "fileName" : fileName, 
      "fileNameOrg" : fileNameOrg, 
      "sheetIdx" : sheetIdx, 
      "sheetName" : sheetName, 
      "rowId" : rowId
    }
  )

  # membersArray = members.split(",")
  # try:
  #   DutyMembers.query.filter( 
  #     DutyMembers.project_id==projectId,
  #     DutyMembers.duty_date ==dutyDate
  #   ).delete()

  #   for memberId in membersArray:
  #     if isfloat(memberId):
  #       dutyMembers = DutyMembers()
  #       dutyMembers.project_id = projectId
  #       dutyMembers.duty_date = dutyDate
  #       dutyMembers.member_id = memberId
  #       db.session.add(dutyMembers)
  #       db.session.commit()

  # except:
  #   ret=1

  return jsonify({'data': json.dumps(retList)})







@app.route('/getDataSetList/<rowId>/<colId>')
def getDataSetList(rowId, colId):
  sql = ""
  sql = sql + "  select                     "
  sql = sql + "      *                      "
  sql = sql + "  from                       "
  sql = sql + "      data_a                 "
  sql = sql + "  where                      "
  sql = sql + "      row_id = " + rowId + "  "
  sql = sql + "      and col_id = " + colId + "  "
  sql = sql + "  order by                   "
  sql = sql + "      file_key               "
  sql = sql + "      , sheet_idx            "
  sql = sql + "      , row_id               "
  sql = sql + "      , col_id;              "

  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "data_name":d["data_name"],
        "value_char":d["value_char"],
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})


@app.route('/getDataLabelList')
def getDataLabelList():
  sql = ""
  sql = sql + "  select                                                                                                                                      "
  sql = sql + "      replace(value_char,' ','') value_char                                                                                                   "
  sql = sql + "      , count(1) data_count                                                                                                                   "
  sql = sql + "  from                                                                                                                                        "
  sql = sql + "      data_a                                                                                                                                  "
  sql = sql + "  where                                                                                                                                       "
  sql = sql + "      replace (replace (replace (replace (replace (replace (replace (replace (replace (replace (replace (replace (trim(value_char),           "
  sql = sql + "      '0', ''), '1', ''), '2', ''), '3', ''), '4', ''), '5', ''), '6', ''), '7', ''), '8', ''), '9', ''), '.', ''), '-', '') <> '' and        "
  sql = sql + "      trim(value_char) not like '%Unnamed%' and                                                                                               "
  sql = sql + "      trim(value_char) <> 'nan' and                                                                                                           "
  sql = sql + "      length(trim(value_char)) <= 20                                                                                                          "
  sql = sql + "  group by                                                                                                                                    "
  sql = sql + "      replace(value_char,' ','')                                                                                                              "
  sql = sql + "  order by data_count desc                                                                                                                    "

  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "value_char":d["value_char"],
        "data_count":d["data_count"],
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})



# getSampleValueList

@app.route('/getSampleValueList/<sampleValue>')
def getSampleValueList(sampleValue):
  sql = ""  
  sql = sql + "    with a as (                                     "
  sql = sql + "        select                                      "
  sql = sql + "            file_key                                "  
  sql = sql + "            , sheet_idx                             "  
  sql = sql + "            , row_id                                "  
  sql = sql + "            , col_id                                "  
  sql = sql + "        from                                        "  
  sql = sql + "            data_a                                  "  
  sql = sql + "        where                                       "  
  sql = sql + "            value_char = '" + sampleValue + "'      "  
  sql = sql + "    )                                               "  
  sql = sql + "    select                                          "  
  sql = sql + "        b.*                                         "  
  sql = sql + "    from                                            "  
  sql = sql + "        a join data_a b                             "  
  sql = sql + "            on a.file_key = b.file_key              "  
  sql = sql + "            and a.sheet_idx = b.sheet_idx           "  
  sql = sql + "            and a.row_id = b.row_id                 "  
  sql = sql + "            and a.col_id <= b.col_id                "  
  sql = sql + "    where                                           "  
  sql = sql + "        b.value_char <> 'nan'                       "  
  sql = sql + "    order by                                        "  
  sql = sql + "        file_key                                    "  
  sql = sql + "        , sheet_idx                                 "  
  sql = sql + "        , row_id                                    "  
  sql = sql + "        , col_id                                    "  

    
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "row_id":d["row_id"],
        "col_id":d["col_id"],
        "file_name_org":d["file_name_org"],
        "data_name":d["data_name"],
        "value_char":d["value_char"],
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})


@app.route('/getSheetData/<fileKey>/<sheetIdx>')
def getSheetData(fileKey, sheetIdx):
  sql = ""
  sql = sql + "    select                       "
  sql = sql + "        row_id                   "
  sql = sql + "        , col_id                 "
  sql = sql + "        , value_char             "
  sql = sql + "        , is_row_header          "
  sql = sql + "        , is_col_header          "
  sql = sql + "    from                         "
  sql = sql + "        data_a                   "
  sql = sql + "    where                        "
  sql = sql + "        file_key = '" + fileKey + "' and "
  sql = sql + "        sheet_idx = " + sheetIdx + " "
  sql = sql + "    order by                   "
  sql = sql + "        row_id asc,            "
  sql = sql + "        col_id asc             "
    
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "row_id":d["row_id"],
        "col_id":d["col_id"],
        "is_row_header":d["is_row_header"],
        "is_col_header":d["is_col_header"],
        "value_char":d["value_char"],
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})



@app.route('/updateHeaderY/<fileKey>/<sheetIdx>/<rowIdx>/<collIdx>/<direction>')
def updateHeaderY(fileKey, sheetIdx, rowIdx, collIdx, direction):

  if direction == "R":
    dataAs = DataA.query.filter(DataA.file_key==fileKey, DataA.sheet_idx==sheetIdx, DataA.row_id == rowIdx).all()
    for dataA in dataAs:
      dataA.is_row_header = 'Y'

  if direction == "C":
    dataAs = DataA.query.filter(DataA.file_key==fileKey, DataA.sheet_idx==sheetIdx, DataA.col_id == collIdx).all()
    for dataA in dataAs:
      dataA.is_col_header = 'Y'

  db.session.commit()

  return jsonify({'data': 1})


@app.route('/deleteRowOrColumn/<fileKey>/<sheetIdx>/<rowIdx>/<collIdx>/<direction>')
def deleteRowOrColumn(fileKey, sheetIdx, rowIdx, collIdx, direction):
  # dataAs = DataA.query.filter(DataA.file_key==fileKey, DataA.sheet_idx==sheetIdx).all()
  # for dataA in dataAs:
  #   dataA.data_name = DataNameValue

  # db.session.commit()
  if direction == "R":
    DataA.query.filter( 
      DataA.file_key==fileKey,
      DataA.sheet_idx==sheetIdx,
      DataA.row_id==rowIdx
    ).delete()

    dataAs = DataA.query.filter(DataA.file_key==fileKey, DataA.sheet_idx==sheetIdx, DataA.row_id > rowIdx).all()
    for dataA in dataAs:
      dataA.row_id = dataA.row_id-1

  if direction == "C":
    DataA.query.filter( 
      DataA.file_key==fileKey,
      DataA.sheet_idx==sheetIdx,
      DataA.col_id==collIdx
    ).delete()

    dataAs = DataA.query.filter(DataA.file_key==fileKey, DataA.sheet_idx==sheetIdx, DataA.col_id > collIdx).all()
    for dataA in dataAs:
      dataA.col_id = dataA.col_id-1

  db.session.commit()

  # envvariable = EnvVariable()
  # envvariable.pid = projectId
  # envvariable.key = "userName"
  # envvariable.code = userId
  # envvariable.value = ret
  # db.session.add(envvariable)


  return jsonify({'data': 1})

@app.route('/updateSheetDataName/<fileKey>/<sheetIdx>/<DataNameValue>')
def updateSheetDataName(fileKey, sheetIdx, DataNameValue):
  dataAs = DataA.query.filter(DataA.file_key==fileKey, DataA.sheet_idx==sheetIdx).all()
  for dataA in dataAs:
    dataA.data_name = DataNameValue

  db.session.commit()
  # EnvVariable.query.filter( 
  #   EnvVariable.pid==projectId,
  #   EnvVariable.key=="userName",
  #   EnvVariable.code==userId
  # ).delete()

  # envvariable = EnvVariable()
  # envvariable.pid = projectId
  # envvariable.key = "userName"
  # envvariable.code = userId
  # envvariable.value = ret
  # db.session.add(envvariable)

  # db.session.commit()

  return jsonify({'data': 1})


@app.route('/getSheetNameList/<fileKey>')
def getSheetNameList(fileKey):
  sql = ""
  sql = sql + "    select                     "
  sql = sql + "        sheet_idx              "
  sql = sql + "        , sheet_name_org       "
  sql = sql + "        , data_name            "
  sql = sql + "        , file_key             "
  sql = sql + "    from                       "
  sql = sql + "        v_sheet_name           "
  sql = sql + "    where                      "
  sql = sql + "        file_key = '" + fileKey + "' "
  sql = sql + "    order by                   "
  sql = sql + "        sheet_idx asc          "
    
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "sheet_idx":d["sheet_idx"],
        "sheet_name_org":d["sheet_name_org"],
        "data_name":d["data_name"],
        "file_key":d["file_key"],
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})



@app.route('/getFileNameList')
def getFileNameList():
  sql = ""
  sql = sql + "    select                     "
  sql = sql + "        file_name              "
  sql = sql + "        , file_name_org        "
  sql = sql + "        , file_key             "
  sql = sql + "    from                       "
  sql = sql + "        v_file_name            "
  sql = sql + "    order by                   "
  sql = sql + "        file_key desc          "
    
  datalist = []
  resultset=[]
  datalist = db.session.execute(text(sql)).fetchall()

  for d in datalist:
    resultset.append(
      {
        "file_name":d["file_name"],
        "file_name_org":d["file_name_org"],
        "file_key":d["file_key"],
      }
    )

  return jsonify({'data': json.dumps(resultset,default=decimal_default_proc)})










@app.route('/getProjects/')
@login_required
def getProjects():
  return str(session["project_id"])


@app.route('/collectBaseData/<projectId>/<issueId>')
@login_required
def collectBaseData(projectId, issueId):
  redmine = Redmine(session["redmine_url"], key=current_user.api_key) #session["redmine_url"]

  # 初回のみ最大登録番号を取得
  if int(issueId) == 0:
    issueId = getMaxIssueId(projectId)

  issue = None

  try:
    issueId = int(issueId) + 1
    issue = redmine.issue.get(issueId)

    if issue.project.id == int(projectId):
      pass
    else:
      issue = None

  except:
    issue = None
  
  if issueId > 999999:
    issue = None
  

  if issue != None:
    insertIssueSubjects(issue, projectId)

  if issueId > 999999:
    returnStatus = 0
  else:
    returnStatus = issueId
  # # startDate += delta
  
  return str(returnStatus)





def tryAunthenticationDemo(userId, password):

  try:

    id = random.randint(1, 9999999999999999)
    users[id] = User(id, id, userId,password) 
    login_user(users[id])
    session["api_key"] = password
    session["user_nm"] = userId
    # session["redmine_url"] = redmine.url
    # session["project_id"] = env.pid

    return True
    
  except:
    return False


# ログインしないと表示されないパス
@app.route('/protected/')
@login_required
def protected():
    return Response('''
    protected<br />
    <a href="/logout/">logout</a>
    ''')

# ログインパス
@app.route('/', methods=["GET", "POST"])
@app.route('/login/', methods=["GET", "POST"])
def login():
  
  session.permanent = True
  app.permanent_session_lifetime = timedelta(minutes=30)
  if(request.method == "POST"):
    # try:
    #   msg = create_message(mail_address, mail_address, "", "LatteCloudログイン試行", request.form["username"] + ", " + request.form["password"])
    #   send(mail_address, mail_address, mail_password, msg)
    # except:
    #   # 何もしない
    #   import traceback
    # traceback.print_exc()
    # ユーザーチェック
    apikey = request.form["api_key"]
    try:
      # redmine = Redmine(session["redmine_url"], key=apikey) #APIキーで認証を試みる session["redmine_url"]

      session["api_key"] = "dummy"
      session["user_nm"] = "dummy"
      session["redmine_url_key"] = "dummy"

      if False: #tryAunthentication(request.form["api_key"], request.form["user_nm"]):

        return render_template('index.haml', result=str(session["project_id"]))

      else:
        return render_template("login.haml", result=901)

    except:
      # ログイン画面へ返す
      return render_template("login.haml", result=902)

  else:
    return render_template("login.haml")
    # return render_template('manager.haml', result=1)

# ログアウトパス
@app.route('/logout/')
def logout():
  logout_user()
  session["api_key"] = "dummy"
  session["user_nm"] = "dummy"
  session["redmine_url_key"] = "dummy"
  
  return render_template("login.haml")



  # for nen in ["h22","h23","h24","h25","h26","h27","h28","h29","h30"]:
  #   res = requests.get("https://www.soumu.go.jp/iken/zaisei/jyoukyou_shiryou/" + nen + "/index.html")
  #   soup = BeautifulSoup(res.text, 'html.parser')
  #   result = soup.select("a[href]")
  #   link_list =[]
  #   for link in result:
  #     href = link.get("href")
  #     link_list.append(href)
  #     xl_list = [temp for temp in link_list if temp.endswith('xlsx')]

  #   for xlfile in xl_list:
  #     # fi = request.files['excelFile']
  #     res = requests.get("https://www.soumu.go.jp" + xlfile)
  #     # xl = pd.read_excel(fi, sheet_name=None)
  #     xl = pd.read_excel(res.content, sheet_name=None)
  #     fileshubetu = fileShubetu(xl)

  #     if fileshubetu=="sisetu":
  #       createSisetuMain(xl)
  #     elif fileshubetu=="sokatu":
  #       createSokatuMain(xl)
  #       pass
  #     else:
  #       pass





@app.route('/demo/', methods=["GET", "POST"])
def demoLogin():
  
  session.permanent = True
  app.permanent_session_lifetime = timedelta(minutes=30)
  if(request.method == "POST"):
    # try:
    #   msg = create_message(mail_address, mail_address, "", "LatteCloudログイン試行", request.form["username"] + ", " + request.form["password"])
    #   send(mail_address, mail_address, mail_password, msg)
    # except:
    #   # 何もしない
    #   import traceback
    # traceback.print_exc()
    # ユーザーチェック
    password = str(random.randint(1, 9999999999999999)) #request.form["api_key"]
    try:
      # redmine = Redmine(session["redmine_url"], key=apikey) #APIキーで認証を試みる session["redmine_url"]

      session["api_key"] = "dummy"
      session["user_nm"] = "dummy"
      session["redmine_url_key"] = "dummy"

      if tryAunthenticationDemo("demo", password):

        return render_template('index.haml', result="demo")

      else:
        return render_template("login.haml", result=901)

    except:
      # ログイン画面へ返す
      return render_template("login.haml", result=902)

  else:
    return render_template("login.haml")
    # return render_template('manager.haml', result=1)



if __name__ == "__main__":
    app.run(debug=True)
