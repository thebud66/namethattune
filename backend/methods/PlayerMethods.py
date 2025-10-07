from sqlalchemy.orm import Session
from ..models.Player import Player
from ..schemas.PlayerBase import PlayerCreate, PlayerUpdate

def get_player(db: Session, player_id: int):
    return db.query(Player).filter(Player.player_id == player_id).first()

def get_players(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Player).offset(skip).limit(limit).all()

def create_player(db: Session, player: PlayerCreate):
    db_player = Player(name=player.name, image_url=player.image_url)
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

def update_player(db: Session, player_id: int, player: PlayerUpdate):
    db_player = db.query(Player).filter(Player.player_id == player_id).first()
    if db_player:
        db_player.name = player.name
        db_player.image_url = player.image_url
        db.commit()
        db.refresh(db_player)
    return db_player

def delete_player(db: Session, player_id: int):
    db_player = db.query(Player).filter(Player.player_id == player_id).first()
    if db_player:
        db.delete(db_player)
        db.commit()
    return db_player

