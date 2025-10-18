from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from .RoundTeamBase import RoundTeamWithPlayers
from .RoundTeamBase import RoundTeam
from .RoundSonglistBase import RoundSonglist
from .RoundSonglistBase import RoundSonglistWithSong

class RoundBase(BaseModel):
    game_id: int
    round_number: int

class RoundCreate(RoundBase):
    pass

class RoundUpdate(BaseModel):
    round_number: Optional[int] = None

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
    """Round with teams and songs"""
    round_teams: List[RoundTeamWithPlayers] = []
    round_songlists: List[RoundSonglistWithSong] = []
    
    model_config = {"from_attributes": True}
