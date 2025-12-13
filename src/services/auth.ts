import { clientId, redirectUri, scopes } from '../config';
import { generateRandomString, sha256, base64encode } from '../utils/pkce';

const TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
// const EXPIRATION_KEY = 'spotify_token_expiration';
const VERIFIER_KEY = 'spotify_code_verifier';

export async function redirectToAuthCodeFlow() {
    const verifier = generateRandomString(128);
    const challenge = await sha256(verifier);
    const challengeCode = base64encode(challenge);

    localStorage.setItem(VERIFIER_KEY, verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", redirectUri);
    params.append("scope", scopes);
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challengeCode);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function getAccessToken(code: string): Promise<string | null> {
    const verifier = localStorage.getItem(VERIFIER_KEY);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);
    params.append("code_verifier", verifier!);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token, refresh_token, expires_in } = await result.json();

    if (access_token) {
        localStorage.setItem(TOKEN_KEY, access_token);
        if (refresh_token) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
        }
        // TODO: Handle expiration properly if needed
        console.log(`Token expires in ${expires_in} seconds`);
        return access_token;
    }

    return null;
}

export async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token, refresh_token: new_refresh_token } = await result.json();

    if (access_token) {
        localStorage.setItem(TOKEN_KEY, access_token);
        if (new_refresh_token) {
            localStorage.setItem(REFRESH_TOKEN_KEY, new_refresh_token);
        }
        return access_token;
    }

    return null;
}

export function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(VERIFIER_KEY);
    window.location.href = redirectUri;
}
