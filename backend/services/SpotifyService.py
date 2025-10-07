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


