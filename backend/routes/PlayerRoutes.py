from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..methods import PlayerMethods
from ..schemas import PlayerBase
from .. import database

router = APIRouter(
    prefix="/players"
)

@router.get("/", response_model=list[PlayerBase.Player])
def read_players(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return PlayerMethods.get_players(db, skip=skip, limit=limit)

@router.get("/{player_id}", response_model=PlayerBase.Player)
def read_player(player_id: int, db: Session = Depends(database.get_db)):
    db_player = PlayerMethods.get_player(db, player_id=player_id)
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return db_player

@router.post("/", response_model=PlayerBase.Player)
def create_player(player: PlayerBase.PlayerCreate, db: Session = Depends(database.get_db)):
    return PlayerMethods.create_player(db=db, player=player)

@router.put("/{player_id}", response_model=PlayerBase.Player)
def update_player(player_id: int, player: PlayerBase.PlayerUpdate, db: Session = Depends(database.get_db)):
    db_player = PlayerMethods.update_player(db=db, player_id=player_id, player=player)
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return db_player

@router.delete("/{player_id}")
def delete_player(player_id: int, db: Session = Depends(database.get_db)):
    db_player = PlayerMethods.delete_player(db, player_id=player_id)
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"message": "Player deleted"}