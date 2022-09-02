from api.database import db, ma

## 実テーブル
class AnalyMain(db.Model): 
    __tablename__ = "analy_main"
    
    nendo        = db.Column(db.Integer, primary_key=True) 
    gyomu_cd     = db.Column(db.String(), primary_key=True) 
    gyoshu_cd    = db.Column(db.String(), primary_key=True) 
    jigyo_cd     = db.Column(db.String(), primary_key=True) 
    dantai_cd    = db.Column(db.String(), primary_key=True) 
    dantai_nm    = db.Column(db.String(), primary_key=False) 
    sisetu_cd    = db.Column(db.String(), primary_key=True) 
    sisetu_nm    = db.Column(db.String(), primary_key=False) 
    hyo_num      = db.Column(db.Integer, primary_key=True) 
    hyo_num_sub  = db.Column(db.Integer, primary_key=False) 
    gyo_num      = db.Column(db.Integer, primary_key=True) 
    gyo_num_sub  = db.Column(db.Integer, primary_key=False)
    retu_num     = db.Column(db.Integer, primary_key=True) 
    retu_num_sub = db.Column(db.Integer, primary_key=False)
    joken_1      = db.Column(db.Integer, primary_key=False)
    joken_2      = db.Column(db.Integer, primary_key=False)
    joken_3      = db.Column(db.Integer, primary_key=False)
    joken_4      = db.Column(db.Integer, primary_key=False)
    joken_5      = db.Column(db.Integer, primary_key=False)
    joken_6      = db.Column(db.Integer, primary_key=False)
    joken_7      = db.Column(db.Integer, primary_key=False)
    joken_8      = db.Column(db.Integer, primary_key=False)
    joken_9      = db.Column(db.Integer, primary_key=False)
    tani         = db.Column(db.String(), primary_key=False) 
    val_num      = db.Column(db.Numeric, primary_key=False) 
    val_char     = db.Column(db.String(), primary_key=False) 
    val_bikoa    = db.Column(db.String(), primary_key=False) 
    val_bikob    = db.Column(db.String(), primary_key=False) 
    val_bikoc    = db.Column(db.String(), primary_key=False) 


class AnalyMainSchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = AnalyMain
            load_instance = True


class AnalyScatter(db.Model): 
    __tablename__ = "dummy"
    
    nendo        = db.Column(db.Integer, primary_key=True) 
    gyomu_cd     = db.Column(db.String(), primary_key=True) 
    gyoshu_cd    = db.Column(db.String(), primary_key=True) 
    jigyo_cd     = db.Column(db.String(), primary_key=True) 
    dantai_cd    = db.Column(db.String(), primary_key=True) 
    dantai_nm    = db.Column(db.String(), primary_key=False) 
    sisetu_cd    = db.Column(db.String(), primary_key=True) 
    sisetu_nm    = db.Column(db.String(), primary_key=False) 
    hyo_num      = db.Column(db.Integer, primary_key=True) 
    hyo_num_sub  = db.Column(db.Integer, primary_key=False) 
    gyo_num      = db.Column(db.Integer, primary_key=True) 
    gyo_num_sub  = db.Column(db.Integer, primary_key=False)
    retu_num     = db.Column(db.Integer, primary_key=True) 
    retu_num_sub = db.Column(db.Integer, primary_key=False)
    val_x        = db.Column(db.Numeric, primary_key=False) 
    val_y        = db.Column(db.Numeric, primary_key=False) 
    val_z        = db.Column(db.Numeric, primary_key=False) 


class AnalyScatterSchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = AnalyScatter
            load_instance = True
