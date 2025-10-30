from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..models.Enums import ScoreType 
from .SongBase import Song
from .ArtistBase import Artist
from .TrackInfoBase import TrackInfo, TrackInfoWithDetails

class RoundSonglistBase(BaseModel):
    round_id: int
    song_id: int
    round_team_id: int
    track_info_id: int  # NEW
    correct_artist_guess: bool = False
    correct_song_title_guess: bool = False
    bonus_correct_movie_guess: bool = False
    score_type: ScoreType = ScoreType.STANDARD

class RoundSonglistCreate(RoundSonglistBase):
    pass

class RoundSonglistUpdate(BaseModel):
    round_team_id: Optional[int] = None
    correct_artist_guess: Optional[bool] = None
    correct_song_title_guess: Optional[bool] = None
    bonus_correct_movie_guess: Optional[bool] = None
    score_type: Optional[ScoreType] = None

class RoundSonglist(RoundSonglistBase):
    """Basic round songlist without relationships"""
    round_songlist_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class RoundSonglistWithDetails(RoundSonglist):
    """With song, artist, and track info details"""
    song: Song
    track_info: TrackInfoWithDetails  # CHANGE: Use TrackInfoWithDetails instead of TrackInfo
    
    model_config = {"from_attributes": True}