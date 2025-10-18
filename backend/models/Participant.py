from sqlalchemy import Column, Integer, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class Participant(Base):
    __tablename__ = "participant"

    participant_id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("game.game_id", ondelete="CASCADE"), nullable=False)
    player_id = Column(Integer, ForeignKey("player.player_id", ondelete="CASCADE"), nullable=False)
    seat_number = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    game = relationship("Game", back_populates="participants")
    player = relationship("Player", back_populates="participations")
    round_team_players = relationship("RoundTeamPlayer", back_populates="participant", cascade="all, delete-orphan")
