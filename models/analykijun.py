from api.database import db, ma

## 実テーブル
class AnalyKijun(db.Model): 
    __tablename__ = "analy_kijun"
    
    nendo        = db.Column(db.Integer, primary_key=True) 
    gyomu_cd     = db.Column(db.String(), primary_key=True) 
    gyoshu_cd    = db.Column(db.String(), primary_key=True) 
    jigyo_cd     = db.Column(db.String(), primary_key=True) 
    kijun_cd     = db.Column(db.String(), primary_key=True) 
    kijun_nm     = db.Column(db.String(), primary_key=False) 
    kijun_val    = db.Column(db.Numeric, primary_key=False) 
    average_val  = db.Column(db.Numeric, primary_key=False) 
    max_val      = db.Column(db.Numeric, primary_key=False) 
    min_val      = db.Column(db.Numeric, primary_key=False) 
    center_val   = db.Column(db.Numeric, primary_key=False) 
    mode_val     = db.Column(db.Numeric, primary_key=False) 
    hensa_val     = db.Column(db.Numeric, primary_key=False) 
    bunsan_val     = db.Column(db.Numeric, primary_key=False) 

class AnalyKijunSchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = AnalyKijun
            load_instance = True
            