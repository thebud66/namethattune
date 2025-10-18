from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from ..models.Participant import Participant
from ..models.Player import Player
from ..schemas.ParticipantBase import ParticipantCreate, ParticipantUpdate

def get_participant(db: Session, participant_id: int):
    """Get basic participant"""
    return db.query(Participant).filter(Participant.participant_id == participant_id).first()

def get_participants(db: Session, skip: int = 0, limit: int = 100):
    """Get all participants"""
    return db.query(Participant).offset(skip).limit(limit).all()

def get_participants_by_game(db: Session, game_id: int):
    """Get all participants for a game with player details"""
    return db.query(Participant)\
        .options(joinedload(Participant.player))\
        .filter(Participant.game_id == game_id)\
        .order_by(Participant.seat_number)\
        .all()

def get_participant_with_player(db: Session, participant_id: int):
    """Get participant with player details"""
    return db.query(Participant)\
        .options(joinedload(Participant.player))\
        .filter(Participant.participant_id == participant_id)\
        .first()

def create_participant(db: Session, participant: ParticipantCreate):
    """Create a new participant"""
    # Check if player already participating in this game
    existing = db.query(Participant).filter(
        and_(
            Participant.game_id == participant.game_id,
            Participant.player_id == participant.player_id
        )
    ).first()
    
    if existing:
        return existing  # Return existing instead of error
    
    db_participant = Participant(
        game_id=participant.game_id,
        player_id=participant.player_id,
        seat_number=participant.seat_number
    )
    db.add(db_participant)
    db.commit()
    db.refresh(db_participant)
    return db_participant

def update_participant(db: Session, participant_id: int, participant: ParticipantUpdate):
    """Update a participant"""
    db_participant = db.query(Participant).filter(Participant.participant_id == participant_id).first()
    if db_participant:
        update_data = participant.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_participant, key, value)
        db.commit()
        db.refresh(db_participant)
    return db_participant

def delete_participant(db: Session, participant_id: int):
    """Delete a participant"""
    db_participant = db.query(Participant).filter(Participant.participant_id == participant_id).first()
    if db_participant:
        db.delete(db_participant)
        db.commit()
    return db_participant