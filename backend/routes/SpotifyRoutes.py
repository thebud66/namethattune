from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import List, Optional
from pydantic import BaseModel
from ..models.Spotify.Artist import Artist
from ..models.Spotify.Album import Album
from ..models.Spotify.Track import Track
from ..models.Spotify.Playlist import Playlist
from ..models.Spotify.User import User
from ..services.SpotifyService import SpotifyService
from ..schemas import SpotifyBase

router = APIRouter(prefix="/spotify")


# Dependency to get Spotify service with auth
async def get_spotify_service(request: Request) -> SpotifyService:
    """Get SpotifyService with token from middleware"""
    token = getattr(request.state, "spotify_token", None)
    if not token:
        raise HTTPException(status_code=401, detail="No Spotify authentication token available")
    return SpotifyService(token)


# Pydantic models for request bodies
class TransferPlaybackRequest(BaseModel):
    device_id: str
    play: bool = False


# User routes
@router.get("/me", response_model=User)
async def get_current_user(service: SpotifyService = Depends(get_spotify_service)):
    """Get the current user's profile"""
    try:
        data = service.get_current_user()
        return User.from_dict(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Player routes
@router.get("/me/player/currently-playing")
async def get_currently_playing(service: SpotifyService = Depends(get_spotify_service)):
    """Get the currently playing track - returns raw Spotify data"""
    try:
        data = service.get_currently_playing()
        if data and data.get('item'):
            return data['item']
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me/player")
async def get_playback_state(service: SpotifyService = Depends(get_spotify_service)):
    """Get current playback state"""
    try:
        data = service.get_playback_state()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me/player/devices")
async def get_available_devices(service: SpotifyService = Depends(get_spotify_service)):
    """Get user's available Spotify devices"""
    try:
        data = service.get_available_devices()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/me/player/transfer")
async def transfer_playback(
    request: TransferPlaybackRequest,
    service: SpotifyService = Depends(get_spotify_service)
):
    """Transfer playback to a specific device"""
    try:
        service.transfer_playback([request.device_id], request.play)
        return {"message": "Playback transferred successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/me/player/pause")
async def pause_playback(service: SpotifyService = Depends(get_spotify_service)):
    """Pause playback on the user's active device"""
    try:
        service.pause_playback()
        return {"message": "Playback paused"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/me/player/play")
async def start_playback(
    request: SpotifyBase.PlaybackRequest,
    device_id: Optional[str] = Query(None, description="Device ID to play on"),
    service: SpotifyService = Depends(get_spotify_service)
):
    """Start or resume playback"""
    try:
        service.start_playback(
            context_uri=request.context_uri,
            uris=request.uris,
            position_ms=request.position_ms,
            offset=request.offset,
            device_id=device_id
        )
        return {"message": "Playback started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/me/player/shuffle")
async def set_shuffle(
    state: bool = Query(..., description="true to turn on shuffle, false to turn off"),
    service: SpotifyService = Depends(get_spotify_service)
):
    """Toggle shuffle on or off for user's playback"""
    try:
        service.set_shuffle(state)
        return {"message": f"Shuffle {'enabled' if state else 'disabled'}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/me/player/next")
async def skip_to_next(service: SpotifyService = Depends(get_spotify_service)):
    """Skip to next track"""
    try:
        service.skip_to_next()
        return {"message": "Skipped to next track"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Playlist routes  
@router.get("/me/playlists", response_model=List[Playlist])
async def get_user_playlists(
    limit: int = Query(50, ge=1, le=50),
    service: SpotifyService = Depends(get_spotify_service)
):
    """Get current user's playlists"""
    try:
        data = service.get_user_playlists(limit)
        return [Playlist.from_dict(playlist) for playlist in data['items']]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/playlists/{playlist_id}", response_model=Playlist)
async def get_playlist(playlist_id: str, service: SpotifyService = Depends(get_spotify_service)):
    """Get a playlist by ID including track count"""
    try:
        data = service.get_playlist(playlist_id)
        return Playlist.from_dict(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/playlists/{playlist_id}/tracks/paginated")
async def get_playlist_tracks_paginated(
    playlist_id: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    service: SpotifyService = Depends(get_spotify_service)
):
    """Get playlist tracks with pagination"""
    try:
        data = service.get_playlist_tracks_paginated(playlist_id, offset, limit)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))