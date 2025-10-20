from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from ..database import Base

class Artist(Base):
    __tablename__ = "artist"

    artist_id = Column(Integer, primary_key=True, index=True)
    spotify_id = Column(String(100), unique=True, nullable=False)
    name = Column(String(255), nullable=False)  # NEW: Artist name
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    track_infos = relationship("TrackInfo", back_populates="artist", cascade="all, delete-orphan")
    