from api.database import db, ma

## 実テーブル
class IssueSubjects(db.Model): 
    __tablename__ = "issue_subjects"
    project_id      = db.Column(db.String(), primary_key=False) 
    issue_id        = db.Column(db.Integer, primary_key=True) 
    issue_subject   = db.Column(db.String(), primary_key=False) 
    start_date     = db.Column(db.Date, nullable=False) 
    finished_date     = db.Column(db.Date, nullable=False) 
    assigned_to  = db.Column(db.Integer, primary_key=False) 
    status  = db.Column(db.Integer, primary_key=False) 
    updated_on     = db.Column(db.DateTime, primary_key = False) 
    customer_id  = db.Column(db.String(), primary_key=False) 
    enter = db.Column(db.String(), primary_key=False) 


class IssueSubjectsSchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = IssueSubjects
            load_instance = True
