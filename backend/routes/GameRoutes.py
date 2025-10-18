from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..methods import GameMethods
from ..schemas import GameBase
from .. import database

router = APIRouter(prefix="/games", tags=["games"])

@router.get("/", response_model=List[GameBase.Game])
def list_games(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all games (without relationships for performance)"""
    return GameMethods.get_games(db, skip=skip, limit=limit)

@router.get("/{game_id}", response_model=GameBase.Game)
def get_game(game_id: int, db: Session = Depends(database.get_db)):
    """Get a single game"""
    game = GameMethods.get_game(db, game_id=game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

@router.get("/{game_id}/with-participants", response_model=GameBase.GameWithParticipants)
def get_game_with_participants(game_id: int, db: Session = Depends(database.get_db)):
    """Get game with all participants and their player details"""
    game = GameMethods.get_game_with_participants(db, game_id=game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

@router.get("/{game_id}/full", response_model=GameBase.GameFull)
def get_game_full(game_id: int, db: Session = Depends(database.get_db)):
    """Get game with all relationships (participants and rounds)"""
    game = GameMethods.get_game_full(db, game_id=game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

@router.post("/", response_model=GameBase.Game, status_code=201)
def create_game(game: GameBase.GameCreate, db: Session = Depends(database.get_db)):
    """Create a new game"""
    return GameMethods.create_game(db=db, game=game)

@router.put("/{game_id}", response_model=GameBase.Game)
def update_game(
    game_id: int,
    game: GameBase.GameUpdate,
    db: Session = Depends(database.get_db)
):
    """Update a game"""
    db_game = GameMethods.update_game(db=db, game_id=game_id, game=game)
    if db_game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return db_game

@router.delete("/{game_id}")
def delete_game(game_id: int, db: Session = Depends(database.get_db)):
    """Delete a game (cascades to participants and rounds)"""
    db_game = GameMethods.delete_game(db, game_id=game_id)
    if db_game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"message": "Game deleted successfully"}