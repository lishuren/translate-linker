
import os
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

Base = declarative_base()

class TranslationProject(Base):
    __tablename__ = 'translation_projects'
    
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    source_language = Column(String(50), nullable=False)
    target_language = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    translations = relationship("Translation", back_populates="project")
    
class Translation(Base):
    __tablename__ = 'translations'
    
    id = Column(String(36), primary_key=True)
    project_id = Column(String(36), ForeignKey('translation_projects.id'))
    original_file_name = Column(String(255))
    target_language = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)  # pending, processing, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    download_url = Column(String(255))
    error_message = Column(Text)
    
    # Processing details
    source_language = Column(String(50))
    llm_provider = Column(String(50))
    web_translation_service = Column(String(50))
    processing_time = Column(Float)
    total_tokens = Column(Integer)
    confidence_score = Column(Float)
    
    # Additional metadata
    metadata = Column(JSON)
    
    # Relationships
    project = relationship("TranslationProject", back_populates="translations")
    segments = relationship("TranslationSegment", back_populates="translation")

class TranslationSegment(Base):
    __tablename__ = 'translation_segments'
    
    id = Column(String(36), primary_key=True)
    translation_id = Column(String(36), ForeignKey('translations.id'))
    source_text = Column(Text, nullable=False)
    target_text = Column(Text)
    segment_index = Column(Integer)
    confidence_score = Column(Float)
    is_machine_translated = Column(Boolean, default=True)
    is_reviewed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # TMX reference if this came from translation memory
    tmx_unit_id = Column(String(36))
    
    # Relationships
    translation = relationship("Translation", back_populates="segments")

class TranslationMemory(Base):
    __tablename__ = 'translation_memories'
    
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    source_language = Column(String(50), nullable=False)
    target_language = Column(String(50), nullable=False)
    entry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    entries = relationship("TranslationMemoryEntry", back_populates="memory")

class TranslationMemoryEntry(Base):
    __tablename__ = 'translation_memory_entries'
    
    id = Column(String(36), primary_key=True)
    memory_id = Column(String(36), ForeignKey('translation_memories.id'))
    source_text = Column(Text, nullable=False)
    target_text = Column(Text, nullable=False)
    context = Column(Text)
    metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # TMX reference
    tmx_unit_id = Column(String(36))
    
    # Relationships
    memory = relationship("TranslationMemory", back_populates="entries")

def get_engine():
    """Get SQLAlchemy engine based on environment settings"""
    from services.global_config_service import GlobalConfigService
    
    config_service = GlobalConfigService()
    db_settings = config_service.get_database_settings()
    
    if db_settings.get("use_database", False):
        return create_engine(db_settings.get("db_url", "sqlite:///translations.db"))
    else:
        # Default to in-memory SQLite if database is disabled
        return create_engine("sqlite:///:memory:")

def get_session():
    """Get a new database session"""
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()

def init_db():
    """Initialize the database schema"""
    engine = get_engine()
    Base.metadata.create_all(engine)
    print("Database initialized")

def reset_db():
    """Reset the database (for development/testing)"""
    engine = get_engine()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    print("Database reset")
