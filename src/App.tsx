import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Callback from './routes/Callback';
import { redirectToAuthCodeFlow, logout, hasValidCredentials } from './services/auth';
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer';
import { useNotifications } from './hooks/useNotifications';
import { next, previous } from './services/spotify';
import NowPlaying from './components/NowPlaying';
import Controls from './components/Controls';
import QueueList from './components/QueueList';
import { ArrowRightEndOnRectangleIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, type PanInfo } from 'framer-motion';

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have any valid credentials (token or refresh token)
    if (hasValidCredentials()) {
      navigate('/player');
    }
  }, [navigate]);

  return (
    <div className="flex h-[100dvh] w-screen flex-col items-center justify-center bg-zinc-900 text-white">
      <h1 className="mb-8 text-4xl font-bold tracking-tighter text-green-500">Spotify Landscape</h1>
      <button
        onClick={redirectToAuthCodeFlow}
        className="rounded-full bg-green-500 px-8 py-3 text-lg font-semibold text-black transition hover:scale-105 hover:bg-green-400"
      >
        Login with Spotify
      </button>
    </div>
  );
}

import { fetchLyrics, type LyricsData } from './services/lyrics';
import LyricsView from './components/LyricsView';

function Player() {
  const { playerState, queue, refreshState } = useSpotifyPlayer();
  const { isEnabled: isNotifEnabled, toggleNotifications, sendNotification } = useNotifications();

  const currentTrack = playerState?.item || null;
  const isPlaying = playerState?.is_playing || false;
  const progressMs = playerState?.progress_ms || 0;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'lyrics'>('queue');
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);

  const updateLyrics = useCallback(async (track: any) => {
    if (!track) return;
    const albumName = (track.album as any).name || "";
    const data = await fetchLyrics(track.name, track.artists[0].name, albumName, track.duration_ms);
    setLyricsData(data);
  }, []);

  // Lock orientation to landscape on mount
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        // This API requires fullscreen on most browsers
        if (screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as any).lock('landscape');
        }
      } catch (err) {
        console.log('Orientation lock not supported or denied:', err);
      }
    };
    lockOrientation();
  }, []);

  const lastTrackId = useRef<string | null>(null);

  useEffect(() => {
    if (currentTrack && currentTrack.id !== lastTrackId.current) {
      lastTrackId.current = currentTrack.id;

      // Notify
      if (isPlaying) {
        sendNotification(currentTrack);
      }

      // Fetch Lyrics
      updateLyrics(currentTrack);
    }
  }, [currentTrack, isPlaying, sendNotification, updateLyrics]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  /* Wake Lock Logic */
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isFullscreen) {
        try {
          const lock = await navigator.wakeLock.request('screen');
          wakeLock.current = lock;
          console.log('Wake Lock active');

          lock.addEventListener('release', () => {
            console.log('Wake Lock released');
            wakeLock.current = null;
          });
        } catch (err) {
          console.error("Wake Lock failed:", err);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock.current) {
        await wakeLock.current.release();
        wakeLock.current = null;
      }
    };

    if (isFullscreen) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Capture functionality for re-acquiring lock on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isFullscreen) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isFullscreen]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      // Swipe Left -> Next
      await next();
      refreshState();
    } else if (info.offset.x > threshold) {
      // Swipe Right -> Previous
      await previous();
      refreshState();
    }
  };

  // Force scroll reset when fullscreen state changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [isFullscreen]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="absolute right-4 top-4 z-50 flex gap-2">
        <button
          onClick={toggleNotifications}
          className="rounded-full bg-black/50 p-2 text-white/50 hover:bg-black hover:text-white"
          title={isNotifEnabled ? "Disable Notifications" : "Enable Notifications"}
        >
          {isNotifEnabled ? <BellIcon className="h-6 w-6" /> : <BellSlashIcon className="h-6 w-6" />}
        </button>
        <button
          onClick={toggleFullscreen}
          className="rounded-full bg-black/50 p-2 text-white/50 hover:bg-black hover:text-white"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <ArrowsPointingInIcon className="h-6 w-6" /> : <ArrowsPointingOutIcon className="h-6 w-6" />}
        </button>
        <button
          onClick={logout}
          className="rounded-full bg-black/50 p-2 text-white/50 hover:bg-black hover:text-white"
          title="Logout"
        >
          <ArrowRightEndOnRectangleIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Force Landscape Layout:
          On landscape orientation (regardless of width), use 2 columns.
          On portrait, stack them.
      */}
      <div className="flex h-full w-full flex-col landscape:flex-row">

        {/* Left (or Top): Now Playing & Controls */}
        <div className="flex flex-1 flex-col items-center justify-center overflow-hidden p-4 landscape:w-1/2 landscape:border-r landscape:border-white/5 landscape:p-2">
          <motion.div
            className="flex h-full flex-col items-center justify-center"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            <NowPlaying track={currentTrack} onToggleFullscreen={toggleFullscreen} />
            <Controls isPlaying={isPlaying} onAction={refreshState} />
            <p className="mt-2 text-center text-[10px] text-white/30 md:mt-4 md:text-xs">Swipe to skip • Tap art to fullscreen</p>
          </motion.div>
        </div>

        {/* Right Side: Tabbed Content */}
        <div className="hidden h-full flex-1 flex-col p-4 landscape:flex landscape:w-1/2 md:p-8">

          {/* Tabs */}
          <div className="mb-6 flex space-x-6">
            <button
              onClick={() => setActiveTab('queue')}
              className={`text-2xl font-bold tracking-tight transition-colors ${activeTab === 'queue' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              Up Next
            </button>
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`text-2xl font-bold tracking-tight transition-colors ${activeTab === 'lyrics' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              Lyrics
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            {activeTab === 'queue' ? (
              <QueueList queue={queue} />
            ) : (
              <LyricsView
                lyrics={lyricsData?.syncedLyrics || null}
                plainLyrics={lyricsData?.plainLogs || null}
                currentTime={progressMs / 1000}
                onRetry={() => currentTrack && updateLyrics(currentTrack)}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename="/SpotifyLandscapePlayer.io/">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/player" element={<Player />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
