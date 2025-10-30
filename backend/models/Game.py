# backend/models/Game.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from ..database import Base

class Game(Base):
    __tablename__ = "game"

    game_id = Column(Integer, primary_key=True, index=True)
    playlist_id = Column(String(100), nullable=True)  # Spotify playlist ID
    current_track_index = Column(Integer, default=0, nullable=False)  # Track position in playlist
    all_time_dj_participant_id = Column(Integer, ForeignKey("participant.participant_id"), nullable=True)  # Optional all-time DJ
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    participants = relationship(
        "Participant", 
        back_populates="game", 
        cascade="all, delete-orphan",
        foreign_keys="Participant.game_id"
    )
    rounds = relationship("Round", back_populates="game", cascade="all, delete-orphan")
    all_time_dj = relationship(
        "Participant",
        foreign_keys=[all_time_dj_participant_id],
        viewonly=True
    )