from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..methods import ParticipantMethods
from ..schemas import ParticipantBase
from .. import database

router = APIRouter(prefix="/participants", tags=["participants"])

@router.get("/", response_model=List[ParticipantBase.Participant])
def list_participants(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all participants"""
    return ParticipantMethods.get_participants(db, skip=skip, limit=limit)

@router.get("/{participant_id}", response_model=ParticipantBase.ParticipantWithPlayer)
def get_participant(participant_id: int, db: Session = Depends(database.get_db)):
    """Get a single participant with player details"""
    participant = ParticipantMethods.get_participant_with_player(db, participant_id=participant_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found")
    return participant

@router.get("/game/{game_id}", response_model=List[ParticipantBase.ParticipantWithPlayer])
def get_participants_by_game(game_id: int, db: Session = Depends(database.get_db)):
    """Get all participants for a specific game"""
    return ParticipantMethods.get_participants_by_game(db, game_id=game_id)

@router.post("/", response_model=ParticipantBase.Participant, status_code=201)
def create_participant(participant: ParticipantBase.ParticipantCreate, db: Session = Depends(database.get_db)):
    """Add a player to a game as a participant"""
    return ParticipantMethods.create_participant(db=db, participant=participant)

@router.put("/{participant_id}", response_model=ParticipantBase.Participant)
def update_participant(
    participant_id: int,
    participant: ParticipantBase.ParticipantUpdate,
    db: Session = Depends(database.get_db)
):
    """Update a participant (e.g., change seat number)"""
    db_participant = ParticipantMethods.update_participant(
        db=db,
        participant_id=participant_id,
        participant=participant
    )
    if db_participant is None:
        raise HTTPException(status_code=404, detail="Participant not found")
    return db_participant

@router.delete("/{participant_id}")
def delete_participant(participant_id: int, db: Session = Depends(database.get_db)):
    """Remove a participant from a game"""
    db_participant = ParticipantMethods.delete_participant(db, participant_id=participant_id)
    if db_participant is None:
        raise HTTPException(status_code=404, detail="Participant not found")
    return {"message": "Participant removed successfully"}