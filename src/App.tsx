import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Callback from './routes/Callback';
import { redirectToAuthCodeFlow, logout } from './services/auth';
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer';
import NowPlaying from './components/NowPlaying';
import Controls from './components/Controls';
import QueueList from './components/QueueList';
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline'; // Updated import

function Login() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-900 text-white">
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

  // Dynamic background gradient based on album art could be added here
  // For now, simple dark gradient

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      <button
        onClick={logout}
        className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white/50 hover:bg-black hover:text-white"
        title="Logout"
      >
        <ArrowRightEndOnRectangleIcon className="h-6 w-6" />
      </button>

      {/* Main Grid Layout - Landscape optimized */}
      <div className="grid h-full w-full grid-cols-1 md:grid-cols-2">

        {/* Left: Now Playing (Large Art) */}
        <div className="flex flex-col justify-center p-4">
          <NowPlaying track={currentTrack} />
          <Controls isPlaying={isPlaying} onAction={refreshState} />
        </div>

        {/* Right: Queue / Details */}
        <div className="hidden h-full flex-col justify-center p-8 md:flex">
          <h1 className="mb-6 text-3xl font-bold tracking-tight">Up Next</h1>
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
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
