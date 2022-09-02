from api.database import db, ma

## 実テーブル
class AnalyImport(db.Model): 
    __tablename__ = "analy_import"
    
    nendo        = db.Column(db.Integer, primary_key=True) 
    gyomu_cd     = db.Column(db.String(), primary_key=True) 
    hyo_num        = db.Column(db.Integer, primary_key=True) 
    hyo_num_sub   = db.Column(db.Integer, primary_key=True) 
    file_url     = db.Column(db.String(), primary_key=False) 
    status       = db.Column(db.Integer, primary_key=False) 
    memo1        = db.Column(db.String(), primary_key=False) 
    memo2        = db.Column(db.String(), primary_key=False) 
    memo3        = db.Column(db.String(), primary_key=False) 

class AnalyImportSchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = AnalyImport
            load_instance = True
            