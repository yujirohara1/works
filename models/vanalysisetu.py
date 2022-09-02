from api.database import db, ma

## 実テーブル
class VAnalySisetu(db.Model): 
    __tablename__ = "v_analy_sisetu"
    nendo = db.Column(db.Integer, primary_key=False)
    gyomu_cd = db.Column(db.String(), primary_key=True) 
    gyoshu_cd = db.Column(db.String(), primary_key=True) 
    gyoshu_nm = db.Column(db.String(), primary_key=True) 
    jigyo_cd = db.Column(db.String(), primary_key=True) 
    jigyo_nm = db.Column(db.String(), primary_key=True) 
    dantai_cd = db.Column(db.String(), primary_key=True) 
    dantai_nm = db.Column(db.String(), primary_key=True) 
    sisetu_cd = db.Column(db.String(), primary_key=True) 
    sisetu_nm = db.Column(db.String(), primary_key=True) 
    pref_cd = db.Column(db.String(), primary_key=False) 
    joken_1      = db.Column(db.Integer, primary_key=False)
    joken_2      = db.Column(db.Integer, primary_key=False)
    joken_3      = db.Column(db.Integer, primary_key=False)
    joken_4      = db.Column(db.Integer, primary_key=False)
    joken_5      = db.Column(db.Integer, primary_key=False)
    joken_6      = db.Column(db.Integer, primary_key=False)
    joken_7      = db.Column(db.Integer, primary_key=False)
    joken_8      = db.Column(db.Integer, primary_key=False)

class VAnalySisetuSchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = VAnalySisetu
            load_instance = True
