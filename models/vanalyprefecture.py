from api.database import db, ma

## 実テーブル
class VAnalyPrefecture(db.Model):
    __tablename__ = "v_analy_prefecture"
    nendo      = db.Column(db.Integer, primary_key=True)
    pref_cd    = db.Column(db.String(), primary_key=True) 
    kensu      = db.Column(db.Integer, primary_key=False)
    pref_nm    = db.Column(db.String(), primary_key=False) 

class VAnalyPrefectureSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = VAnalyPrefecture
        load_instance = True