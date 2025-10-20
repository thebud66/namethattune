# backend/models/GameplaySettings.py
from sqlalchemy import Column, Integer, String, DateTime, func
from ..database import Base

class GameplaySettings(Base):
    __tablename__ = "gameplay_settings"

    setting_id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())