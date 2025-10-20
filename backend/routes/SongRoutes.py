from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..models.Song import Song
from ..schemas import SongBase
from .. import database

router = APIRouter(prefix="/songs", tags=["songs"])

@router.get("/", response_model=List[SongBase.Song])
def list_songs(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all songs"""
    return db.query(Song).offset(skip).limit(limit).all()

@router.get("/{song_id}", response_model=SongBase.Song)
def get_song(song_id: int, db: Session = Depends(database.get_db)):
    """Get a song by ID"""
    song = db.query(Song).filter(Song.song_id == song_id).first()
    if song is None:
        raise HTTPException(status_code=404, detail="Song not found")
    return song

@router.post("/", response_model=SongBase.Song, status_code=201)
def create_song(song: SongBase.SongCreate, db: Session = Depends(database.get_db)):
    """Create a song (or return existing if spotify_id exists)"""
    # Check if song already exists
    existing = db.query(Song).filter(Song.spotify_id == song.spotify_id).first()
    if existing:
        # Update title if it's different
        if existing.title != song.title:
            existing.title = song.title
            db.commit()
            db.refresh(existing)
        return existing
    
    db_song = Song(
        spotify_id=song.spotify_id,
        title=song.title
    )
    db.add(db_song)
    db.commit()
    db.refresh(db_song)
    return db_song

@router.put("/{song_id}", response_model=SongBase.Song)
def update_song(
    song_id: int,
    song: SongBase.SongUpdate,
    db: Session = Depends(database.get_db)
):
    """Update a song"""
    db_song = db.query(Song).filter(Song.song_id == song_id).first()
    if db_song is None:
        raise HTTPException(status_code=404, detail="Song not found")
    
    if song.title is not None:
        db_song.title = song.title
    
    db.commit()
    db.refresh(db_song)
    return db_song

@router.delete("/{song_id}")
def delete_song(song_id: int, db: Session = Depends(database.get_db)):
    """Delete a song"""
    db_song = db.query(Song).filter(Song.song_id == song_id).first()
    if db_song is None:
        raise HTTPException(status_code=404, detail="Song not found")
    
    db.delete(db_song)
    db.commit()
    return {"message": "Song deleted successfully"}