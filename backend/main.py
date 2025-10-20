# Update: backend/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from . import database
from .models import Player, Game, Participant, Round, RoundTeam, RoundTeamPlayer, Song, Artist, TrackInfo, RoundSonglist, GameplaySettings
from .routes.PlayerRoutes import router as player_router
from .routes.GameRoutes import router as game_router
from .routes.ParticipantRoutes import router as participant_router
from .routes.RoundRoutes import router as round_router
from .routes.RoundTeamRoutes import router as round_team_router
from .routes.RoundTeamPlayerRoutes import router as round_team_player_router
from .routes.SongRoutes import router as song_router
from .routes.ArtistRoutes import router as artist_router
from .routes.TrackInfoRoutes import router as track_info_router
from .routes.RoundSonglistRoutes import router as round_songlist_router
from .routes.UploadRoutes import router as upload_router
from .routes.SpotifyRoutes import router as spotify_router
from .routes.SpotifyAuthRoutes import router as spotify_auth_router
from .routes.GameplaySettingsRoutes import router as gameplay_settings_router
from .config import get_settings
from .SpotifyAuth import SpotifyAuth
from .middleware import SpotifyAuthMiddleware
from .database import Base, engine

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE_DIR, "../frontend/public/images")

# Create all tables
Base.metadata.create_all(bind=engine)

settings = get_settings()
spotify_auth = SpotifyAuth(
    client_id=settings.spotify_client_id,
    client_secret=settings.spotify_client_secret,
)

app = FastAPI(
    title="Name That Tune API",
    description="API for the Name That Tune game application",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Spotify Auth Middleware
app.add_middleware(SpotifyAuthMiddleware, spotify_auth=spotify_auth)

# Include all routers
app.include_router(player_router, prefix="/api", tags=["players"])
app.include_router(game_router, prefix="/api", tags=["games"])
app.include_router(participant_router, prefix="/api", tags=["participants"])
app.include_router(round_router, prefix="/api", tags=["rounds"])
app.include_router(round_team_router, prefix="/api", tags=["round-teams"])
app.include_router(round_team_player_router, prefix="/api", tags=["round-team-players"])
app.include_router(song_router, prefix="/api", tags=["songs"])
app.include_router(artist_router, prefix="/api", tags=["artists"])
app.include_router(track_info_router, prefix="/api", tags=["track-infos"])
app.include_router(round_songlist_router, prefix="/api", tags=["round-songlists"])
app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(spotify_router, prefix="/api", tags=["spotify"])
app.include_router(spotify_auth_router, tags=["spotify-auth"])
app.include_router(gameplay_settings_router, prefix="/api", tags=["gameplay-settings"])

# Static files
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to Name That Tune API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}