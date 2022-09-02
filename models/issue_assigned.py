from api.database import db, ma

## 実テーブル
class IssueAssigned(db.Model): 
    __tablename__ = "issue_assigned"
    project_id      = db.Column(db.String(), primary_key=False) 
    issue_id        = db.Column(db.Integer, primary_key=True) 
    assined_id = db.Column(db.Integer, primary_key=False) 
    assined_name = db.Column(db.String(), primary_key=False) 
    # measure_date     = db.Column(db.Date, nullable=False) 

class IssueAssignedSchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = IssueAssigned
            load_instance = True
