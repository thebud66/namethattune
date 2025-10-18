from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from ..models.Enums import Role
from .RoundTeamPlayerBase import RoundTeamPlayerWithParticipant

class RoundTeamBase(BaseModel):
    round_id: int
    role: Role = Role.PLAYER

class RoundTeamCreate(RoundTeamBase):
    pass

class RoundTeamUpdate(BaseModel):
    role: Optional[Role] = None

class RoundTeam(RoundTeamBase):
    """Basic round team without relationships"""
    round_team_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class RoundTeamWithPlayers(RoundTeam):
    """Round team with players"""
    round_team_players: List[RoundTeamPlayerWithParticipant] = []
    
    model_config = {"from_attributes": True}
