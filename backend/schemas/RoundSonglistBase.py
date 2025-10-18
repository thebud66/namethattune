from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..models.Enums import ScoreType 
from .SongBase import Song

class RoundSonglistBase(BaseModel):
    round_id: int
    song_id: int
    round_team_id: int
    correct_artist_guess: bool = False
    correct_song_title_guess: bool = False
    bonus_correct_movie_guess: bool = False
    score_type: ScoreType = ScoreType.STANDARD

class RoundSonglistCreate(RoundSonglistBase):
    pass

class RoundSonglistUpdate(BaseModel):
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

class RoundSonglistWithSong(RoundSonglist):
    """With song details"""
    song: Song
    
    model_config = {"from_attributes": True}
