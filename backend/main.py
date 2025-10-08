import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from . import database
from .models import Player
from .routes.PlayerRoutes import router as player_router
from .routes.UploadRoutes import router as upload_router
from .routes.SpotifyRoutes import router as spotify_router
from .routes.SpotifyAuthRoutes import router as spotify_auth_router
from .config import get_settings
from .SpotifyAuth import SpotifyAuth
from .middleware import SpotifyAuthMiddleware

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE_DIR, "../frontend/public/images")

Player.Base.metadata.create_all(bind=database.engine)

settings = get_settings()
spotify_auth = SpotifyAuth(
    client_id=settings.spotify_client_id,
    client_secret=settings.spotify_client_secret,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SpotifyAuthMiddleware, spotify_auth=spotify_auth)

app.include_router(player_router, prefix="/api", tags=["players"])
app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(spotify_router, prefix="/api", tags=["spotify"])
app.include_router(spotify_auth_router)
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")