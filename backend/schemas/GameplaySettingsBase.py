# backend/schemas/GameplaySettingsBase.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class GameplaySettingsBase(BaseModel):
    key: str
    value: str

class GameplaySettingsCreate(GameplaySettingsBase):
    pass

class GameplaySettingsUpdate(BaseModel):
    value: str

class GameplaySettings(GameplaySettingsBase):
    setting_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True