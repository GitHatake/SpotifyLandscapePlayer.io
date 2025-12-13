import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Callback from './routes/Callback';
import { redirectToAuthCodeFlow, logout } from './services/auth';
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer';
import NowPlaying from './components/NowPlaying';
import Controls from './components/Controls';
import QueueList from './components/QueueList';
import { ArrowRightEndOnRectangleIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

function Login() {
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
  const currentTrack = playerState?.item || null;
  const isPlaying = playerState?.is_playing || false;
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="absolute right-4 top-4 z-50 flex gap-2">
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
          <div className="flex h-full flex-col justify-center">
            <NowPlaying track={currentTrack} />
            <Controls isPlaying={isPlaying} onAction={refreshState} />
          </div>
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
