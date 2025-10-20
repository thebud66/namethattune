# backend/methods/GameplaySettingsMethods.py
from sqlalchemy.orm import Session
from ..models.GameplaySettings import GameplaySettings
from ..schemas.GameplaySettingsBase import GameplaySettingsCreate, GameplaySettingsUpdate

def get_setting_by_key(db: Session, key: str):
    """Get a setting by key"""
    return db.query(GameplaySettings).filter(GameplaySettings.key == key).first()

def get_all_settings(db: Session, skip: int = 0, limit: int = 100):
    """Get all settings"""
    return db.query(GameplaySettings).offset(skip).limit(limit).all()

def create_setting(db: Session, setting: GameplaySettingsCreate):
    """Create a new setting"""
    # Check if key already exists
    existing = get_setting_by_key(db, setting.key)
    if existing:
        raise ValueError(f"Setting with key '{setting.key}' already exists")
    
    db_setting = GameplaySettings(
        key=setting.key,
        value=setting.value
    )
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

def update_setting(db: Session, key: str, setting: GameplaySettingsUpdate):
    """Update a setting by key"""
    db_setting = get_setting_by_key(db, key)
    if db_setting:
        db_setting.value = setting.value
        db.commit()
        db.refresh(db_setting)
    return db_setting

def upsert_setting(db: Session, key: str, value: str):
    """Create or update a setting"""
    db_setting = get_setting_by_key(db, key)
    if db_setting:
        db_setting.value = value
    else:
        db_setting = GameplaySettings(key=key, value=value)
        db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

def delete_setting(db: Session, key: str):
    """Delete a setting by key"""
    db_setting = get_setting_by_key(db, key)
    if db_setting:
        db.delete(db_setting)
        db.commit()
    return db_setting