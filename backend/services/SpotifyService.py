import requests
from typing import List, Optional, Dict, Any


class SpotifyService:
    """Handles all HTTP requests to Spotify API endpoints"""
    
    BASE_URL = "https://api.spotify.com/v1"
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    
    def _get(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make GET request to Spotify API"""
        url = f"{self.BASE_URL}/{endpoint}"
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()
    
    def _post(self, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make POST request to Spotify API"""
        url = f"{self.BASE_URL}/{endpoint}"
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()
    
    def _put(self, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """Make PUT request to Spotify API"""
        url = f"{self.BASE_URL}/{endpoint}"
        response = requests.put(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json() if response.text else None
    
    def _delete(self, endpoint: str, data: Optional[Dict] = None) -> None:
        """Make DELETE request to Spotify API"""
        url = f"{self.BASE_URL}/{endpoint}"
        response = requests.delete(url, headers=self.headers, json=data)
        response.raise_for_status()
    
    # User endpoints
    def get_current_user(self) -> Dict[str, Any]:
        return self._get("me")
    
    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        return self._get(f"users/{user_id}")
    
    # Track endpoints
    def get_track(self, track_id: str) -> Dict[str, Any]:
        return self._get(f"tracks/{track_id}")
    
    def get_tracks(self, track_ids: List[str]) -> Dict[str, Any]:
        return self._get("tracks", params={"ids": ",".join(track_ids)})
    
    def search_tracks(self, query: str, limit: int = 20) -> Dict[str, Any]:
        return self._get("search", params={"q": query, "type": "track", "limit": limit})
    
    # Artist endpoints
    def get_artist(self, artist_id: str) -> Dict[str, Any]:
        return self._get(f"artists/{artist_id}")
    
    def get_artist_albums(self, artist_id: str, limit: int = 20) -> Dict[str, Any]:
        return self._get(f"artists/{artist_id}/albums", params={"limit": limit})
    
    def get_artist_top_tracks(self, artist_id: str, market: str = "US") -> Dict[str, Any]:
        return self._get(f"artists/{artist_id}/top-tracks", params={"market": market})
    
    # Album endpoints
    def get_album(self, album_id: str) -> Dict[str, Any]:
        return self._get(f"albums/{album_id}")
    
    def get_album_tracks(self, album_id: str, limit: int = 50) -> Dict[str, Any]:
        return self._get(f"albums/{album_id}/tracks", params={"limit": limit})
    
    # Playlist endpoints
    def get_playlist(self, playlist_id: str) -> Dict[str, Any]:
        return self._get(f"playlists/{playlist_id}")
    
    def get_playlist_tracks(self, playlist_id: str, limit: int = 100) -> Dict[str, Any]:
        return self._get(f"playlists/{playlist_id}/tracks", params={"limit": limit})
    
    def get_user_playlists(self, limit: int = 50) -> Dict[str, Any]:
        return self._get("me/playlists", params={"limit": limit})
    
    def create_playlist(self, user_id: str, name: str, public: bool = True, 
                       description: str = "") -> Dict[str, Any]:
        data = {"name": name, "public": public, "description": description}
        return self._post(f"users/{user_id}/playlists", data=data)
    
    def add_tracks_to_playlist(self, playlist_id: str, track_uris: List[str]) -> Dict[str, Any]:
        return self._post(f"playlists/{playlist_id}/tracks", data={"uris": track_uris})
    
    # Player endpoints
    def get_currently_playing(self) -> Dict[str, Any]:
        return self._get("me/player/currently-playing")
    
    def get_recently_played(self, limit: int = 20) -> Dict[str, Any]:
        return self._get("me/player/recently-played", params={"limit": limit})

    def pause_playback(self) -> None:
        """Pause playback on the user's active device"""
        self._put("me/player/pause")

    def start_playback(self, context_uri: str = None, uris: List[str] = None, 
                    position_ms: int = 0, offset: Dict[str, Any] = None) -> None:
        """Start or resume playback
        
        Args:
            context_uri: Spotify URI of context (album, artist, playlist)
            uris: List of Spotify track URIs to play
            position_ms: Position in milliseconds to start playback
            offset: Indicates from where in context playback should start
        """
        data = {}
        if context_uri:
            data["context_uri"] = context_uri
        if uris:
            data["uris"] = uris
        if position_ms:
            data["position_ms"] = position_ms
        if offset:
            data["offset"] = offset
        
        self._put("me/player/play", data=data)

    def skip_to_next(self) -> None:
        """Skip to next track in user's queue"""
        self._post("me/player/next")

    def skip_to_previous(self) -> None:
        """Skip to previous track in user's queue"""
        self._post("me/player/previous")

    def get_playback_state(self) -> Dict[str, Any]:
        """Get information about user's current playback"""
        return self._get("me/player")

    def get_playlist_tracks_paginated(self, playlist_id: str, offset: int = 0, 
                                    limit: int = 100) -> Dict[str, Any]:
        """Get playlist tracks with pagination support"""
        return self._get(f"playlists/{playlist_id}/tracks", 
                        params={"limit": limit, "offset": offset})

    # backend/services/SpotifyService.py
    # Add these methods to the existing SpotifyService class

    def pause_playback(self) -> None:
        """Pause playback on the user's active device"""
        self._put("me/player/pause")

    def start_playback(self, context_uri: str = None, uris: List[str] = None, 
                    position_ms: int = 0, offset: Dict[str, Any] = None) -> None:
        """Start or resume playback
        
        Args:
            context_uri: Spotify URI of context (album, artist, playlist)
            uris: List of Spotify track URIs to play
            position_ms: Position in milliseconds to start playback
            offset: Indicates from where in context playback should start
        """
        data = {}
        if context_uri:
            data["context_uri"] = context_uri
        if uris:
            data["uris"] = uris
        if position_ms:
            data["position_ms"] = position_ms
        if offset:
            data["offset"] = offset
        
        self._put("me/player/play", data=data)

    def set_shuffle(self, state: bool) -> None:
        """Toggle shuffle on or off for user's playback
        
        Args:
            state: True to turn on shuffle, False to turn off
        """
        self._put("me/player/shuffle", params={"state": str(state).lower()})

    def skip_to_next(self) -> None:
        """Skip to next track in user's queue"""
        self._post("me/player/next")

    def skip_to_previous(self) -> None:
        """Skip to previous track in user's queue"""
        self._post("me/player/previous")

    def get_playback_state(self) -> Dict[str, Any]:
        """Get information about user's current playback"""
        return self._get("me/player")

    def get_playlist_tracks_paginated(self, playlist_id: str, offset: int = 0, 
                                    limit: int = 100) -> Dict[str, Any]:
        """Get playlist tracks with pagination support"""
        return self._get(f"playlists/{playlist_id}/tracks", 
                        params={"limit": limit, "offset": offset})