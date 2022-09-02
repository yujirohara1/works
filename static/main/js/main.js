/*
|| バニラで書いていく。
*/

window.onload = function(){
  try{
    //google.charts.load('current', {'packages':['line']});
    //google.charts.load('current', {packages: ['corechart', 'bar']});
    google.charts.load("current", {packages:["corechart"]});
    
    createProjectIdList();
    createYearList();
    

    //日付の初期値
    let a = new Date(); 
    a.setDate(a.getDate() - 10);
    document.getElementById("inpMeasureStartDate").value = formatDate(a,"yyyy-MM-dd"); //"2021-04-01";
    document.getElementById("inpMeasureEndDate").value = formatDate(new Date(),"yyyy-MM-dd"); //"2021-12-31";

    //openErrorMessageDialog("aaa");

  }catch(e){
    //document.getElementById("divLabelProcessing0").innerText = e.message;
    openErrorMessageDialog(e.message);
  }
  return;
}

function createDutyMemberModal(){
  var projectId = document.getElementById("selectProjectMain").value; //"customer_support_records";

  fetch('/getTodaysMembers/' + projectId  + "/" + formatDate(new Date(),"yyyy-MM-dd"), {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    //<span class="badge rounded-pill bg-primary">Primary</span>
    if(list.length==0){
      var modal = new bootstrap.Modal(document.getElementById('modalTodaysMembersSetting'), {
        keyboard: false
      });
      modal.show();
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    openErrorMessageDialog(error);

  });
  
}


function openErrorMessageDialog(errorDetail){
  var modal = new bootstrap.Modal(document.getElementById('modalErrorMessage'), {
    keyboard: false
  });
  document.getElementById("divErrorDetail").innerText = errorDetail; 
  modal.show();
}


document.getElementById("btnUpdateTodaysMember").addEventListener('click', function() {
  let targets = document.querySelectorAll("[id^='chkTodaysMember_']");
  let members = "";
  for(let i in targets){
    if(targets[i].tagName == "INPUT"){
      if(targets[i].checked==true){
        members = members + "," + targets[i].value;
      }
    }
  }
  if(members!=""){
    var projectId = document.getElementById("selectProjectMain").value; //"customer_support_records";
     //"2021-04-01";

    fetch('/UpdateTodaysMember/' + projectId + "/" + formatDate(new Date(),"yyyy-MM-dd") + "/" + members, {
      method: 'GET',
      'Content-Type': 'application/json'
    })
    .then(res => res.json())
    .then(value => {
      if(value==0){
        destroyTableLoading("divTodaysMemberSettingTableArea");
        document.getElementById("modalTodaysMembersSettingTitle").innerText = "登録しました。";
        document.getElementById("divTodaysMemberSettingTableArea").innerText = "ご協力ありがとうございました。";
        document.getElementById("btnCloseTodaysMember").innerText = "閉じる";
        setDisabledStatus_UpdateTodaysMemberbutton();
      }
    })
    .catch(error => { 
      //document.getElementById("divLabelProcessing0").innerText = error;//console.log(error); 
      openErrorMessageDialog(error);
  });

  }

  //createIssuesTable();
});

function setDisabledStatus_UpdateTodaysMemberbutton(){
  document.getElementById("btnUpdateTodaysMember").classList.add("disabled");
  let targets = document.querySelectorAll("[id^='chkTodaysMember_']");
  try{
    for(let i in targets){
      if(targets[i].tagName == "INPUT"){
        if(targets[i].checked==true){
          document.getElementById("btnUpdateTodaysMember").classList.remove("disabled");
          return;
        }
      }
    }
  }catch(e){
    ;
  }
}


var modal = document.getElementById('modalTodaysMembersSetting')
modal.addEventListener('shown.bs.modal', function (event) {
  var projectId = document.getElementById("selectProjectSetting").value;
  createTableLoading("divTodaysMemberSettingTableArea","ユーザ情報を収集中・・・")

  fetch('/getUserInfoAndTodaysDuty/' + projectId + "/" + formatDate(new Date(),"yyyy-MM-dd"), {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divTodaysMemberSettingTableArea");

    var ul = document.createElement('ul');
    //ul.classList.add("list-group");
    ul.style.listStyle="None";
    document.getElementById("divTodaysMemberSettingTableArea").style.textAlign="Left";
    for(let i in list){
      if(list[i].user_nm.indexOf("dummy")!=0 && list[i].user_nm.indexOf("unknown")!=0){
        var li = document.createElement('li');
        var chk = document.createElement('input');
        chk.classList.add("form-check-input","me-1");
        chk.type="checkbox";
        chk.id = "chkTodaysMember_" + list[i].user_id;
        chk.value = list[i].user_id;
        if(list[i].today_on!=null){
          chk.checked = true;
        }
        chk.addEventListener('change', function() {
          setDisabledStatus_UpdateTodaysMemberbutton();
        });
        li.appendChild(chk);
        var lbl = document.createElement('label');
        lbl.innerText = list[i].user_nm;
        lbl.id = "lblTodaysMember_" + list[i].user_id;
        setAttributes(lbl,"for," + "chkTodaysMember_" + list[i].user_id);
        li.appendChild(lbl);
        ul.appendChild(li);
      }
    }
    document.getElementById("divTodaysMemberSettingTableArea").appendChild(ul);
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    openErrorMessageDialog(error);
  });
})



var modal = document.getElementById('modalEnterStatus')
modal.addEventListener('show.bs.modal', function (event) {

  var projectId = document.getElementById("selectProjectMain").value;
  createTableLoading("divEnterStatusTableArea","入場状況を確認中・・・")

  fetch('/getEnterIssue/' + projectId , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divEnterStatusTableArea");

    var hdText = ["#", "担当", "開始日", "更新日時", "表題1", "表題2", "経過時間"];
    var hdColWidth = ["5%","13%","10%","16%","20%","28%","8%"];
    var tableId = initTable("divEnterStatusTableArea", hdText, hdColWidth,2.0);
    var tbody = document.getElementById(tableId+"Body");

    for(let i in list){
      var trow = document.createElement('tr');
      var td1 = document.createElement('td');
      var td2 = document.createElement('td');
      var td3 = document.createElement('td');
      var td4 = document.createElement('td');
      var td5 = document.createElement('td');
      var td6 = document.createElement('td');
      var td7 = document.createElement('td');
      td1.appendChild(createOriginalIssueLink(list[i].issueId, list[i].orginalUrl));
      td2.innerText = list[i].assignedTo;
      td3.innerText = list[i].startDate;
      td4.innerText = list[i].updatedOn;
      td5.innerText = list[i].customerId;
      td6.innerText = list[i].subject;
      td7.innerText = "hoge";
      td1.classList.add("tdcell-center");
      td2.classList.add("tdcell-left");
      td3.classList.add("tdcell-center");
      td4.classList.add("tdcell-left");
      td5.classList.add("tdcell-left");
      td6.classList.add("tdcell-left");
      td7.classList.add("tdcell-center");
      trow.appendChild(td1);
      trow.appendChild(td2);
      trow.appendChild(td3);
      trow.appendChild(td4);
      trow.appendChild(td5);
      trow.appendChild(td6);
      trow.appendChild(td7);
      tbody.appendChild(trow);
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    openErrorMessageDialog(error);
  });
  
  // var hdText = ["a", "b", "c", "d"];
  // var hdColWidth = ["35%","20%","20%","25%"];
  // var tableId = initTable("divEnterStatusTableArea", hdText, hdColWidth,2.5);
  // var tbody = document.getElementById(tableId+"Body");

  //fetchEnterIssue(projectId, 0, tbody);
  
})


function createOriginalIssueLink(id, link){
  var linkA = document.createElement("a");
  linkA.innerText = id;
  linkA.href = link;
  linkA.target = "_blank";
  return linkA;
}


function spanDefaultDutyBadgeStyle(spanA, memberNm, cnt1, cnt2){
  //var spanA = document.createElement("div");
  spanA.innerText = "";
  spanA.classList.remove("badge","progress-bar","progress-bar-striped","progress-bar-animated","bg-success");//"rounded-pill",
  spanA.classList.add("badge","bg-warning","text-dark");//"rounded-pill",
  spanA.style.marginLeft="5px";
  spanA.style.marginRight="5px";
  spanA.style.fontSize="0.8rem";
  spanA.style.cursor="pointer";

  var txtA = document.createTextNode(memberNm.substring(0,6));
  var txtB = document.createTextNode("｜引受");
  var txtC = document.createTextNode(cnt1);
  var txtD = document.createTextNode("｜完了");
  var txtE = document.createTextNode(cnt2);
  spanA.appendChild(txtA);
  spanA.appendChild(txtB);
  spanA.appendChild(txtC);
  spanA.appendChild(txtD);
  spanA.appendChild(txtE);

  //return spanA;

}

function spanLoadingDutyBadgeStyle(spanA){
  var width = spanA.offsetWidth;
  spanA.classList.remove("badge","bg-warning","text-dark");//"rounded-pill",
  spanA.classList.add("badge","progress-bar","progress-bar-striped","progress-bar-animated","bg-success");//"rounded-pill",
  spanA.style.display = "inline-flex";
  spanA.style.cursor="";
  spanA.innerText = "更新中...";
  spanA.style.width = width + "px";
}

function returnDutyBadge(memberId, memberNm, dutyCount, finishedCount){
  var spanA = document.createElement("div");
  spanDefaultDutyBadgeStyle(spanA, memberNm, dutyCount, finishedCount);

  spanA.addEventListener('click', function() {
    //alert(memberId);
    spanLoadingDutyBadgeStyle(spanA);
    
    var projectId = document.getElementById("selectProjectMain").value; //"customer_support_records";
    fetch('/getDutyStatusByMemberId/' + projectId  + "/" + formatDate(new Date(),"yyyy-MM-dd") + "/" + memberId, {
      method: 'GET',
      'Content-Type': 'application/json'
    })
    .then(res => res.json())
    .then(jsonData => {
      var list = JSON.parse(jsonData.data);
      dutyCount = list[0].duty_count;
      finishedCount = list[0].finished_count;
      spanDefaultDutyBadgeStyle(spanA, memberNm, dutyCount, finishedCount);
      // spanA.appendChild(txtE);
    })
    .catch(error => { 
      //document.getElementById("divLabelProcessing0").innerText = error;
      openErrorMessageDialog(error);
    });
  return;
  });

  return spanA;
}

function createTodaysMembersBadgeArea(){
  var projectId = document.getElementById("selectProjectSetting").value;
  document.getElementById("divTodaysMembersArea").innerText = "";
  fetch('/getTodaysMembers/' + projectId  + "/" + formatDate(new Date(),"yyyy-MM-dd"), {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    //<span class="badge rounded-pill bg-primary">Primary</span>
    // var spanA = document.createElement("span");
    // spanA.innerText = "本日";
    // // spanA.style.cursor = "pointer";
    // // spanA.style.color="blue";
    // // spanA.style.textDecoration = "underline";
    // document.getElementById("divTodaysMembersArea").appendChild(spanA);
    // var spanB = document.createElement("span");
    // spanB.innerText = "の担当";
    // document.getElementById("divTodaysMembersArea").appendChild(spanB);
    //%a.btn.btn-dark.btn-sm#btnOffCanvas(data-bs-toggle="offcanvas" href="#offcanvasSetting" aria-controls="offcanvasSetting" role="button" style="margin-right:10px")
    var aBtn = document.createElement("a");
    aBtn.classList.add("btn","btn-dark","btn-sm");
    aBtn.innerText = "本日の担当";
    aBtn.addEventListener('click', function() {
      var modal = new bootstrap.Modal(document.getElementById('modalTodaysMembersSetting'), {
        keyboard: false
      });
      modal.show();
    });
    document.getElementById("divTodaysMembersArea").appendChild(aBtn);
    if(list.length==0){
      var spanC = document.createElement("span");
      spanC.innerText = "：未設定";
      document.getElementById("divTodaysMembersArea").appendChild(spanC);
  } else{
      for(var i in list){
        document.getElementById("divTodaysMembersArea").appendChild(
          returnDutyBadge(
            list[i].member_id,
            list[i].member_nm,
            list[i].duty_count,
            list[i].finished_count
          )
        );
      }
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    openErrorMessageDialog(error);
  });

}

modal.addEventListener('hide.bs.modal', function (event) {
  createTodaysMembersBadgeArea();
})




function createChkAssignedContactRatio(){
  var divCol = document.getElementById("chkAssignedContactRatio");
  var projectId = document.getElementById("selectProjectSetting").value;

  fetch('/getUserNmList/' + projectId , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    for(let i in list){
      var divA = document.createElement("div");
      divA.classList.add("form-check","form-check-inline");
      var input = document.createElement("input");
      input.classList.add("form-check-input");
      setAttributes(input,"type,checkbox/name,inlineCheckOptions/checked");
      input.value = list[i].user_id;
      input.id = "chk_" + list[i].user_id;
      var label = document.createElement("label");
      label.classList.add("form-check-label");
      label.innerText = list[i].user_nm;
      setAttributes(label,"for,"+input.id);
      label.style.fontSize="12.5px";
      divA.appendChild(input);
      divA.appendChild(label);
      divCol.appendChild(divA);
    }
  })
  .catch(error => { 
    //return;
    openErrorMessageDialog(error);
  });
}

// //今日の日付データを変数hidukeに格納
// var hiduke=new Date(); 

// //年・月・日・曜日を取得する
// var year = hiduke.getFullYear();
// var month = hiduke.getMonth()+1;
// var week = hiduke.getDay();
// var day = hiduke.getDate();


/*
|| プロジェクトIDリストを作成
*/
function createProjectIdList(){

  
  fetch('/getProjects/', {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(value => {
    //alert(value);

    var select1 = document.getElementById("selectProjectSetting");
    for(let i in cProjectIdList){
      if(cProjectIdList[i].split(",")[0]==value){
        var option = document.createElement("option");
        option.value = cProjectIdList[i].split(",")[0];
        option.text = cProjectIdList[i].split(",")[1];
        select1.appendChild(option);
      }
    }
  
    var select0 = document.getElementById("selectProjectMain");
    for(let i in cProjectIdList){
      if(cProjectIdList[i].split(",")[0]==value){
        var option = document.createElement("option");
        option.value = cProjectIdList[i].split(",")[0];
        option.text = cProjectIdList[i].split(",")[1];
        select0.appendChild(option);
      }
    }
    createChkAssignedContactRatio();
    createDutyMemberModal();
    createTodaysMembersBadgeArea();
    createTotalRestCountBadge();

  
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    openErrorMessageDialog(error);
  });
  
}

/*
|| 年度リスト
*/
function createYearList(){
  var list = document.getElementById("yearlistOptions");
  for(let i in cYearList){
    var option = document.createElement("option");
    option.value = cYearList[i].split(",")[0];
    list.appendChild(option);
  }
}

/*
|| Date を 文字列にして返す
||
||   このようにして利用される想定
||   formatDate(date, 'yyyy-MM-dd')
*/
function formatDate (date, format) {
  format = format.replace(/yyyy/g, date.getFullYear());
  format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
  format = format.replace(/dd/g, ('0' + date.getDate()).slice(-2));
  format = format.replace(/HH/g, ('0' + date.getHours()).slice(-2));
  format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
  format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
  format = format.replace(/SSS/g, ('00' + date.getMilliseconds()).slice(-3));
  return format;
};


/*
|| HTMLTableを作る
*/
function initTable(tableDivId, hdText, hdWidth, heightRatio){
  var tableId = tableDivId.replace("div","htmlTable");
  var table = document.createElement("table");
  table.id = tableId;

  var thead = document.createElement('thead');
  var tbody = document.createElement('tbody');
  tbody.id = tableId + "Body";
  thead.appendChild(createTableHeader(hdText, hdWidth));

  table.appendChild(thead);
  table.appendChild(tbody);

  table.classList.add("table", "table-bordered", "table_sticky", "table-hover", "fs-6");
  table.style.height = "calc(100vh/" + heightRatio + ")";

  var tmp = document.getElementById(tableDivId);
  while(tmp.lastChild){
    tmp.removeChild(tmp.lastChild);
  }

  document.getElementById(tableDivId).appendChild(table);

  return tableId;
}


//テーブルの見出し行を作成する。戻したDOMはtheadにappendされる想定。
function createTableHeader(hdText, width){
  let trow = document.createElement('tr');
  for (let hd in hdText){
    var thA = document.createElement('th');
    thA.innerHTML = hdText[hd];
    thA.style.textAlign = "center";
    thA.style.verticalAlign = "middle";
    if(width!=null){
      try{thA.style.width=width[hd];}catch(e){
        openErrorMessageDialog(e.message);
      }
    }
    trow.appendChild(thA);
  }
  return trow;
}

function createBlankRow(list){
  var trow = document.createElement('tr');
  var tdataA = document.createElement('td');
  var tdataB = document.createElement('td');
  var tdataC = document.createElement('td');
  var tdataD = document.createElement('td');

  tdataA.innerHTML = "&nbsp";
  tdataA.classList.add("cell-loading");
  tdataB.classList.add("cell-loading");
  tdataC.classList.add("cell-loading");
  tdataD.classList.add("cell-loading");
  
  trow.appendChild(tdataA);
  trow.appendChild(tdataB);
  trow.appendChild(tdataC);
  trow.appendChild(tdataD);
  return trow;
}


function createBlankRowB(list){
  var trow = document.createElement('tr');
  var tdataA = document.createElement('td');
  var tdataB = document.createElement('td');
  var tdataC = document.createElement('td');
  var tdataD = document.createElement('td');

  tdataA.innerHTML = "&nbsp";
  tdataA.classList.add("cell-loading");
  tdataB.classList.add("cell-loading");
  tdataC.classList.add("cell-loading");
  tdataD.classList.add("cell-loading");
  
  trow.appendChild(tdataA);
  trow.appendChild(tdataB);
  trow.appendChild(tdataC);
  trow.appendChild(tdataD);
  return trow;
}



// テーブル内のデータが表示されるまでの間、小さいローダーを枠内に表示
function createTableLoading(locationId, messageLabel){
  var tmp = document.getElementById(locationId);
  if(tmp!=null){
    while(tmp.lastChild){
      tmp.removeChild(tmp.lastChild);
    }
  }
  let tableDiv = document.createElement('div');
  tableDiv.classList.add("loadingDiv");
  document.getElementById(locationId).style.height = "calc(100vh/3)";
  //tableDiv.id = tableDivId;
  let messageDiv = document.createElement('div');
  messageDiv.id = locationId + "Caption";
  messageDiv.innerText = messageLabel
  document.getElementById(locationId).appendChild(messageDiv);
  document.getElementById(locationId).appendChild(tableDiv);
}



function createHTMLTooltip_IncidentCountDetail(countOfIncindence, mDate){
  var div = document.createElement('div');
  div.style.width = "120px";
  div.style.textAlign = "center";
  var div1 = document.createElement('div');
  div1.innerText = mDate
  div1.style.fontWeight = "bold";
  div1.style.fontSize = "15px";
  var div2 = document.createElement('div');
  div2.innerText = "発生数：" + countOfIncindence;
  div2.style.fontWeight = "bold";
  div2.style.fontSize = "17px";

  div.appendChild(div1);
  div.appendChild(div2);

  return div.outerHTML;
  //var tr = document.createElement('tr');

}




function createHTMLTooltip_FinishedCountDetail(dbStr, total, mDate){
  var div = document.createElement('div');
  var title = document.createElement("div");
  title.innerText = mDate;
  title.style.textAlign="center";
  title.style.fontWeight="bold";
  title.style.fontSize="14px";
  div.appendChild(title);
  var table = document.createElement('table');
  table.style.width = "140px";
  table.style.fontSize="13.5px";
  table.style.fontWeight="bold";
  //table.classList.add("table", "table-bordered", "table_sticky", "table-hover", "fs-6");
  table.classList.add("table","table-primary");
  if(dbStr==null){return;}
  var datalist = dbStr.split(",");
  for(let i in datalist){
    var datas = datalist[i].split(":");
    if(datas.length == 2){
      var tr = document.createElement('tr');
      tr.classList.add( toolTipTableRowColors[(i%7)] );
      var tdA = document.createElement('td');
      tdA.innerText = datas[0];
      var tdB = document.createElement('td');
      tdB.innerText = datas[1];
      tdB.style.textAlign="right";
      tr.appendChild(tdA);
      tr.appendChild(tdB);
      table.appendChild(tr);
    }
  }
  var tr = document.createElement('tr');
  tr.classList.add("table-dark");
  var tdA = document.createElement('td');
  tdA.innerText = "total"
  var tdB = document.createElement('td');
  tdB.innerText = total;
  tdB.style.textAlign="right";
  tr.appendChild(tdA);
  tr.appendChild(tdB);
  table.appendChild(tr);

  div.appendChild(table);

  return div.outerHTML;
  //var tr = document.createElement('tr');

}

var dailyIssueCountList = [];
var ruisekiSai = 0;
function fetchDailyIssuesAndRefreshRecentRow(projectId, measureDate, endDate, tbody, reget){
  var issueStatus = 5;
  var strDate = formatDate(measureDate,"yyyy-MM-dd");
  
  fetch('/getIssues/' + projectId + "/" + strDate + "/" +  issueStatus + "/" +  reget, {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    //↓これはchartのデータソースにするために溜める。googlechartには配列で渡す必要がある。
    dailyIssueCountList.push([ 
      new Date(list[0].measureDate),
      list[0].countOfIncindence,
      createHTMLTooltip_IncidentCountDetail(list[0].countOfIncindence, list[0].measureDate),
      list[0].countOfFinish,
      createHTMLTooltip_FinishedCountDetail(list[0].finished_tooltip, list[0].countOfFinish, list[0].measureDate)
    ]);
    document.getElementById("divLabelProcessing2").innerText = list[0].projectId + "," + list[0].measureDate + "," + list[0].countOfIncindence + "," + list[0].countOfFinish;

    ruisekiSai = ruisekiSai + (list[0].countOfFinish - list[0].countOfIncindence);
    rowObj = tbody.firstElementChild;
    rowObj.cells[0].innerText = list[0].measureDate;
    rowObj.cells[1].innerText = list[0].countOfIncindence;
    rowObj.cells[2].innerText = list[0].countOfFinish;
    rowObj.cells[3].innerText = ruisekiSai; //"a"; //list[0].countOfFinish;
    rowObj.cells[0].classList.remove("cell-loading");
    rowObj.cells[1].classList.remove("cell-loading");
    rowObj.cells[2].classList.remove("cell-loading");
    rowObj.cells[3].classList.remove("cell-loading");
    rowObj.cells[0].classList.add("tdcell-center");
    rowObj.cells[1].classList.add("tdcell-center");
    rowObj.cells[2].classList.add("tdcell-center");
    rowObj.cells[3].classList.add("tdcell-center");

    var nextDate = getNextweekday(measureDate); //measureDate.setDate();
    //loopDate = new Date(nextDate);
    if (nextDate <= endDate){
      //終わるまで再帰的に呼び続ける
      fetchDailyIssuesAndRefreshRecentRow(projectId, nextDate, endDate, tbody, false)
      google.charts.setOnLoadCallback(drawDailyCountchart(dailyIssueCountList, projectId));
    }else{
      google.charts.setOnLoadCallback(drawDailyCountchart(dailyIssueCountList, projectId));
      return;
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    openErrorMessageDialog(error);
  });

  tbody.insertBefore(createBlankRow(null), tbody.firstElementChild);
}

//次の平日を返す
function getNextweekday(currentDate){
  var nextDate = currentDate;

  while(true){
    nextDate.setDate(nextDate.getDate() + 1);

    if(1 <= nextDate.getDay() && nextDate.getDay() <= 5 && !isHoliday(nextDate)){
      break;
    }
  }
  return nextDate;
}

//土日以外の祝祭日
function isHoliday(date){
  return JapaneseHolidays.isHoliday(date);
}

function isDate(str){
  return !isNaN(new Date(str).getTime())
}

function createIssuesTable() {
  var strDate1 = document.getElementById("inpMeasureStartDate").value;
  var strDate2 = document.getElementById("inpMeasureEndDate").value;

  if(!isDate(strDate1) || !isDate(strDate2)){
    document.getElementById("divLabelProcessing2").innerHTML = "<p style='color:red'>日付書式で入力してください。（ex. 2022-04-01, 2022/4/1 ） </p>"
    setTimeout('document.getElementById("divLabelProcessing2").innerText = ""; ', 1000);
    return;
  }

  var projectId = document.getElementById("selectProjectMain").value; //"customer_support_records";

  var startDate = new Date( strDate1 );
  var endDate = new Date( strDate2 );
  var hdText = ["計測月日", "発生数", "消化数", "貯金"];
  var hdColWidth = ["35%","20%","20%","25%"];
  var tableId = initTable("divMainTableAreaLeft", hdText, hdColWidth,2.5);
  var tbody = document.getElementById(tableId+"Body");
  dailyIssueCountList = []
  ruisekiSai = 0;

  fetchDailyIssuesAndRefreshRecentRow(projectId, startDate, endDate, tbody, true)

}

function createTotalRestCountBadge(){
  var btn = document.getElementById("btnRestIssueCount") ;
  btn.classList.remove("btn","btn-sm","btn-danger");
  btn.classList.add("spinner-border","text-danger");
  btn.innerText = "";
  var projectId = document.getElementById("selectProjectMain").value; //"customer_support_records";
  fetch('/getRestIssueCount/' + projectId , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(value => {
    btn.classList.remove("spinner-border","text-danger");
    btn.classList.add("btn","btn-sm","btn-danger");
    document.getElementById("btnRestIssueCount").innerText = "残チケット数：" + value;
  })
  .catch(error => { 
    openErrorMessageDialog(error);
  });

}


document.getElementById("btnModalEnterStatus").addEventListener('click', function() {
  var modal = new bootstrap.Modal(document.getElementById('modalEnterStatus'), {
    keyboard: false
  });
  modal.show();
});

document.getElementById("btnRestIssueCount").addEventListener('click', function() {
  createTotalRestCountBadge();
});

document.getElementById("btnGetAssignBarChart").addEventListener('click', function() {
  //createIssuesTable();
  createAssignedBarChart();
});

function createAssignedBarChart() {
  var barChartData = [];

  var projectId = document.getElementById("selectProjectMain").value; //"customer_support_records";
  var chkMembers = document.getElementById("chkAssignedContactRatio").children;
  var memberIds = "";
  for(let m in chkMembers){
    if(!isNaN(m)){
      if(chkMembers[m].firstChild.checked){
        memberIds = memberIds + chkMembers[m].firstChild.value + ","
      }
    }
  }
  var rdStatus = getRadioStatusContactRatio();

  createTableLoading("barchartMaterialArea","顧客接触割合グラフを作成中・・・")

  fetch('/getAssignedBarChartData/' + projectId + "/" + memberIds + "/" + rdStatus, {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    destroyTableLoading("barchartMaterialArea");
    var list = JSON.parse(jsonData.data);
    var assignedList = JSON.parse(jsonData.data2);

    document.getElementById('barchartMaterialArea').innerHTML = "";
  
    //barChartData.push(["customer_id","b","c","d"]);
    //barChartData.push(assignedList);
    var head = [];
    head.push("customer_id");
    for(var j in assignedList){
      head.push(assignedList[j]);
    }
    barChartData.push(head);

    for(var i in list){
      var a = [];
      a.push( edtCustomerName(list[i].customer_id) + "(" + list[i].total_count + ")");
      for(var j in assignedList){
        a.push(list[i][  assignedList[j] ]);
      }
      barChartData.push(a);
    }

    var chartHeight = list.length*20; //head.length*20;
    //google.charts.load('current', {packages: ['corechart', 'bar']});
    google.charts.setOnLoadCallback(function(){
      var data = google.visualization.arrayToDataTable(barChartData);
      var options = {
        title: 'Population of Largest U.S. Cities',
        isStacked: true,
        legend: {
          position:'right', 
          textStyle: {color: 'black', fontSize: 12, bold: false, italic: false}
        },
        // axes: {
        //   x: {
        //     0: { position: 'top', label: 'Percentage', textStyle:{fontSize:13}} // Top x-axis.
        //   }
        // },
        height: chartHeight, //3200,
        hAxis: {
          minValue: 0,
          textStyle:{
            fontSize:11.5,
            position:"top"
          },
          position:"top"
        },
        vAxis: {
          textStyle:{
            fontSize:11.5,
          }
        },
        chartArea:{top:20,height:"85%", width:"77%"},
      };
      var chart = new google.visualization.BarChart(document.getElementById('barchartMaterialArea'));
      chart.draw(data, options);
    });
    // var data = google.visualization.arrayToDataTable([
    //   ['City', '2010 Population', '2000 Population'],
    
    //alert(list);
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing4").innerText = error;//console.log(error); 
    openErrorMessageDialog(error);
  });
}


// function drawDailyCountchart(dataSource, projectId) {
//   //alert(dataSource);
// }
function edtCustomerName(str){
  var ret = str.trim();
  ret = ret.replace(" ","");
  ret = ret.replace("　","");
  ret = ret.replace(/\t/g, "");
  ret = ret.substring(0,10);
  return ret;
}


document.getElementById("btnGet").addEventListener('click', function() {
  createIssuesTable();
});


//環境変数更新ボタン
document.getElementById("btnUpdateOsEnvironValue").addEventListener('click', function() {
  //createIssuesTable();
  //htmlTableOsEnvironTableAreaBody から 送る文字列を作る
  var jsonVals = [];
  var tbody = document.getElementById("htmlTableOsEnvironTableAreaBody");
  for(let i=0; i<tbody.rows.length; i++){
    var key = tbody.rows[i].cells[0].innerText;
    var value = tbody.rows[i].cells[1].children[0].value;
    jsonVals.push({key:key, value:value});
  }

  var projectId = document.getElementById("selectProjectSetting").value; //"customer_support_records";
  fetch('/updateOsEnvironValue/' + projectId + "/" + JSON.stringify(jsonVals), {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(value => {
    alert(value);
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;//console.log(error); 
    openErrorMessageDialog(error);
  });

});


function wrapCustomFieldDefineId(val){
  if(val==""){
    return "dummy";
  }
  return val;
}

//カスタムフィールド更新ボタン
document.getElementById("btnUpdateCustomFieldsValue").addEventListener('click', function() {
  var projectId = document.getElementById("selectProjectSetting").value; 
  var defineStartDate =  wrapCustomFieldDefineId(document.getElementById("settingDefineStartDate").value);
  var defineFinishedDate =  wrapCustomFieldDefineId(document.getElementById("settingDefineFinishedDate").value);
  var defineCustomer =  wrapCustomFieldDefineId(document.getElementById("settingDefineCustomer").value);
  var defineAssignedTo =  wrapCustomFieldDefineId(document.getElementById("settingDefineAssignedTo").value);

  fetch('/UpdateCustomFieldsValue/' + projectId + "/" + defineStartDate + "/" + defineFinishedDate + "/" + defineCustomer + "/" + defineAssignedTo, {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(value => {
    alert(value);
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;//console.log(error); 
    openErrorMessageDialog(error);
  });

});


  
document.getElementById("btnGetMaxNo").addEventListener('click', function() {
  var projectId = document.getElementById("selectProjectSetting").value; //"customer_support_records";

  fetch('/getMaxIssueIdA/' + projectId, {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(value => {
    //var list = JSON.parse(jsonData.data);
    document.getElementById("inpMaxIssueId").value = value;

  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;//console.log(error); 
    openErrorMessageDialog(error);
  });

});

  
document.getElementById("btnGetRealMaxNo").addEventListener('click', function() {
  var projectId = document.getElementById("selectProjectSetting").value; //"customer_support_records";

  fetch('/getRealMaxIssueIdA/' + projectId, {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(value => {
    //var list = JSON.parse(jsonData.data);
    //document.getElementById("inpMaxIssueId").value = value;
    document.getElementById("inpRealMaxIssueId").value = value;
    //alert(value);

  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;//console.log(error); 
    openErrorMessageDialog(error);
  });
});

//getRealMaxIssueId

document.getElementById("btnGetCommitmentSummary").addEventListener('click', function() {
  createCommitmentSummaryTable();
});

document.getElementById("btnGetHotOrCold").addEventListener('click', function() {
  createHotOrColdTable();
});

document.getElementById("btnTextMining").addEventListener('click', function() {
  tryScrapeKiji();
});

function createHotOrColdTable(){
  
  var year = document.getElementById("inpYear").value;
  if(!cYearList.includes(year)){
    document.getElementById("divLabelProcessing3").innerHTML = "<p style='color:red'>入力された年度が不適切です。 </p>"
    setTimeout('document.getElementById("divLabelProcessing3").innerText = ""; document.getElementById("inpYear").value = ""; ', 1000);
    return;
  }

  var projectId = document.getElementById("selectProjectMain").value; //"customer_support_records";

  createTableLoading("divHotOrColdTableArea","ヒートマップを計算中・・・")

  fetch('/getHotOrColdSammary/' + projectId + "/" + year + "/" +  getRadioStatusHotOrCold(), {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    destroyTableLoading("divHotOrColdTableArea");
    var list = JSON.parse(jsonData.data);
    var hdText = cColumnList2;
    var hdColWidth = null;
    var tableId = initTable("divHotOrColdTableArea", hdText, hdColWidth, 2.5);
    var tbody = document.getElementById(tableId+"Body");
    for(let i in list){
      var trow = document.createElement('tr');
      var td1 = document.createElement('td');
      td1.innerText = list[i].month;
      trow.appendChild(td1);
      for(let d=1; d<=31; d++){
        td2 = document.createElement('td');
        td2.style.backgroundColor = getHotOrColdColorCode(list[i][d], getRadioStatusHotOrCold());
        td2.innerText = (list[i][d]==0 ? "":list[i][d]);
        trow.appendChild(td2);
      }
      tbody.appendChild(trow);
    }

  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;//console.log(error); 
    openErrorMessageDialog(error);
  });

}


document.getElementById("btnCollectData").addEventListener('click', function() {
  collectBaseData();
});


function collectBaseData() {
  var projectId = document.getElementById("selectProjectSetting").value; //"customer_support_records";
  var startId = document.getElementById("inpMaxIssueId").value;
  //if()
  fetchCollectData(projectId, Number(startId));
}



function fetchCollectData(projectId, issue_id){
  var realMax = Number(document.getElementById("inpRealMaxIssueId").value);
  var dbMax = Number(document.getElementById("inpMaxIssueId").value);
  if(realMax <= dbMax){
    return false;
  }

  fetch('/collectBaseData/' + projectId + "/" + issue_id , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(value => {
    //var list = JSON.parse(jsonData.data);
    document.getElementById("inpMaxIssueId").value = value;

    if (value != 0){
      //終わるまで再帰的に呼び続ける
      fetchCollectData(projectId, value)
    }else{
      return;
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    openErrorMessageDialog(error);
  });

  //tbody.insertBefore(createBlankRow(null), tbody.firstElementChild);
}
  

function fetchEnterIssue(projectId, issueId, tbody){
  
  fetch('/getEnterIssue/' + projectId + "/" + issueId, {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);

    rowObj = tbody.firstElementChild;
    rowObj.cells[0].innerText = list[0].a;
    rowObj.cells[1].innerText = list[0].b;
    rowObj.cells[2].innerText = list[0].c;
    rowObj.cells[3].innerText = list[0].d;
    rowObj.cells[0].classList.remove("cell-loading");
    rowObj.cells[1].classList.remove("cell-loading");
    rowObj.cells[2].classList.remove("cell-loading");
    rowObj.cells[3].classList.remove("cell-loading");
    rowObj.cells[0].classList.add("tdcell-center");
    rowObj.cells[1].classList.add("tdcell-center");
    rowObj.cells[2].classList.add("tdcell-center");
    rowObj.cells[3].classList.add("tdcell-center");

    var nextIssueId = list[0].e;
    if (nextIssueId != -1){
      //終わるまで再帰的に呼び続ける
      fetchEnterIssue(projectId, nextIssueId, tbody);
    }else{
      return;
    }
  })
  .catch(error => { 
    openErrorMessageDialog(error);
  });

  tbody.insertBefore(createBlankRowB(null), tbody.firstElementChild);
}

//
document.getElementById("btnGetLeverageSummary").addEventListener('click', function() {
  var projectId = document.getElementById("selectProjectMain").value; //"customer_support_records";
  createTableLoading("divLeverageTableArea","集計しています・・・")

  fetch('/getLeverageSummary/' + projectId , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divLeverageTableArea");

    var hdText = ["取引先名", "タイトル", "出現回数", "初回発生日", "直近発生日", "平均発生間隔", "次回発生日予想"];
    var hdColWidth = ["22%","22%","8%","12%","12%","12%","12%"];
    var tableId = initTable("divLeverageTableArea", hdText, hdColWidth,2.5);
    var tbody = document.getElementById(tableId+"Body");

    if(list.length>0){
      for(let i in list){
        var trow = document.createElement('tr');
        var td1 = document.createElement('td');
        var td2 = document.createElement('td');
        var td3 = document.createElement('td');
        var td4 = document.createElement('td');
        var td5 = document.createElement('td');
        var td6 = document.createElement('td');
        var td7 = document.createElement('td');
        td1.innerText = list[i].customer_id;
        td2.innerText = list[i].issue_subject;
        td3.innerText = list[i].incident_count;
        td4.innerText = list[i].min_start_date;
        td5.innerText = list[i].max_start_date;
        var average = Math.floor( dateDiff(list[i].max_start_date, list[i].min_start_date) / list[i].incident_count);
        td6.innerText = average + "日";
        //dt.setDate(dt.getDate() + 10);
        var recentDate = new Date(list[i].max_start_date);
        var nextDate = new Date(list[i].max_start_date);
        nextDate.setDate(nextDate.getDate() + average)
        td7.innerText = formatDate(nextDate,"yyyy-MM-dd");//nextDate;
        td1.classList.add("tdcell-left");
        td2.classList.add("tdcell-left");
        td3.classList.add("tdcell-right");
        td4.classList.add("tdcell-center");
        td5.classList.add("tdcell-center");
        td6.classList.add("tdcell-center");
        td7.classList.add("tdcell-center");
        trow.appendChild(td1);
        trow.appendChild(td2);
        trow.appendChild(td3);
        trow.appendChild(td4);
        trow.appendChild(td5);
        trow.appendChild(td6);
        trow.appendChild(td7);
        tbody.appendChild(trow);
      }
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing5").innerText = error;
    openErrorMessageDialog(error);
  });
});

function dateDiff(dateStr1, dateStr2){
  try{
    return parseInt((new Date(dateStr1) - new Date(dateStr2))/ 1000 / 60 / 60 / 24);
  }catch(e){
   return 0;
  }
  return 0;
}

document.getElementById("btnGetAssigned").addEventListener('click', function() {
  createAssignedTable();
});


//クローザーランク function createAssignedTable(){
function createAssignedTable() {

  var projectId = document.getElementById("selectProjectMain").value; //"customer_support_records";

  fetchAssignedAndRefreshRecentRow(projectId)

}


function setAttributes(dom, str){
  var tmp = str.split("/");
  for (let a in tmp){
    b = tmp[a].split(",");
    dom.setAttribute(b[0], b[1]);
  }
}



document.getElementById("offcanvasSetting").addEventListener("show.bs.offcanvas", function (event) {
  return false;
});

let targets = document.querySelectorAll("[id^='vTabSetting']"); //' #divGraphArea *');
targets.forEach(target => {
  target.addEventListener("shown.bs.tab", function (event) {
    if(event.target.id == "vTabSetting-BB"){
      //alert(event.target.id);
      createUserNameTable();
    } else if(event.target.id == "vTabSetting-AA"){
      //getRealMaxIssueId();
      document.getElementById("btnGetRealMaxNo").click();
      document.getElementById("btnGetMaxNo").click();
      ;
    } else if(event.target.id == "vTabSetting-CC"){
      createOsEnvironTable();
    } else if(event.target.id == "vTabSetting-DD"){
      createCustomFieldDefineArea()
    } else if(event.target.id == "vTabSetting-EE"){ //当番表
      createDutyMemberScheduleTable();
    } else {
      //alert(event.target.id);
      return;
    }
  });
});



function createCustomFieldDefineArea(){
  var projectId = document.getElementById("selectProjectSetting").value;
  fetch('/customFieldsDefine/' + projectId , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    for(let i in list){
      if(list[i].code==1){
        document.getElementById("settingDefineStartDate").value = list[i].value;
      }else if(list[i].code==2){
        document.getElementById("settingDefineFinishedDate").value = list[i].value;
      }else if(list[i].code==3){
        document.getElementById("settingDefineCustomer").value = list[i].value;
      }else if(list[i].code==4){
        document.getElementById("settingDefineAssignedTo").value = list[i].value;
      }
    }
  })
  .catch(error => { 
    openErrorMessageDialog(error);
  });
}
  




/*
|| プロジェクト設定カンバス　２つ目　ユーザ情報タブ
*/
function createOsEnvironTable(){
  var projectId = document.getElementById("selectProjectSetting").value;
  createTableLoading("divOsEnvironTableArea","環境変数を取得中・・・")

  fetch('/getOsEnviron/' + projectId , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divOsEnvironTableArea");

    //document.getElementById("divLabelProcessing2").innerText = jsonData.returnStatus; //list[0].issue_id;

    var hdText = ["変数名", "値"];
    var hdColWidth = ["30%","70%"];
    var tableId = initTable("divOsEnvironTableArea", hdText, hdColWidth,3.0);
    var tbody = document.getElementById(tableId+"Body");

    for(let i in list){
      var trow = document.createElement('tr');
      var td1 = document.createElement('td');
      var td2 = document.createElement('td');
      td1.innerText = list[i].key;
      //td2.innerText = list[i].value;
      var inp =  document.createElement('input');
      inp.classList.add("form-control","table-cell-input");
      inp.id = "inpSettingEnviron_" + list[i].key;
      inp.value = list[i].value;
      //setAttributes(inp,"aria-label,Sizing example input/aria-describedby,inputGroup-sizing-sm");
      td2.append(inp);
      td1.classList.add("tdcell-left");
      td2.classList.add("tdcell-left");
      trow.appendChild(td1);
      trow.appendChild(td2);
      tbody.appendChild(trow);
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    openErrorMessageDialog(error);
  });
}
  

/*
|| 当番表タブ
*/
var MemberList;
function createDutyMemberScheduleTable(){
  var projectId = document.getElementById("selectProjectSetting").value;
  createTableLoading("divDutyMemberScheduleTableArea","当番表を読み込み中・・・")


  fetch('/getUserNmList/' + projectId , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    MemberList = JSON.parse(jsonData.data);
    hoge();

  })
  .catch(error => { 
    //return;
    openErrorMessageDialog(error);
  });


}
  
function SetAllDisabledDutyList(){
  let deleteTargets = document.querySelectorAll("[id^='inpDutyMember_']");
  if(deleteTargets.length > 0 ){
    for(var a=0; a<deleteTargets.length; a++){
      try{
        if(deleteTargets[a].tagName == "INPUT"){
          // event.target.innerText = deleteTargets[a].value;
          // event.target.removeChild(deleteTargets[a])
          deleteTargets[a].parentElement.innerText = deleteTargets[a].value;
          deleteTargets[a].parentElement.removeChild(deleteTargets[a]);
        }
      }catch(e){
        ;
      }
    }
  }

  let disabledTargets = document.querySelectorAll("[id^='btnUpdateDutyMemberList_']");
  disabledTargets.forEach(element => {
    element.classList.remove("disabled");
    element.classList.add("disabled");
  });

}

function hoge(){
  
  var projectId = document.getElementById("selectProjectSetting").value;
  fetch('/getDutyMemberSchedule/' + projectId , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divDutyMemberScheduleTableArea");

    //document.getElementById("divLabelProcessing2").innerText = jsonData.returnStatus; //list[0].issue_id;

    var hdText = ["当番日", "担当者名","更新"];
    var hdColWidth = ["25%","60%","15%"];
    var tableId = initTable("divDutyMemberScheduleTableArea", hdText, hdColWidth,1.2);
    var tbody = document.getElementById(tableId+"Body");

    for(let i in list){
      var trow = document.createElement('tr');
      var td1 = document.createElement('td');
      var td2 = document.createElement('td');
      var td3 = document.createElement('td');
      td1.innerText = list[i].duty_date;
      td2.innerText = list[i].member_nms;
      //td3.innerText = "hoge";
      td3.appendChild(buttonHtmlUpdateDutyMember(list[i].duty_date));
      td1.classList.add("tdcell-left");
      td2.classList.add("tdcell-left");
      td2.addEventListener('click', function() {
        
        if(event.target.tagName=="INPUT"){
          return false;
        }


        SetAllDisabledDutyList();

        var txt = event.target.innerText;
        var inp = document.createElement('input');
        inp.id = "inpDutyMember_" + list[i].duty_date;
        inp.type = "text";
        inp.value = txt; //list[i].member_nms;
        inp.classList.add("form-control","form-control-sm");
        event.target.innerText = "";
        event.target.appendChild(inp);
        document.getElementById("btnUpdateDutyMemberList_" + list[i].duty_date).classList.remove("disabled");
        inp.addEventListener('keydown', function() {
          checkAndAlertMemberName(inp);
        });
        inp.addEventListener('keyup', function() {
          checkAndAlertMemberName(inp);
        });
        // inp.addEventListener('blur', function() {
        //   var editStr = inp.value;
        //   // while(event.target.lastChild){
        //   //   event.target.removeChild(event.target.lastChild);
        //   // }
          
        //   //event.target.innerText = editStr;
        // });
      });
      td3.classList.add("tdcell-center");
      trow.appendChild(td1);
      trow.appendChild(td2);
      trow.appendChild(td3);
      tbody.appendChild(trow);
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    openErrorMessageDialog(error);
  });
}

function checkAndAlertMemberName(inpObj){

  var tdB = inpObj.parentElement;
  while(inpObj.nextSibling){
    tdB.removeChild(inpObj.nextSibling);
  }


  var memberNameArr = inpObj.value.split(",");
  var alert = document.createElement('div');
  var result;
  var isReady = true;
  for(var i in memberNameArr){
    var span = document.createElement('span');
    span.style.marginRight = "5px";
    span.style.fontSize="12.5px";
    result = MemberList.filter((member) => {
      return (member.user_nm == memberNameArr[i].trim());
    });
    if(result.length!=1){
      //span.innerText = "...";
      span.classList.add("badge","bg-danger","rounded-pill");//"rounded-pill",
      span.innerText = memberNameArr[i].trim() + " ...";;
      //btn.classList.add("btn","btn-info","btn-sm","disabled");
      isReady = false;
    } else{
      span.classList.add("badge","bg-primary","rounded-pill");//"rounded-pill",
      span.innerText = result[0].user_nm + " ok!";
    }
    alert.appendChild(span)
  }
  if(isReady){
    tdB.nextSibling.firstChild.classList.remove("disabled");
  }else{
    tdB.nextSibling.firstChild.classList.add("disabled");
  }
  tdB.appendChild(alert);

}

/*
|| プロジェクト設定カンバス　２つ目　ユーザ情報タブ
*/
function createUserNameTable(){
  var projectId = document.getElementById("selectProjectSetting").value;
  createTableLoading("divUserNameTableArea","ユーザ情報を収集中・・・")

  fetch('/getUserInfo/' + projectId , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divUserNameTableArea");

    //document.getElementById("divLabelProcessing2").innerText = jsonData.returnStatus; //list[0].issue_id;

    var hdText = ["ユーザID", "表示名","取得"];
    var hdColWidth = ["25%","50%","25%"];
    var tableId = initTable("divUserNameTableArea", hdText, hdColWidth,1.2);
    var tbody = document.getElementById(tableId+"Body");

    for(let i in list){
      var trow = document.createElement('tr');
      var td1 = document.createElement('td');
      var td2 = document.createElement('td');
      var td3 = document.createElement('td');
      td1.innerText = list[i].user_id;
      td2.innerText = list[i].user_nm;
      td3.appendChild(buttonHtmlUserGet(list[i].user_id));
      td1.classList.add("tdcell-left");
      td2.classList.add("tdcell-left");
      td3.classList.add("tdcell-center");
      trow.appendChild(td1);
      trow.appendChild(td2);
      trow.appendChild(td3);
      tbody.appendChild(trow);
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    openErrorMessageDialog(error);
  });
}
  

function buttonHtmlUpdateDutyMember(dutyDate){
  //%a#btnGetMaxNo.btn.btn-dark.btn-sm(type="button")
  var btn = document.createElement('a');
  btn.classList.add("btn","btn-primary","btn-sm","disabled");
  btn.id = "btnUpdateDutyMemberList_" + dutyDate;
  setAttributes(btn,"type,button/dummy,dummy");
  btn.innerText = "登録";
  btn.style.paddingBottom = "1px";
  btn.style.paddingTop = "1px";
  btn.style.fontSize = "11.5px";

  btn.addEventListener('click', function() {
    var inp = document.getElementById("inpDutyMember_"+dutyDate);
    var memberNms = inp.value.trim();
    if(memberNms == ""){
      alert("にゅうりょくなし");
      return false;
    }
    
    var projectId = document.getElementById("selectProjectSetting").value;
    var memberIDs = "";

    var memberNameArr = memberNms.split(",");
    var result;
    for(var i in memberNameArr){
      result = MemberList.filter((member) => {
        return (member.user_nm == memberNameArr[i].trim());
      });
      if(result.length!=1){
        //alert("入力あやまり");
        var alert = document.createElement('div');
        alert.innerText = "aaaa";
        inp.parentElement.appendChild(alert);
      } else{
        memberIDs = memberIDs + "," + result[0].user_id;
      }
    }
    
    fetch('/UpdateTodaysMember/' + projectId + "/" + dutyDate + "/" + memberIDs, {
      method: 'GET',
      'Content-Type': 'application/json'
    })
    .then(res => res.json())
    .then(value => {
      if(value==0){
        SetAllDisabledDutyList();
        //alert("登録しました。");
      }
    })
    .catch(error => { 
      //document.getElementById("divLabelProcessing0").innerText = error;//console.log(error); 
      openErrorMessageDialog(error);
    });
  });
  return btn;
}

function buttonHtmlUserGet(userId){
  //%a#btnGetMaxNo.btn.btn-dark.btn-sm(type="button")
  var btn = document.createElement('a');
  btn.classList.add("btn","btn-warning","btn-sm");
  setAttributes(btn,"type,button/dummy,dummy");
  btn.innerText = "取得";
  btn.style.paddingBottom = "1px";
  btn.style.paddingTop = "1px";
  btn.style.fontSize = "11.5px";
  
  btn.addEventListener('click', function() {
    
    var tbody = document.getElementById("htmlTableUserNameTableAreaBody");
    for(let i in tbody.rows){
      if(tbody.rows[i].cells[0].innerText==userId){
        tbody.rows[i].cells[1].classList.add("loading-ss");
        break;
      }
    }
    updateUserNm(userId);
  });
  return btn;
}

function updateUserNm(userId){
  var projectId = document.getElementById("selectProjectSetting").value;
  fetch('/updateUserNm/' + projectId + "/" + userId , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var nm = jsonData.data;
    //
    var tbody = document.getElementById("htmlTableUserNameTableAreaBody");
    for(let i in tbody.rows){
      if(tbody.rows[i].cells[0].innerText==userId){
        tbody.rows[i].cells[1].classList.remove("loading-ss");
        tbody.rows[i].cells[1].innerText = nm;
        break;
      }
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    openErrorMessageDialog(error);
  });

}


function fetchAssignedAndRefreshRecentRow(projectId){
    
  createTableLoading("divAssignedTableArea","担当者IDごとに集計しています・・・")

  fetch('/getAssignedSammary/' + projectId , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divAssignedTableArea");

    document.getElementById("divLabelProcessing2").innerText = jsonData.returnStatus; //list[0].issue_id;

    var hdText = ["担当者ID", "完了数", "未完了数", "滞留率"];
    var hdColWidth = ["34%","22%","22%","22%"];
    var tableId = initTable("divAssignedTableArea", hdText, hdColWidth,2.5);
    var tbody = document.getElementById(tableId+"Body");

    for(let i in list){
      if(list[i].user_name != "dummy" && list[i].user_name!=""){
        var trow = document.createElement('tr');
        var td1 = document.createElement('td');
        var td2 = document.createElement('td');
        var td3 = document.createElement('td');
        var td4 = document.createElement('td');
        td1.innerText = list[i].user_name=="" ? list[i].assigned_to:list[i].user_name;
        td2.innerText = list[i].finished_count;
        td3.innerText = list[i].incident_count;
        td4.innerText = list[i].incident_ratio;
        td1.classList.add("tdcell-left");
        td2.classList.add("tdcell-right");
        td3.classList.add("tdcell-right");
        td4.classList.add("tdcell-right");
        trow.appendChild(td1);
        trow.appendChild(td2);
        trow.appendChild(td3);
        trow.appendChild(td4);
        tbody.appendChild(trow);
      }
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    openErrorMessageDialog(error);
  });
}
  



function createCommitmentSummaryTable(projectId){
  var projectId = document.getElementById("selectProjectMain").value; //"customer_support_records";
    
  createTableLoading("divCommitmentSummaryTableArea","当番日のアベレージを計算中・・・")

  fetch('/getCommitmentSummary/' + projectId , {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    var list = JSON.parse(jsonData.data);
    destroyTableLoading("divCommitmentSummaryTableArea");

    //document.getElementById("divLabelProcessing2").innerText = jsonData.returnStatus; //list[0].issue_id;

    var hdText = ["担当者ID", "当番日消化累計", "当番回数", "平均消化件数"];
    var hdColWidth = ["34%","22%","22%","22%"];
    var tableId = initTable("divCommitmentSummaryTableArea", hdText, hdColWidth,2.5);
    var tbody = document.getElementById(tableId+"Body");

    for(let i in list){
      if(list[i].user_name != "dummy" && list[i].user_name!=""){
        var trow = document.createElement('tr');
        var td1 = document.createElement('td');
        var td2 = document.createElement('td');
        var td3 = document.createElement('td');
        var td4 = document.createElement('td');
        td1.innerText = list[i].member_nm;
        td2.innerText = list[i].duty_finished_count;
        td3.innerText = list[i].duty_days;
        td4.innerText = list[i].duty_days_average;
        td1.classList.add("tdcell-left");
        td2.classList.add("tdcell-right");
        td3.classList.add("tdcell-right");
        td4.classList.add("tdcell-right");
        trow.appendChild(td1);
        trow.appendChild(td2);
        trow.appendChild(td3);
        trow.appendChild(td4);
        tbody.appendChild(trow);
      }
    }
  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error;
    openErrorMessageDialog(error);
  });
}
  















function getRadioStatusHotOrCold(){
  let elements = document.getElementsByName('inlineRadioOptions');
  let len = elements.length;
  let checkValue = '';
  
  for (let i = 0; i < len; i++){
      if (elements.item(i).checked){
          checkValue = elements.item(i).value;
      }
  }
  return checkValue;  
}

function getRadioStatusContactRatio(){
  let elements = document.getElementsByName('rdContactRatio');
  let len = elements.length;
  let checkValue = '';
  
  for (let i = 0; i < len; i++){
      if (elements.item(i).checked){
          checkValue = elements.item(i).value;
      }
  }
  return checkValue;  
}

function getHotOrColdColorCode(num, joken){
  if(joken=='incident'){
    if(num>=40){
      return "#ff3700";
    }else if(num >= 30){
      return "#ff5f33";
    }else if(num >= 20){
      return "#ff8766";
    }else if(num >= 10){
      return "#ffc4b3";
    }else{
      return "";
    }
  } else if (joken=='finished'){
    if(num>=40){
      return "#0088ff";
    }else if(num >= 30){
      return "#4dacff";
    }else if(num >= 20){
      return "#80c4ff";
    }else if(num >= 10){
      return "#cce7ff";
    }else{
      return "";
    }
  } else if (joken=='diff'){
    if(num>0){
      return "#7cfc00";
    }else{
      return "#ffffff";
    }
  }
}
    
function drawDailyCountchart(dataSource, projectId) {
  //alert(dataSource);
  document.getElementById('linechart_material').innerHTML = "";

  var data = new google.visualization.DataTable();
  data.addColumn('date', 'Day');
  data.addColumn('number', '発生数');
  data.addColumn({type: 'string', role: 'tooltip', 'p': {'html': true}});
  data.addColumn('number', '消化数');
  data.addColumn({type: 'string', role: 'tooltip', 'p': {'html': true}});
  data.addRows(dataSource);

  var options = {
    chart: {
      title: '発生消化チャート',
      subtitle: "プロジェクトID：" + projectId
    },
    pointSize: 10,
    pointShape: 'circle',
    series: {
      0: { color: '#e2431e' },
      1: { color: '#1c91c0' }
    },
    tooltip: {trigger: 'focus',isHtml: true},
    chartArea:{top:"5%",left:"3%", height:"85%", width:"87%"},
    height: getClientHeight("divMainTableAreaLeft")
  };
  // var chart = new google.charts.Line(document.getElementById('linechart_material'));
  // chart.draw(data, google.charts.Line.convertOptions(options));
  var chart = new google.visualization.LineChart(document.getElementById('linechart_material'));
  chart.draw(data, options);
}

function getClientHeight(objId){
  return document.getElementById(objId).clientHeight;
}






//ローダーを削除
function destroyTableLoading(locationId){
  var tmp = document.getElementById(locationId); 
  while(tmp.lastChild){
    tmp.removeChild(tmp.lastChild);
  }
  document.getElementById(locationId).style.height = "";
}


function tryScrapeKiji(){
  
  var year = document.getElementById("inpYear").value;
  if(!cYearList.includes(year)){
    document.getElementById("divLabelProcessing3").innerHTML = "<p style='color:red'>入力された年度が不適切です。 </p>"
    setTimeout('document.getElementById("divLabelProcessing3").innerText = ""; document.getElementById("inpYear").value = ""; ', 1000);
    return;
  }

  var projectId = document.getElementById("selectProjectMain").value; //"customer_support_records";

  createTableLoading("divTextMiningArea","テキストマイニングしています...")

  fetch('/tryScrapeKiji/' + projectId + "/" + year, {
    method: 'GET',
    'Content-Type': 'application/json'
  })
  .then(res => res.json())
  .then(jsonData => {
    destroyTableLoading("divTextMiningArea");
    area = document.getElementById("divTextMiningArea");
    var img = document.createElement("img");
    img.src = '../static/image/' + jsonData.aaData[0].filepath + '';
    // img.height = "calc(100vh/3)"; //getClientHeight("divTextMiningArea");
    // img.width = "100%" //getClientHeight("divTextMiningArea");
    area.appendChild(img)


  })
  .catch(error => { 
    //document.getElementById("divLabelProcessing0").innerText = error; //console.log(error); 
    openErrorMessageDialog(error);
  });

}
