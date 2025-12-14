import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Callback from './routes/Callback';
import { redirectToAuthCodeFlow, logout, getStoredToken } from './services/auth';
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer';
import { useNotifications } from './hooks/useNotifications';
import { next, previous } from './services/spotify';
import NowPlaying from './components/NowPlaying';
import Controls from './components/Controls';
import QueueList from './components/QueueList';
import { ArrowRightEndOnRectangleIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';
import { motion, type PanInfo } from 'framer-motion';

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
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

function Player() {
  const { playerState, queue, refreshState } = useSpotifyPlayer();
  const { isEnabled: isNotifEnabled, toggleNotifications, sendNotification } = useNotifications();

  const currentTrack = playerState?.item || null;
  const isPlaying = playerState?.is_playing || false;
  const [isFullscreen, setIsFullscreen] = useState(false);

  const lastTrackId = useRef<string | null>(null);

  useEffect(() => {
    if (currentTrack && currentTrack.id !== lastTrackId.current) {
      lastTrackId.current = currentTrack.id;
      // Only notify if playing
      if (isPlaying) {
        sendNotification(currentTrack);
      }
    }
  }, [currentTrack, isPlaying, sendNotification]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

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

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
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
        <div className="flex flex-1 flex-col justify-center p-4 landscape:w-1/2 landscape:border-r landscape:border-white/5">
          <motion.div
            className="flex h-full flex-col justify-center"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            <NowPlaying track={currentTrack} onToggleFullscreen={toggleFullscreen} />
            <Controls isPlaying={isPlaying} onAction={refreshState} />
            <p className="mt-4 text-center text-xs text-white/30">Swipe to skip • Tap art to fullscreen</p>
          </motion.div>
        </div>

        {/* Right (or Bottom): Queue */}
        {/* In portrait, hide queue if screen is too small, or allow scroll.
            In landscape, show it on the right. */}
        <div className="hidden h-full flex-1 flex-col justify-center p-8 landscape:flex landscape:w-1/2">
          <h1 className="mb-6 text-2xl font-bold tracking-tight text-white/80">Up Next</h1>
          <QueueList queue={queue} />
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
