from pydantic import BaseModel
from datetime import datetime

class PlayerBase(BaseModel):
    name: str
    image_url: str | None = None

class PlayerCreate(PlayerBase):
    pass

class PlayerUpdate(PlayerBase):
    pass

class Player(PlayerBase):
    player_id: int
    created_at: datetime
    updated_at: datetime | None = None

model_config = {
    "from_attributes": True,
}
