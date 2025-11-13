"""
Database Models and Configuration for AgenticTableTop

This module handles database setup, models, and session management.
Uses SQLite for development (can be switched to PostgreSQL for production).
"""

import os
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agentictabletop.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False,  # Set to True for SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


class User(Base):
    """User model for authentication"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NPCImage(Base):
    """NPC Image model for storing generated NPC portraits"""

    __tablename__ = "npc_images"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)  # Optional: link to user
    campaign_id = Column(String(100), index=True, nullable=True)  # Optional: link to campaign
    npc_name = Column(String(200), index=True, nullable=False)
    npc_description = Column(Text, nullable=True)
    quest_context = Column(Text, nullable=True)
    image_base64 = Column(Text, nullable=False)  # Base64 encoded image
    prompt_used = Column(Text, nullable=True)
    image_path = Column(String(500), nullable=True)  # Optional: file path if stored on disk
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Index for faster lookups
    __table_args__ = ({"sqlite_autoincrement": True} if "sqlite" in DATABASE_URL else {},)


class Campaign(Base):
    """Campaign model for storing campaign metadata"""

    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    title = Column(String(200), nullable=False)
    background = Column(Text, nullable=True)
    theme = Column(String(100), nullable=True)
    campaign_data = Column(Text, nullable=True)  # JSON string of full campaign
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def init_db():
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully")


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Initialize database on import
if __name__ == "__main__":
    init_db()
else:
    # Auto-initialize on module import
    init_db()
