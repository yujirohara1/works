from api.database import db, ma

## 実テーブル
class EnvVariable(db.Model): 
    __tablename__ = "env_variable"
    pid = db.Column(db.Integer, primary_key=True) 
    key = db.Column(db.String(), primary_key=True) 
    code = db.Column(db.String(), primary_key=True) 
    value = db.Column(db.String(), primary_key=False) 

class EnvVariableSchema(ma.SQLAlchemyAutoSchema):
      class Meta:
            model = EnvVariable
            load_instance = True


# drop table env_variable;

# CREATE TABLE env_variable (
#     pid    integer not null,
#     key    character varying(100) not null,
#     code   character varying(100) not null,
#     value  character varying(100) not null
# );


# ALTER TABLE ONLY env_variable
#     ADD CONSTRAINT env_variable_prkey PRIMARY KEY (
#        pid,
#        key   ,
#        code 
#     );

