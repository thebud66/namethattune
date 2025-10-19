from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..models.RoundTeam import RoundTeam
from ..schemas import RoundTeamBase
from .. import database

router = APIRouter(prefix="/round-teams", tags=["round-teams"])

@router.get("/", response_model=List[RoundTeamBase.RoundTeam])
def list_round_teams(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all round teams"""
    return db.query(RoundTeam).offset(skip).limit(limit).all()

@router.get("/{round_team_id}", response_model=RoundTeamBase.RoundTeamWithPlayers)
def get_round_team(round_team_id: int, db: Session = Depends(database.get_db)):
    """Get a single round team with players"""
    round_team = db.query(RoundTeam).filter(RoundTeam.round_team_id == round_team_id).first()
    if round_team is None:
        raise HTTPException(status_code=404, detail="Round team not found")
    return round_team

@router.post("/", response_model=RoundTeamBase.RoundTeam, status_code=201)
def create_round_team(round_team: RoundTeamBase.RoundTeamCreate, db: Session = Depends(database.get_db)):
    """Create a new round team"""
    db_round_team = RoundTeam(
        round_id=round_team.round_id,
        role=round_team.role
    )
    db.add(db_round_team)
    db.commit()
    db.refresh(db_round_team)
    return db_round_team

@router.put("/{round_team_id}", response_model=RoundTeamBase.RoundTeam)
def update_round_team(
    round_team_id: int,
    round_team: RoundTeamBase.RoundTeamUpdate,
    db: Session = Depends(database.get_db)
):
    """Update a round team"""
    db_round_team = db.query(RoundTeam).filter(RoundTeam.round_team_id == round_team_id).first()
    if db_round_team is None:
        raise HTTPException(status_code=404, detail="Round team not found")
    
    update_data = round_team.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_round_team, key, value)
    
    db.commit()
    db.refresh(db_round_team)
    return db_round_team

@router.delete("/{round_team_id}")
def delete_round_team(round_team_id: int, db: Session = Depends(database.get_db)):
    """Delete a round team"""
    db_round_team = db.query(RoundTeam).filter(RoundTeam.round_team_id == round_team_id).first()
    if db_round_team is None:
        raise HTTPException(status_code=404, detail="Round team not found")
    
    db.delete(db_round_team)
    db.commit()
    return {"message": "Round team deleted successfully"}