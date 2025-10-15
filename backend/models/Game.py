from sqlalchemy import Column, Integer, String, DateTime, func, BLOB
from sqlalchemy.orm import relationship
from ..database import Base

class Game(Base):
    __tablename__ = "game"

    # Column definitions
    game_id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    participants = relationship("Participant", back_populates="game", cascade="all, delete-orphan")
