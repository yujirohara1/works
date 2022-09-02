from api.database import db, ma

## 実テーブル
class VAnalySummary(db.Model):
    __tablename__ = "v_analy_summary"
    nendo = db.Column(db.Integer, primary_key=False)
    gyomu_cd = db.Column(db.Integer, primary_key=True) 
    gyoshu_cd    = db.Column(db.Integer, primary_key=True) 
    gyoshu_nm    = db.Column(db.String(), primary_key=True) 
    memo1        = db.Column(db.String(), primary_key=True) 
    kensu        = db.Column(db.Numeric, primary_key=False) 
    kessan_g     = db.Column(db.Numeric, primary_key=False) 

class VAnalySummarySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = VAnalySummary
        load_instance = True
