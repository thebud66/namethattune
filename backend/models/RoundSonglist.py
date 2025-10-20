from sqlalchemy import Column, Integer, DateTime, func, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from ..database import Base
from .Enums import ScoreType

class RoundSonglist(Base):
    __tablename__ = "round_songlist"

    round_songlist_id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("round.round_id", ondelete="CASCADE"), nullable=False)
    song_id = Column(Integer, ForeignKey("song.song_id", ondelete="CASCADE"), nullable=False)
    round_team_id = Column(Integer, ForeignKey("round_team.round_team_id", ondelete="CASCADE"), nullable=False)
    track_info_id = Column(Integer, ForeignKey("track_info.track_info_id", ondelete="CASCADE"), nullable=False)  # NEW
    correct_artist_guess = Column(Boolean, default=False)
    correct_song_title_guess = Column(Boolean, default=False)
    bonus_correct_movie_guess = Column(Boolean, default=False)
    score_type = Column(
        SQLEnum(ScoreType),
        nullable=False,
        default=ScoreType.STANDARD,
        server_default=ScoreType.STANDARD.value
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    round = relationship("Round", back_populates="round_songlists")
    song = relationship("Song", back_populates="round_songlists")
    round_team = relationship("RoundTeam")
    track_info = relationship("TrackInfo")  # NEW