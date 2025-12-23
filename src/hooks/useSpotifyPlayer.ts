import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPlayerState, fetchQueue, type PlayerState, type Track } from '../services/spotify';
import { getStoredToken } from '../services/auth';

export function useSpotifyPlayer() {
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);
    const [queue, setQueue] = useState<Track[]>([]);

    // For smooth progress locally
    const [localProgress, setLocalProgress] = useState(0);
    const lastFetchTime = useRef(0);
    const progressInterval = useRef<number | null>(null);

    const fetchState = useCallback(async () => {
        const token = getStoredToken();
        if (!token) return;

        // Fetch everything in parallel
        const [player, q] = await Promise.all([
            fetchPlayerState(),
            fetchQueue()
        ]);

        if (player) {
            setPlayerState(player);
            // Sync local progress
            if (player.is_playing) {
                setLocalProgress(player.progress_ms);
                lastFetchTime.current = Date.now();
            } else {
                setLocalProgress(player.progress_ms);
            }
        }

        if (q) setQueue(q.queue);
    }, []);

    // Local Timer for smooth lyrics
    useEffect(() => {
        if (progressInterval.current) clearInterval(progressInterval.current);

        if (playerState?.is_playing) {
            progressInterval.current = window.setInterval(() => {
                const now = Date.now();
                const delta = now - lastFetchTime.current;
                setLocalProgress((playerState.progress_ms || 0) + delta);
            }, 100);
        }

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [playerState]);

    useEffect(() => {
        fetchState();
        const interval = setInterval(fetchState, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [fetchState]);

    return { playerState: playerState ? { ...playerState, progress_ms: localProgress } : null, queue, refreshState: fetchState };
}
