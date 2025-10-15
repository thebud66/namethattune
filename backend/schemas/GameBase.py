from pydantic import BaseModel
from datetime import datetime

class GameBase(BaseModel):
    started_at: datetime | None = None
    ended_at: datetime | None = None

class GameCreate(GameBase):
    pass

class GameUpdate(GameBase):
    pass

class Game(GameBase):
    game_id: int
    created_at: datetime
    updated_at: datetime | None = None

model_config = {
    "from_attributes": True,
}
