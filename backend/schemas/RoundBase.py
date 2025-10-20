from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from .RoundTeamBase import RoundTeamWithPlayers, RoundTeam
from .RoundSonglistBase import RoundSonglist, RoundSonglistWithDetails

class RoundBase(BaseModel):
    game_id: int
    round_number: int
    is_complete: bool = False  # NEW

class RoundCreate(BaseModel):
    game_id: int
    round_number: int
    # is_complete defaults to False, not included in create

class RoundUpdate(BaseModel):
    round_number: Optional[int] = None
    is_complete: Optional[bool] = None  # NEW

class Round(RoundBase):
    """Basic round without relationships"""
    round_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class RoundWithTeams(Round):
    """Round with teams"""
    round_teams: List[RoundTeam] = []
    
    model_config = {"from_attributes": True}

class RoundWithSongs(Round):
    """Round with songs"""
    round_songlists: List[RoundSonglist] = []
    
    model_config = {"from_attributes": True}

class RoundWithDetails(Round):
    """Round with teams and songs with full details"""
    round_teams: List[RoundTeamWithPlayers] = []
    round_songlists: List[RoundSonglistWithDetails] = []
    
    model_config = {"from_attributes": True}