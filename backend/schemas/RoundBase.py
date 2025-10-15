from pydantic import BaseModel
from datetime import datetime

class RoundBase(BaseModel):
    game_id: int | None = None
    round_number: int | None = None

class RoundCreate(RoundBase):
    pass

class RoundUpdate(RoundBase):
    pass

class Round(RoundBase):
    round_id: int
    created_at: datetime
    updated_at: datetime | None = None

model_config = {
    "from_attributes": True,
}