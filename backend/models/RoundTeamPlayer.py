from sqlalchemy import Column, Integer, String, DateTime, func, BLOB
from sqlalchemy.orm import relationship
from ..database import Base

class RoundTeamPlayer(Base):
    __tablename__ = "round_team_player"

    # Column definitions
    round_team_player_id = Column(Integer, primary_key=True, index=True)
    round_team_id = Column(Integer, nullable=False)
    participant_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    round_team = relationship("RoundTeam", back_populates="round_team_players")
    participant = relationship("Participant", back_populates="round_team_players")