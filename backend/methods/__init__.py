# backend/methods/__init__.py
from .PlayerMethods import (
    get_player,
    get_players,
    create_player,
    update_player,
    delete_player
)

from .GameMethods import (
    get_game,
    get_games,
    get_game_with_participants,
    get_game_full,
    create_game,
    update_game,
    delete_game
)

from .ParticipantMethods import (
    get_participant,
    get_participants,
    get_participants_by_game,
    get_participant_with_player,
    create_participant,
    update_participant,
    delete_participant
)

from .RoundMethods import (
    get_round,
    get_rounds,
    get_rounds_by_game,
    get_active_round_for_game,  # NEW
    get_round_with_teams,
    get_round_with_details,
    create_round,
    update_round,
    delete_round
)

# Create namespace objects for cleaner imports
class PlayerMethods:
    get_player = get_player
    get_players = get_players
    create_player = create_player
    update_player = update_player
    delete_player = delete_player

class GameMethods:
    get_game = get_game
    get_games = get_games
    get_game_with_participants = get_game_with_participants
    get_game_full = get_game_full
    create_game = create_game
    update_game = update_game
    delete_game = delete_game

class ParticipantMethods:
    get_participant = get_participant
    get_participants = get_participants
    get_participants_by_game = get_participants_by_game
    get_participant_with_player = get_participant_with_player
    create_participant = create_participant
    update_participant = update_participant
    delete_participant = delete_participant

class RoundMethods:
    get_round = get_round
    get_rounds = get_rounds
    get_rounds_by_game = get_rounds_by_game
    get_active_round_for_game = get_active_round_for_game  # NEW
    get_round_with_teams = get_round_with_teams
    get_round_with_details = get_round_with_details
    create_round = create_round
    update_round = update_round
    delete_round = delete_round

__all__ = [
    "PlayerMethods",
    "GameMethods",
    "ParticipantMethods",
    "RoundMethods"
]