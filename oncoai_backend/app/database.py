"""
Database engine and session management.

Note: this module does NOT create schema. oncoai_schema.sql is the single
source of truth for tables, enums, triggers, and views. models.py only
maps onto that existing schema for ORM convenience — never call
Base.metadata.create_all() against a production database.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a request-scoped session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
