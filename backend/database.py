import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define database URLs
RENDER_DATABASE_URL = "postgresql://sos_db_prod_asv3_user:dUji82gDrxnWOdWhIfZJBPVMf6OIUcx9@dpg-d9h19aurnols73eu50pg-a.frankfurt-postgres.render.com/sos_db_prod_asv3?sslmode=require"
LOCAL_DATABASE_URL = "postgresql://postgres:sos123@localhost:5432/sos_db"

def get_database_url():
    """Try Render first, fall back to local if connection fails"""
    urls_to_try = [
        (RENDER_DATABASE_URL, "Render production"),
        (LOCAL_DATABASE_URL, "Local development")
    ]
    
    for url, name in urls_to_try:
        try:
            test_engine = create_engine(url, connect_args={"connect_timeout": 5})
            with test_engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                result.fetchone()
            logger.info(f"✅ Connected to {name} database")
            return url
        except Exception as e:
            logger.warning(f"❌ Failed to connect to {name}: {e}")
            continue
    
    logger.warning("⚠️ Could not connect to any database, using local as fallback")
    return LOCAL_DATABASE_URL

# Get the working database URL
DATABASE_URL = get_database_url()
logger.info(f"📊 Using database: {DATABASE_URL}")

# Create engine with the working URL
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database dependency for FastAPI
def get_db():
    """Dependency function to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()























# import os
# from sqlalchemy import create_engine
# from sqlalchemy.engine import URL
# from sqlalchemy.orm import declarative_base, sessionmaker



# This is database connection on remote server (render.com)
# DATABASE_URL=postgresql://sos_db_prod_user:zageDUy61HBA4v2ZIK2MqCOfyAQt0cFv@dpg-d8rhidfavr4c73ejg6c0-a.frankfurt-postgres.render.com/sos_db_prod
# DATABASE_URL=None
# DATABASE_URL="postgresql://sos_db_prod_user:zageDUy61HBA4v2ZIK2MqCOfyAQt0cFv@dpg-d8rhidfavr4c73ejg6c0-a.frankfurt-postgres.render.com/sos_db_prod?sslmode=require"

# ENV = os.getenv("ENV", "local")
# if ENV == "production":
#     DATABASE_URL="postgresql://sos_db_prod_user:zageDUy61HBA4v2ZIK2MqCOfyAQt0cFv@dpg-d8rhidfavr4c73ejg6c0-a.frankfurt-postgres.render.com/sos_db_prod?sslmode=require"
# else:
#     DATABASE_URL = "postgresql://postgres:sos123@localhost:5432/sos_db"




# print(f"Connecting to database: {DATABASE_URL}")
# engine = create_engine(DATABASE_URL)

# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()

# # FastAPI Dependency
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()











# This is database connection on my local machine
# Safely pull values from environment variables with local fallbacks
# DB_USER = os.getenv("DB_USER", "postgres")
# DB_PASSWORD = os.getenv("DB_PASSWORD", "sos123")  # Make sure this matches your PostgreSQL password!
# DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
# DB_PORT = os.getenv("DB_PORT", "5432")
# DB_NAME = os.getenv("DB_NAME", "sos_db")
# # Create the URL using psycopg2 driver
# url_object = URL.create(
#     "postgresql+psycopg2",  # ✅ This is correct for psycopg2-binary
#     username=DB_USER,
#     password=DB_PASSWORD,
#     host=DB_HOST,
#     port=int(DB_PORT),
#     database=DB_NAME,
# )




# print(f"Connecting to database: {url_object}")
# engine = create_engine(url_object)

# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()

# # FastAPI Dependency
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()



























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