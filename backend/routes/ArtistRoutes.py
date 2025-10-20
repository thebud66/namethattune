from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..models.Artist import Artist
from ..schemas import ArtistBase
from .. import database

router = APIRouter(prefix="/artists", tags=["artists"])

@router.get("/", response_model=List[ArtistBase.Artist])
def list_artists(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all artists"""
    return db.query(Artist).offset(skip).limit(limit).all()

@router.get("/{artist_id}", response_model=ArtistBase.Artist)
def get_artist(artist_id: int, db: Session = Depends(database.get_db)):
    """Get an artist by ID"""
    artist = db.query(Artist).filter(Artist.artist_id == artist_id).first()
    if artist is None:
        raise HTTPException(status_code=404, detail="Artist not found")
    return artist

@router.post("/", response_model=ArtistBase.Artist, status_code=201)
def create_artist(artist: ArtistBase.ArtistCreate, db: Session = Depends(database.get_db)):
    """Create an artist (or return existing if spotify_id exists)"""
    # Check if artist already exists
    existing = db.query(Artist).filter(Artist.spotify_id == artist.spotify_id).first()
    if existing:
        # Update name if it's different
        if existing.name != artist.name:
            existing.name = artist.name
            db.commit()
            db.refresh(existing)
        return existing
    
    db_artist = Artist(
        spotify_id=artist.spotify_id,
        name=artist.name
    )
    db.add(db_artist)
    db.commit()
    db.refresh(db_artist)
    return db_artist

@router.put("/{artist_id}", response_model=ArtistBase.Artist)
def update_artist(
    artist_id: int,
    artist: ArtistBase.ArtistUpdate,
    db: Session = Depends(database.get_db)
):
    """Update an artist"""
    db_artist = db.query(Artist).filter(Artist.artist_id == artist_id).first()
    if db_artist is None:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    if artist.name is not None:
        db_artist.name = artist.name
    
    db.commit()
    db.refresh(db_artist)
    return db_artist

@router.delete("/{artist_id}")
def delete_artist(artist_id: int, db: Session = Depends(database.get_db)):
    """Delete an artist"""
    db_artist = db.query(Artist).filter(Artist.artist_id == artist_id).first()
    if db_artist is None:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    db.delete(db_artist)
    db.commit()
    return {"message": "Artist deleted successfully"}