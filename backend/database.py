import os
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

# Safely pull values from environment variables with local fallbacks
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "sos123")  # Make sure this matches your PostgreSQL password!
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "sos_db")

# Create the URL using psycopg2 driver
url_object = URL.create(
    "postgresql+psycopg2",  # ✅ This is correct for psycopg2-binary
    username=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=int(DB_PORT),
    database=DB_NAME,
)

print(f"Connecting to database: {url_object}")
engine = create_engine(url_object)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# FastAPI Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



























# from sqlalchemy import create_engine
# from sqlalchemy.engine import URL
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker
# import os


# # print(sqlalchemy.__version__)





# # This creates the URL safely so Python doesn't get confused by special characters
# url_object = URL.create(
#     "postgresql+psycopg",
#     username="postgres",
#     password="8888",  # Your password here
#     host="127.0.0.1",
#     port=5432,
#     database="sos_db",
# )
# print(url_object)
# engine = create_engine(url_object)


# # DATABASE_URL = "postgresql://postgres:password@localhost:5432/sos_db" #"postgresql://username:8888@localhost:5432/sos_db" #postgresql://postgres:8888@localhost:5432/sos_db

# # engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()

# def get_db():
    
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()