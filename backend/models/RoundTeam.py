from sqlalchemy import Column, Integer, String, DateTime, func, BLOB, Enum as SQLEnum
from sqlalchemy.orm import relationship
from ..database import Base
from.Enums import Role

class RoundTeam(Base):
    __tablename__ = "round_team"

    # Column definitions
    round_team_id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, nullable=False)
    role = Column(
        SQLEnum(Role), 
        nullable=False,
        default=Role.PLAYER,
        server_default=Role.PLAYER.value
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    round = relationship("Round", back_populates="round_teams")
    round_team_players = relationship("RoundTeamPlayer", back_populates="round_team", cascade="all, delete-orphan")