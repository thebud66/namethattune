from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..models.RoundSonglist import RoundSonglist
from ..schemas import RoundSonglistBase
from .. import database

router = APIRouter(prefix="/round-songlists", tags=["round-songlists"])

@router.get("/", response_model=List[RoundSonglistBase.RoundSonglist])
def list_round_songlists(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all round songlists"""
    return db.query(RoundSonglist).offset(skip).limit(limit).all()

@router.get("/{round_songlist_id}", response_model=RoundSonglistBase.RoundSonglistWithDetails)
def get_round_songlist(round_songlist_id: int, db: Session = Depends(database.get_db)):
    """Get a round songlist by ID with full details"""
    songlist = db.query(RoundSonglist)\
        .options(
            joinedload(RoundSonglist.song),
            joinedload(RoundSonglist.track_info).joinedload('artist')
        )\
        .filter(RoundSonglist.round_songlist_id == round_songlist_id)\
        .first()
    
    if songlist is None:
        raise HTTPException(status_code=404, detail="Round songlist not found")
    return songlist

@router.post("/", response_model=RoundSonglistBase.RoundSonglist, status_code=201)
def create_round_songlist(
    songlist: RoundSonglistBase.RoundSonglistCreate,
    db: Session = Depends(database.get_db)
):
    """Add a song to a round"""
    db_songlist = RoundSonglist(
        round_id=songlist.round_id,
        song_id=songlist.song_id,
        round_team_id=songlist.round_team_id,
        track_info_id=songlist.track_info_id,
        correct_artist_guess=songlist.correct_artist_guess,
        correct_song_title_guess=songlist.correct_song_title_guess,
        bonus_correct_movie_guess=songlist.bonus_correct_movie_guess,
        score_type=songlist.score_type
    )
    db.add(db_songlist)
    db.commit()
    db.refresh(db_songlist)
    return db_songlist

@router.put("/{round_songlist_id}", response_model=RoundSonglistBase.RoundSonglist)
def update_round_songlist(
    round_songlist_id: int,
    songlist: RoundSonglistBase.RoundSonglistUpdate,
    db: Session = Depends(database.get_db)
):
    """Update a round songlist (scoring)"""
    db_songlist = db.query(RoundSonglist).filter(
        RoundSonglist.round_songlist_id == round_songlist_id
    ).first()
    if db_songlist is None:
        raise HTTPException(status_code=404, detail="Round songlist not found")
    
    update_data = songlist.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_songlist, key, value)
    
    db.commit()
    db.refresh(db_songlist)
    return db_songlist

@router.delete("/{round_songlist_id}")
def delete_round_songlist(round_songlist_id: int, db: Session = Depends(database.get_db)):
    """Delete a round songlist entry"""
    db_songlist = db.query(RoundSonglist).filter(
        RoundSonglist.round_songlist_id == round_songlist_id
    ).first()
    if db_songlist is None:
        raise HTTPException(status_code=404, detail="Round songlist not found")
    
    db.delete(db_songlist)
    db.commit()
    return {"message": "Round songlist deleted successfully"}