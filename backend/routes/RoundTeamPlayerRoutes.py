# Save as: backend/routes/RoundTeamPlayerRoutes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..models.RoundTeamPlayer import RoundTeamPlayer
from ..schemas import RoundTeamPlayerBase
from .. import database

router = APIRouter(prefix="/round-team-players", tags=["round-team-players"])

@router.get("/", response_model=List[RoundTeamPlayerBase.RoundTeamPlayer])
def list_round_team_players(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all round team players"""
    return db.query(RoundTeamPlayer).offset(skip).limit(limit).all()

@router.get("/{round_team_player_id}", response_model=RoundTeamPlayerBase.RoundTeamPlayerWithParticipant)
def get_round_team_player(round_team_player_id: int, db: Session = Depends(database.get_db)):
    """Get a single round team player with participant details"""
    round_team_player = db.query(RoundTeamPlayer).filter(
        RoundTeamPlayer.round_team_player_id == round_team_player_id
    ).first()
    if round_team_player is None:
        raise HTTPException(status_code=404, detail="Round team player not found")
    return round_team_player

@router.post("/", response_model=RoundTeamPlayerBase.RoundTeamPlayer, status_code=201)
def create_round_team_player(
    round_team_player: RoundTeamPlayerBase.RoundTeamPlayerCreate,
    db: Session = Depends(database.get_db)
):
    """Add a player to a round team"""
    db_round_team_player = RoundTeamPlayer(
        round_team_id=round_team_player.round_team_id,
        participant_id=round_team_player.participant_id
    )
    db.add(db_round_team_player)
    db.commit()
    db.refresh(db_round_team_player)
    return db_round_team_player

@router.delete("/{round_team_player_id}")
def delete_round_team_player(round_team_player_id: int, db: Session = Depends(database.get_db)):
    """Remove a player from a round team"""
    db_round_team_player = db.query(RoundTeamPlayer).filter(
        RoundTeamPlayer.round_team_player_id == round_team_player_id
    ).first()
    if db_round_team_player is None:
        raise HTTPException(status_code=404, detail="Round team player not found")
    
    db.delete(db_round_team_player)
    db.commit()
    return {"message": "Round team player removed successfully"}