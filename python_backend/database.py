from sqlalchemy import create_engine, Column, Integer, String, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import os

# For the assignment, we use PostgreSQL. 
# In a local environment, you might use SQLite for testing.
# DATABASE_URL = "postgresql://user:password@localhost/dbname"
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./recipes.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    title = Column(String)
    cuisine = Column(String)
    prep_time = Column(String)
    cook_time = Column(String)
    total_time = Column(String)
    servings = Column(Integer)
    difficulty = Column(String)
    ingredients = Column(JSON)
    instructions = Column(JSON)
    nutrition_estimate = Column(JSON)
    substitutions = Column(JSON)
    shopping_list = Column(JSON)
    related_recipes = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
