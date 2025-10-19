# Save as: backend/routes/TrackInfoRoutes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from ..models.TrackInfo import TrackInfo
from ..schemas import TrackInfoBase
from .. import database

router = APIRouter(prefix="/track-infos", tags=["track-infos"])

@router.get("/", response_model=List[TrackInfoBase.TrackInfo])
def list_track_infos(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all track infos"""
    return db.query(TrackInfo).offset(skip).limit(limit).all()

@router.get("/{track_info_id}", response_model=TrackInfoBase.TrackInfoWithDetails)
def get_track_info(track_info_id: int, db: Session = Depends(database.get_db)):
    """Get a track info by ID with song and artist details"""
    track_info = db.query(TrackInfo).filter(TrackInfo.track_info_id == track_info_id).first()
    if track_info is None:
        raise HTTPException(status_code=404, detail="Track info not found")
    return track_info

@router.post("/", response_model=TrackInfoBase.TrackInfo, status_code=201)
def create_track_info(track_info: TrackInfoBase.TrackInfoCreate, db: Session = Depends(database.get_db)):
    """Create a track info (or return existing if song_id + artist_id combination exists)"""
    # Check if this song/artist combo already exists
    existing = db.query(TrackInfo).filter(
        and_(
            TrackInfo.song_id == track_info.song_id,
            TrackInfo.artist_id == track_info.artist_id
        )
    ).first()
    if existing:
        return existing
    
    db_track_info = TrackInfo(
        song_id=track_info.song_id,
        artist_id=track_info.artist_id
    )
    db.add(db_track_info)
    db.commit()
    db.refresh(db_track_info)
    return db_track_info

@router.delete("/{track_info_id}")
def delete_track_info(track_info_id: int, db: Session = Depends(database.get_db)):
    """Delete a track info"""
    db_track_info = db.query(TrackInfo).filter(TrackInfo.track_info_id == track_info_id).first()
    if db_track_info is None:
        raise HTTPException(status_code=404, detail="Track info not found")
    
    db.delete(db_track_info)
    db.commit()
    return {"message": "Track info deleted successfully"}