from api.database import db, ma

## 実テーブル
class VAnalyKeijoriekiSeichorituA(db.Model): 
    __tablename__ = "v_analy_keijorieki_seichoritu_a"
    
    nendo              = db.Column(db.Integer, primary_key=True) 
    gyomu_cd           = db.Column(db.String(), primary_key=True) 
    gyoshu_cd          = db.Column(db.String(), primary_key=True) 
    jigyo_cd           = db.Column(db.String(), primary_key=True) 
    dantai_cd          = db.Column(db.String(), primary_key=True) 
    dantai_nm          = db.Column(db.String(), primary_key=False) 
    sisetu_cd          = db.Column(db.String(), primary_key=True) 
    sisetu_nm          = db.Column(db.String(), primary_key=False) 
    joken_1            = db.Column(db.Integer, primary_key=False)
    joken_2            = db.Column(db.Integer, primary_key=False)
    joken_3            = db.Column(db.Integer, primary_key=False)
    joken_4            = db.Column(db.Integer, primary_key=False)
    joken_5            = db.Column(db.Integer, primary_key=False)
    joken_6            = db.Column(db.Integer, primary_key=False)
    joken_7            = db.Column(db.Integer, primary_key=False)
    joken_8            = db.Column(db.Integer, primary_key=False)
    joken_9            = db.Column(db.Integer, primary_key=False)
    keijo_soneki_toki  = db.Column(db.Numeric, primary_key=False) 
    keijo_soneki_zenki = db.Column(db.Numeric, primary_key=False) 
    seicho_ritu        = db.Column(db.Numeric, primary_key=False) 

class VAnalyKeijoriekiSeichorituASchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = VAnalyKeijoriekiSeichorituA
            load_instance = True





