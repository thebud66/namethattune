from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..methods import RoundMethods
from ..schemas import RoundBase
from .. import database

router = APIRouter(prefix="/rounds", tags=["rounds"])

@router.get("/", response_model=List[RoundBase.Round])
def list_rounds(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all rounds"""
    return RoundMethods.get_rounds(db, skip=skip, limit=limit)

# IMPORTANT: More specific routes MUST come before generic routes with path parameters
@router.get("/game/{game_id}/active", response_model=RoundBase.RoundWithDetails)
def get_active_round(game_id: int, db: Session = Depends(database.get_db)):
    """Get the active (incomplete) round for a game"""
    round_obj = RoundMethods.get_active_round_for_game(db, game_id=game_id)
    if round_obj is None:
        raise HTTPException(status_code=404, detail="No active round found")
    
    # Get full details for the active round
    return RoundMethods.get_round_with_details(db, round_id=round_obj.round_id)

@router.get("/game/{game_id}", response_model=List[RoundBase.Round])
def get_rounds_by_game(game_id: int, db: Session = Depends(database.get_db)):
    """Get all rounds for a specific game"""
    return RoundMethods.get_rounds_by_game(db, game_id=game_id)

@router.get("/{round_id}", response_model=RoundBase.Round)
def get_round(round_id: int, db: Session = Depends(database.get_db)):
    """Get a single round"""
    round_obj = RoundMethods.get_round(db, round_id=round_id)
    if round_obj is None:
        raise HTTPException(status_code=404, detail="Round not found")
    return round_obj

@router.get("/{round_id}/with-teams", response_model=RoundBase.RoundWithTeams)
def get_round_with_teams(round_id: int, db: Session = Depends(database.get_db)):
    """Get round with teams"""
    round_obj = RoundMethods.get_round_with_teams(db, round_id=round_id)
    if round_obj is None:
        raise HTTPException(status_code=404, detail="Round not found")
    return round_obj

@router.get("/{round_id}/details", response_model=RoundBase.RoundWithDetails)
def get_round_details(round_id: int, db: Session = Depends(database.get_db)):
    """Get round with all details (teams and songs)"""
    round_obj = RoundMethods.get_round_with_details(db, round_id=round_id)
    if round_obj is None:
        raise HTTPException(status_code=404, detail="Round not found")
    return round_obj

@router.post("/", response_model=RoundBase.Round, status_code=201)
def create_round(round: RoundBase.RoundCreate, db: Session = Depends(database.get_db)):
    """Create a new round for a game"""
    return RoundMethods.create_round(db=db, round=round)

@router.put("/{round_id}", response_model=RoundBase.Round)
def update_round(
    round_id: int,
    round: RoundBase.RoundUpdate,
    db: Session = Depends(database.get_db)
):
    """Update a round"""
    db_round = RoundMethods.update_round(db=db, round_id=round_id, round=round)
    if db_round is None:
        raise HTTPException(status_code=404, detail="Round not found")
    return db_round

@router.delete("/{round_id}")
def delete_round(round_id: int, db: Session = Depends(database.get_db)):
    """Delete a round"""
    db_round = RoundMethods.delete_round(db, round_id=round_id)
    if db_round is None:
        raise HTTPException(status_code=404, detail="Round not found")
    return {"message": "Round deleted successfully"}