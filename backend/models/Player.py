from sqlalchemy import Column, Integer, String, DateTime, func, BLOB
from sqlalchemy.orm import relationship
from ..database import Base

class Player(Base):
    __tablename__ = "player"

    # Column definitions    
    player_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    image_url = Column(String(255), nullable=True)  # New field for player image URL
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    participations = relationship("Participant", back_populates="player", cascade="all, delete-orphan")

