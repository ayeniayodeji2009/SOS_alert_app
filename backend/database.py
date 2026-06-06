from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os


# print(sqlalchemy.__version__)





# This creates the URL safely so Python doesn't get confused by special characters
url_object = URL.create(
    "postgresql",
    username="postgres",
    password="8888",  # Your password here
    host="127.0.0.1",
    port=5432,
    database="sos_db",
)
print(url_object)
engine = create_engine(url_object)


# DATABASE_URL = "postgresql://postgres:password@localhost:5432/sos_db" #"postgresql://username:8888@localhost:5432/sos_db" #postgresql://postgres:8888@localhost:5432/sos_db

# engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()