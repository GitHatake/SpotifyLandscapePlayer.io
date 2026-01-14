import { clientId, redirectUri, scopes } from '../config';
import { generateRandomString, sha256, base64encode } from '../utils/pkce';

const TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const EXPIRATION_KEY = 'spotify_token_expiration';
const VERIFIER_KEY = 'spotify_code_verifier';

// Buffer time before expiration to refresh proactively (5 minutes)
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

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
    if (!verifier) {
        console.error("No PKCE verifier found");
        return null;
    }

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);
    params.append("code_verifier", verifier);

    try {
        const result = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        });

        if (!result.ok) {
            console.error("Token exchange failed:", result.status);
            return null;
        }

        const { access_token, refresh_token, expires_in } = await result.json();

        if (access_token) {
            saveTokens(access_token, refresh_token, expires_in);
            return access_token;
        }
    } catch (err) {
        console.error("Token exchange error:", err);
    }

    return null;
}

function saveTokens(accessToken: string, refreshToken: string | undefined, expiresIn: number) {
    localStorage.setItem(TOKEN_KEY, accessToken);

    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    // Store expiration timestamp
    const expirationTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(EXPIRATION_KEY, expirationTime.toString());

    console.log(`Token saved. Expires at ${new Date(expirationTime).toLocaleString()}`);
}

export async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
        console.log("No refresh token available");
        return null;
    }

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    try {
        const result = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        });

        if (!result.ok) {
            console.error("Token refresh failed:", result.status);
            // Don't immediately logout - the token might still work
            return null;
        }

        const { access_token, refresh_token: new_refresh_token, expires_in } = await result.json();

        if (access_token) {
            saveTokens(access_token, new_refresh_token, expires_in);
            return access_token;
        }
    } catch (err) {
        console.error("Token refresh error:", err);
    }

    return null;
}

/**
 * Gets stored token, refreshing if necessary.
 * Returns null only if truly unable to authenticate.
 */
export async function getValidToken(): Promise<string | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    const expirationStr = localStorage.getItem(EXPIRATION_KEY);

    if (!token) {
        // No token at all - need to login
        return null;
    }

    if (expirationStr) {
        const expiration = parseInt(expirationStr, 10);
        const now = Date.now();

        // If token will expire soon, refresh proactively
        if (now >= expiration - REFRESH_BUFFER_MS) {
            console.log("Token expiring soon, refreshing...");
            const newToken = await refreshAccessToken();
            if (newToken) {
                return newToken;
            }
            // If refresh failed but token not yet expired, still return old token
            if (now < expiration) {
                return token;
            }
            // Token truly expired and refresh failed
            return null;
        }
    }

    return token;
}

/**
 * Synchronous check - for initial render decisions.
 * Does NOT refresh automatically.
 */
export function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Check if we have valid credentials stored (token exists and not expired).
 */
export function hasValidCredentials(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    // If we have a refresh token, we can likely recover
    return !!(token || refreshToken);
}

export function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRATION_KEY);
    localStorage.removeItem(VERIFIER_KEY);
    window.location.href = '/';
}

