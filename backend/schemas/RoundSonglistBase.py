from pydantic import BaseModel
from datetime import datetime
from ..models.Enums import ScoreType 

class RoundSonglistBase(BaseModel):
    round_id: int | None = None
    songlist_id: int | None = None
    round_team_id: int | None = None
    correct_artist_guess: bool | None = None
    correct_song_title_guess: bool | None = None
    bonus_correct_movie_guess: bool | None = None
    score_type: ScoreType | None = ScoreType.STANDARD

class RoundSonglistCreate(RoundSonglistBase):
    pass

class RoundSonglistUpdate(RoundSonglistBase):
    pass

class RoundSonglist(RoundSonglistBase):
    round_songlist_id: int
    created_at: datetime
    updated_at: datetime | None = None

model_config = {
    "from_attributes": True,
}
