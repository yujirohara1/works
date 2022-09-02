from api.database import db, ma

## 実テーブル
class DailyIssues(db.Model): 
    __tablename__ = "daily_issues"
    project_id       = db.Column(db.String(), primary_key=True) 
    status_id        = db.Column(db.Integer, primary_key=True) 
    number_of_count  = db.Column(db.Integer, primary_key=True) 
    measure_date     = db.Column(db.Date, nullable=True) 

class DailyIssuesSchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = DailyIssues
            load_instance = True
