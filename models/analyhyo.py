from api.database import db, ma

## 実テーブル
class AnalyHyo(db.Model): 
    __tablename__ = "analy_hyo"
    
    nendo        = db.Column(db.Integer, primary_key=True) 
    hyo_num      = db.Column(db.Integer, primary_key=True) 
    hyo_num_sub  = db.Column(db.Integer, primary_key=True) 
    hyo_nm       = db.Column(db.String(), primary_key=False) 
    memo1        = db.Column(db.String(), primary_key=False) 
    memo2        = db.Column(db.String(), primary_key=False) 
    memo3        = db.Column(db.String(), primary_key=False) 

class AnalyHyoSchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = AnalyHyo
            load_instance = True
