import { getValidToken, refreshAccessToken, logout } from './auth';

const BASE_URL = 'https://api.spotify.com/v1';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    // Use getValidToken which handles proactive refresh
    let token = await getValidToken();
    if (!token) {
        throw new Error("No valid token");
    }

    let response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });

    // If still 401, try one more refresh
    if (response.status === 401) {
        token = await refreshAccessToken();
        if (!token) {
            logout();
            throw new Error("Session expired");
        }
        // Retry
        response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        });
    }

    if (response.status === 204) return null;
    return response.json();
}

export type Track = {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
        name: string;
        images: { url: string }[];
    };
    duration_ms: number;
};

export type PlayerState = {
    is_playing: boolean;
    progress_ms: number;
    item: Track | null;
};

export async function fetchPlayerState(): Promise<PlayerState | null> {
    try {
        const data = await fetchWithAuth('/me/player');
        return data;
    } catch (e) {
        console.error("Failed to fetch player state", e);
        return null;
    }
}

export async function fetchQueue(): Promise<{ queue: Track[] } | null> {
    try {
        const data = await fetchWithAuth('/me/player/queue');
        return data;
    } catch (e) {
        console.error("Failed to fetch queue", e);
        return null;
    }
}

export async function play() {
    await fetchWithAuth('/me/player/play', { method: 'PUT' });
}

export async function pause() {
    await fetchWithAuth('/me/player/pause', { method: 'PUT' });
}

export async function next() {
    await fetchWithAuth('/me/player/next', { method: 'POST' });
}

export async function previous() {
    await fetchWithAuth('/me/player/previous', { method: 'POST' });
}
