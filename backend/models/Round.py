from sqlalchemy import Column, Integer, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class Round(Base):
    __tablename__ = "round"

    round_id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("game.game_id", ondelete="CASCADE"), nullable=False)
    round_number = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    game = relationship("Game", back_populates="rounds")
    round_teams = relationship("RoundTeam", back_populates="round", cascade="all, delete-orphan")
    round_songlists = relationship("RoundSonglist", back_populates="round", cascade="all, delete-orphan")
