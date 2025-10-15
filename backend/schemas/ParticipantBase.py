from pydantic import BaseModel
from datetime import datetime

class ParticipantBase(BaseModel):
    game_id: int | None = None
    player_id: int | None = None
    seat_number: int | None = None

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantUPdate(ParticipantBase):
    pass

class Participant(ParticipantBase):
    participant_id: int
    created_at: datetime
    updated_at: datetime | None = None

model_config = {
    "from_attributes": True,
}
