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



# User routes
@router.get("/me", response_model=User)
async def get_current_user(service: SpotifyService = Depends(get_spotify_service)):
    """Get the current user's profile"""
    try:
        data = service.get_current_user()
        return User.from_dict(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str, service: SpotifyService = Depends(get_spotify_service)):
    """Get a user's profile by ID"""
    try:
        data = service.get_user_profile(user_id)
        return User.from_dict(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Track routes
@router.get("/tracks/{track_id}", response_model=Track)
async def get_track(track_id: str, service: SpotifyService = Depends(get_spotify_service)):
    """Get a track by ID"""
    try:
        data = service.get_track(track_id)
        return Track.from_dict(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tracks", response_model=List[Track])
async def get_tracks(
    ids: str = Query(..., description="Comma-separated track IDs"),
    service: SpotifyService = Depends(get_spotify_service)
):
    """Get multiple tracks by IDs"""
    try:
        track_ids = ids.split(",")
        data = service.get_tracks(track_ids)
        return [Track.from_dict(track) for track in data['tracks']]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/tracks", response_model=List[Track])
async def search_tracks(
    q: str = Query(..., description="Search query"),
    limit: int = Query(20, ge=1, le=50),
    service: SpotifyService = Depends(get_spotify_service)
):
    """Search for tracks"""
    try:
        data = service.search_tracks(q, limit)
        return [Track.from_dict(track) for track in data['tracks']['items']]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Artist routes
@router.get("/artists/{artist_id}", response_model=Artist)
async def get_artist(artist_id: str, service: SpotifyService = Depends(get_spotify_service)):
    """Get an artist by ID"""
    try:
        data = service.get_artist(artist_id)
        return Artist.from_dict(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/artists/{artist_id}/albums", response_model=List[Album])
async def get_artist_albums(
    artist_id: str,
    limit: int = Query(20, ge=1, le=50),
    service: SpotifyService = Depends(get_spotify_service)
):
    """Get an artist's albums"""
    try:
        data = service.get_artist_albums(artist_id, limit)
        return [Album.from_dict(album) for album in data['items']]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/artists/{artist_id}/top-tracks", response_model=List[Track])
async def get_artist_top_tracks(
    artist_id: str,
    market: str = Query("US", description="Market code"),
    service: SpotifyService = Depends(get_spotify_service)
):
    """Get an artist's top tracks"""
    try:
        data = service.get_artist_top_tracks(artist_id, market)
        return [Track.from_dict(track) for track in data['tracks']]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Album routes
@router.get("/albums/{album_id}", response_model=Album)
async def get_album(album_id: str, service: SpotifyService = Depends(get_spotify_service)):
    """Get an album by ID"""
    try:
        data = service.get_album(album_id)
        return Album.from_dict(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/albums/{album_id}/tracks", response_model=List[Track])
async def get_album_tracks(
    album_id: str,
    limit: int = Query(50, ge=1, le=50),
    service: SpotifyService = Depends(get_spotify_service)
):
    """Get tracks from an album"""
    try:
        data = service.get_album_tracks(album_id, limit)
        return [Track.from_dict(track) for track in data['items']]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Playlist routes
@router.get("/playlists/{playlist_id}", response_model=Playlist)
async def get_playlist(playlist_id: str, service: SpotifyService = Depends(get_spotify_service)):
    """Get a playlist by ID"""
    try:
        data = service.get_playlist(playlist_id)
        return Playlist.from_dict(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


@router.post("/playlists", response_model=Playlist)
async def create_playlist(
    request: SpotifyBase.CreatePlaylistRequest,
    service: SpotifyService = Depends(get_spotify_service)
):
    """Create a new playlist for the current user"""
    try:
        user_data = service.get_current_user()
        data = service.create_playlist(
            user_data['id'], 
            request.name, 
            request.public, 
            request.description
        )
        return Playlist.from_dict(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/playlists/{playlist_id}/tracks")
async def add_tracks_to_playlist(
    playlist_id: str,
    request: SpotifyBase.AddTracksRequest,
    service: SpotifyService = Depends(get_spotify_service)
):
    """Add tracks to a playlist"""
    try:
        track_uris = [f"spotify:track:{track_id}" for track_id in request.track_ids]
        service.add_tracks_to_playlist(playlist_id, track_uris)
        return {"message": "Tracks added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Player routes
@router.get("/me/player/currently-playing", response_model=Optional[Track])
async def get_currently_playing(service: SpotifyService = Depends(get_spotify_service)):
    """Get the currently playing track"""
    try:
        data = service.get_currently_playing()
        if data and data.get('item'):
            return Track.from_dict(data['item'])
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me/player/recently-played", response_model=List[Track])
async def get_recently_played(
    limit: int = Query(20, ge=1, le=50),
    service: SpotifyService = Depends(get_spotify_service)
):
    """Get recently played tracks"""
    try:
        data = service.get_recently_played(limit)
        return [Track.from_dict(item['track']) for item in data['items']]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# backend/routes/SpotifyRoutes.py
# Add these routes to the existing router

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
    service: SpotifyService = Depends(get_spotify_service)
):
    """Start or resume playback"""
    try:
        service.start_playback(
            context_uri=request.context_uri,
            uris=request.uris,
            position_ms=request.position_ms,
            offset=request.offset
        )
        return {"message": "Playback started"}
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


@router.post("/me/player/previous")
async def skip_to_previous(service: SpotifyService = Depends(get_spotify_service)):
    """Skip to previous track"""
    try:
        service.skip_to_previous()
        return {"message": "Skipped to previous track"}
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