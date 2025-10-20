# backend/models/Game.py
from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from ..database import Base

class Game(Base):
    __tablename__ = "game"

    game_id = Column(Integer, primary_key=True, index=True)
    playlist_id = Column(String(100), nullable=True)  # NEW: Spotify playlist ID
    current_track_index = Column(Integer, default=0, nullable=False)  # NEW: Track position in playlist
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    participants = relationship("Participant", back_populates="game", cascade="all, delete-orphan")
    rounds = relationship("Round", back_populates="game", cascade="all, delete-orphan")