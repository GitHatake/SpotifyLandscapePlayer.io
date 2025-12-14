import { useState, useCallback, useEffect } from 'react';
import type { Track } from '../services/spotify';

export function useNotifications() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);

    useEffect(() => {
        // Load saved preference
        const saved = localStorage.getItem('spotify_landscape_notifications');
        if (saved === 'true' && Notification.permission === 'granted') {
            setIsEnabled(true);
        }
    }, []);

    const toggleNotifications = useCallback(async () => {
        if (isEnabled) {
            setIsEnabled(false);
            localStorage.setItem('spotify_landscape_notifications', 'false');
            return;
        }

        if (permission === 'granted') {
            setIsEnabled(true);
            localStorage.setItem('spotify_landscape_notifications', 'true');
        } else if (permission !== 'denied') {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted') {
                setIsEnabled(true);
                localStorage.setItem('spotify_landscape_notifications', 'true');
            }
        } else {
            // Permission denied, maybe show alert?
            alert("Notifications are disabled in browser settings.");
        }
    }, [isEnabled, permission]);

    const sendNotification = useCallback((track: Track) => {
        if (!isEnabled || document.visibilityState === 'visible') return;

        const artistNames = track.artists.map(a => a.name).join(", ");
        const title = track.name;

        // Check if service worker is ready (for PWA)
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body: artistNames,
                    icon: track.album.images[0]?.url || '/pwa-192x192.png',
                    tag: 'spotify-landscape-now-playing' // Overwrite existing
                });
            });
        } else {
            // Fallback for non-PWA or dev
            new Notification(title, {
                body: artistNames,
                icon: track.album.images[0]?.url || '/pwa-192x192.png',
                tag: 'spotify-landscape-now-playing'
            });
        }
    }, [isEnabled]);

    return { isEnabled, toggleNotifications, sendNotification };
}
