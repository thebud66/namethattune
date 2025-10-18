from sqlalchemy.orm import Session, joinedload, selectinload
from ..models.Round import Round
from ..models.RoundTeam import RoundTeam
from ..models.RoundSonglist import RoundSonglist
from ..schemas.RoundBase import RoundCreate, RoundUpdate

def get_round(db: Session, round_id: int):
    """Get basic round"""
    return db.query(Round).filter(Round.round_id == round_id).first()

def get_rounds(db: Session, skip: int = 0, limit: int = 100):
    """Get all rounds"""
    return db.query(Round).offset(skip).limit(limit).all()

def get_rounds_by_game(db: Session, game_id: int):
    """Get all rounds for a game"""
    return db.query(Round)\
        .filter(Round.game_id == game_id)\
        .order_by(Round.round_number)\
        .all()

def get_round_with_teams(db: Session, round_id: int):
    """Get round with teams and their players"""
    return db.query(Round)\
        .options(
            selectinload(Round.round_teams)
            .selectinload(RoundTeam.round_team_players)
        )\
        .filter(Round.round_id == round_id)\
        .first()

def get_round_with_details(db: Session, round_id: int):
    """Get round with all details (teams and songs)"""
    return db.query(Round)\
        .options(
            selectinload(Round.round_teams),
            selectinload(Round.round_songlists).joinedload(RoundSonglist.song)
        )\
        .filter(Round.round_id == round_id)\
        .first()

def create_round(db: Session, round: RoundCreate):
    """Create a new round"""
    db_round = Round(
        game_id=round.game_id,
        round_number=round.round_number
    )
    db.add(db_round)
    db.commit()
    db.refresh(db_round)
    return db_round

def update_round(db: Session, round_id: int, round: RoundUpdate):
    """Update a round"""
    db_round = db.query(Round).filter(Round.round_id == round_id).first()
    if db_round:
        update_data = round.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_round, key, value)
        db.commit()
        db.refresh(db_round)
    return db_round

def delete_round(db: Session, round_id: int):
    """Delete a round"""
    db_round = db.query(Round).filter(Round.round_id == round_id).first()
    if db_round:
        db.delete(db_round)
        db.commit()
    return db_round