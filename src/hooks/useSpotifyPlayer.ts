import { useState, useEffect, useCallback } from 'react';
import { fetchPlayerState, fetchQueue, type PlayerState, type Track } from '../services/spotify';

export function useSpotifyPlayer() {
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);
    const [queue, setQueue] = useState<Track[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    const refreshState = useCallback(async () => {
        const [state, queueData] = await Promise.all([
            fetchPlayerState(),
            fetchQueue()
        ]);

        if (state) {
            setPlayerState(state);
            setIsConnected(true);
        }

        if (queueData) {
            setQueue(queueData.queue || []);
        }
    }, []);

    useEffect(() => {
        refreshState();
        const interval = setInterval(refreshState, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, [refreshState]);

    return { playerState, queue, isConnected, refreshState };
}
