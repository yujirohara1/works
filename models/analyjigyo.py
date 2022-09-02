from api.database import db, ma

## 実テーブル
class AnalyJigyo(db.Model): 
    __tablename__ = "analy_jigyo"
    
    nendo        = db.Column(db.Integer, primary_key=True) 
    gyoshu_cd    = db.Column(db.String(), primary_key=True) 
    gyoshu_nm    = db.Column(db.String(), primary_key=True) 
    jigyo_cd     = db.Column(db.String(), primary_key=True) 
    jigyo_nm     = db.Column(db.String(), primary_key=True) 
    memo1        = db.Column(db.String(), primary_key=True) 
    memo2        = db.Column(db.String(), primary_key=True) 
    memo3        = db.Column(db.String(), primary_key=True) 

class AnalyJigyoSchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = AnalyJigyo
            load_instance = True
            