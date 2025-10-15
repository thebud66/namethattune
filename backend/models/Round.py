from sqlalchemy import Column, Integer, String, DateTime, func, BLOB
from sqlalchemy.orm import relationship
from ..database import Base

class Round(Base):
    __tablename__ = "round"

    # Column definitions
    round_id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, nullable=False)
    round_number = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    games = relationship("Game", back_populates="rounds")
