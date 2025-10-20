# backend/routes/GameplaySettingsRoutes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..methods.GameplaySettingsMethods import (
    get_setting_by_key,
    get_all_settings,
    create_setting,
    update_setting,
    upsert_setting,
    delete_setting
)
from ..schemas.GameplaySettingsBase import (
    GameplaySettings,
    GameplaySettingsCreate,
    GameplaySettingsUpdate
)
from ..database import get_db

router = APIRouter(prefix="/gameplay-settings", tags=["gameplay-settings"])

@router.get("/", response_model=List[GameplaySettings])
def list_settings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all gameplay settings"""
    return get_all_settings(db, skip=skip, limit=limit)

@router.get("/{key}", response_model=GameplaySettings)
def get_setting(key: str, db: Session = Depends(get_db)):
    """Get a specific setting by key"""
    setting = get_setting_by_key(db, key)
    if setting is None:
        raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")
    return setting

@router.post("/", response_model=GameplaySettings, status_code=201)
def create_new_setting(setting: GameplaySettingsCreate, db: Session = Depends(get_db)):
    """Create a new setting"""
    try:
        return create_setting(db, setting)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{key}", response_model=GameplaySettings)
def update_existing_setting(
    key: str,
    setting: GameplaySettingsUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing setting"""
    db_setting = update_setting(db, key, setting)
    if db_setting is None:
        raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")
    return db_setting

@router.put("/{key}/upsert", response_model=GameplaySettings)
def upsert_setting_route(key: str, value: str, db: Session = Depends(get_db)):
    """Create or update a setting (upsert)"""
    return upsert_setting(db, key, value)

@router.delete("/{key}")
def delete_existing_setting(key: str, db: Session = Depends(get_db)):
    """Delete a setting"""
    db_setting = delete_setting(db, key)
    if db_setting is None:
        raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")
    return {"message": f"Setting '{key}' deleted successfully"}