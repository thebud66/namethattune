from sqlalchemy import Column, Integer, String, DateTime, func, BLOB, Enum as SQLEnum
from sqlalchemy.orm import relationship
from ..database import Base

class Song(Base):
    __tablename__ = "song"

    # Column definitions
    song_id = Column(Integer, primary_key=True, index=True)
    spotify_id = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    round_songlists = relationship("RoundSonglist", back_populates="song", cascade="all, delete-orphan")