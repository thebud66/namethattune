# Update: backend/routes/__init__.py
from .PlayerRoutes import router as player_router
from .GameRoutes import router as game_router
from .ParticipantRoutes import router as participant_router
from .RoundRoutes import router as round_router
from .RoundTeamRoutes import router as round_team_router
from .RoundTeamPlayerRoutes import router as round_team_player_router
from .UploadRoutes import router as upload_router
from .SpotifyRoutes import router as spotify_router
from .SpotifyAuthRoutes import router as spotify_auth_router

__all__ = [
    "player_router",
    "game_router",
    "participant_router",
    "round_router",
    "round_team_router",
    "round_team_player_router",
    "upload_router",
    "spotify_router",
    "spotify_auth_router"
]