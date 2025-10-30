# backend/methods/GameMethods.py
from sqlalchemy.orm import Session, joinedload, selectinload
from ..models.Game import Game
from ..models.Participant import Participant
from ..models.Round import Round
from ..schemas.GameBase import GameCreate, GameUpdate

def get_game(db: Session, game_id: int):
    """Get basic game without relationships"""
    return db.query(Game).filter(Game.game_id == game_id).first()

def get_games(db: Session, skip: int = 0, limit: int = 100):
    """Get all games without relationships"""
    return db.query(Game).offset(skip).limit(limit).all()

def get_game_with_participants(db: Session, game_id: int):
    """Get game with participants and their player details"""
    return db.query(Game)\
        .options(
            joinedload(Game.participants)
            .joinedload(Participant.player)
        )\
        .filter(Game.game_id == game_id)\
        .first()

def get_game_full(db: Session, game_id: int):
    """Get game with all relationships"""
    return db.query(Game)\
        .options(
            joinedload(Game.participants).joinedload(Participant.player),
            selectinload(Game.rounds)
        )\
        .filter(Game.game_id == game_id)\
        .first()

def create_game(db: Session, game: GameCreate):
    """Create a new game"""
    db_game = Game(
        started_at=game.started_at,
        ended_at=game.ended_at,
        playlist_id=game.playlist_id,
        current_track_index=game.current_track_index,
        all_time_dj_participant_id=game.all_time_dj_participant_id
    )
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game

def update_game(db: Session, game_id: int, game: GameUpdate):
    """Update a game"""
    db_game = db.query(Game).filter(Game.game_id == game_id).first()
    if db_game:
        update_data = game.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_game, key, value)
        db.commit()
        db.refresh(db_game)
    return db_game

def delete_game(db: Session, game_id: int):
    """Delete a game (cascades to participants and rounds)"""
    db_game = db.query(Game).filter(Game.game_id == game_id).first()
    if db_game:
        db.delete(db_game)
        db.commit()
    return db_game