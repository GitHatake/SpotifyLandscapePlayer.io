/**
 * Application Configuration
 * 
 * Instructions for User:
 * 1. Go to https://developer.spotify.com/dashboard
 * 2. Create a new app called "Spotify Landscape Player"
 * 3. Copy the "Client ID" and paste it below.
 * 4. Add the Redirect URI to your Spotify App settings:
 *    - Local: http://localhost:5173/callback
 *    - Production: https://<your-github-username>.github.io/SpotifyLandscapePlayer.io/callback
 */

// Client ID provided by user
export const clientId = "80ee25c4f6e94a2b8d6c9971491fbaff";

// Redirect URI detection
export const redirectUri = import.meta.env.PROD
    ? `https://${window.location.hostname}/SpotifyLandscapePlayer.io/callback`
    : "http://localhost:5173/callback";

export const scopes = [
    "user-read-private",
    "user-read-email",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "streaming", // For Web Playback SDK
    "app-remote-control",
    "user-read-playback-position",
    "user-top-read",
    "user-read-recently-played",
    "playlist-read-private",
    "playlist-read-collaborative",
].join(" ");
