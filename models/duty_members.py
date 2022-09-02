from api.database import db, ma

## 実テーブル
class DutyMembers(db.Model): 
    __tablename__ = "duty_members"
    project_id      = db.Column(db.String(), primary_key=True) 
    duty_date     = db.Column(db.Date, nullable=True) 
    member_id        = db.Column(db.Integer, primary_key=True) 

class DutyMembersSchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = DutyMembers
            load_instance = True
