from sqlalchemy import Column, Integer, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class TrackInfo(Base):
    __tablename__ = "track_info"

    track_info_id = Column(Integer, primary_key=True, index=True)
    song_id = Column(Integer, ForeignKey("song.song_id", ondelete="CASCADE"), nullable=False)
    artist_id = Column(Integer, ForeignKey("artist.artist_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    song = relationship("Song", back_populates="track_infos")
    artist = relationship("Artist", back_populates="track_infos")
