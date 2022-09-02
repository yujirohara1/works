from api.database import db, ma

## 実テーブル
class VAnalyHyo(db.Model): 
    __tablename__ = "v_analy_hyo"
    gyomu_cd          = db.Column(db.String(), primary_key=True) 
    gyoshu_cd         = db.Column(db.String(), primary_key=True) 
    jigyo_cd          = db.Column(db.String(), primary_key=True) 
    dantai_cd         = db.Column(db.String(), primary_key=True) 
    sisetu_cd         = db.Column(db.String(), primary_key=True)
    hyo_num           = db.Column(db.Integer, primary_key=True) 
    gyo_num           = db.Column(db.Integer, primary_key=True)
    retu_num          = db.Column(db.Integer, primary_key=True)
    indent            = db.Column(db.Integer, primary_key=False)
    name1             = db.Column(db.String(), primary_key=False) 
    val_a             = db.Column(db.Numeric, primary_key=False) 
    val_b             = db.Column(db.Numeric, primary_key=False) 
    val_c             = db.Column(db.Numeric, primary_key=False) 
    val_d             = db.Column(db.Numeric, primary_key=False) 
    val_e             = db.Column(db.Numeric, primary_key=False) 
    val_f             = db.Column(db.Numeric, primary_key=False) 
    val_g             = db.Column(db.Numeric, primary_key=False) 
    val_h             = db.Column(db.Numeric, primary_key=False) 
    val_i             = db.Column(db.Numeric, primary_key=False) 
    val_j             = db.Column(db.Numeric, primary_key=False) 


class VAnalyHyoSchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = VAnalyHyo
            load_instance = True
