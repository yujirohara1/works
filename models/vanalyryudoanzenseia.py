from api.database import db, ma

## 実テーブル
class VAnalyRyudoAnzenseiA(db.Model): 
    __tablename__ = "v_analy_ryudo_anzensei_a"
    
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
    ryudo_sisan        = db.Column(db.Numeric, primary_key=False) 
    ryudo_fusai        = db.Column(db.Numeric, primary_key=False) 
    shomi_unten_sihon  = db.Column(db.Numeric, primary_key=False) 
    ryudo_hiritu       = db.Column(db.Numeric, primary_key=False) 

class VAnalyRyudoAnzenseiASchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = VAnalyRyudoAnzenseiA
            load_instance = True
