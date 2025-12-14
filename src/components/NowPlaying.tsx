import type { Track } from '../services/spotify';
import { motion } from 'framer-motion';

interface Props {
    track: Track | null;
    onToggleFullscreen?: () => void;
}

export default function NowPlaying({ track, onToggleFullscreen }: Props) {
    if (!track) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center text-center text-gray-400">
                <div className="mb-4 h-48 w-48 animate-pulse rounded-2xl bg-white/5"></div>
                <p className="text-xl font-semibold text-white">No Active Device</p>
                <p className="mt-2 text-sm text-gray-400">Open Spotify on one of your devices<br />and start playing music.</p>
            </div>
        );
    }

    const image = track.album.images[0]?.url;

    return (
        <div className="relative flex h-full w-full flex-col items-center justify-center p-8">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={track.id}
                className="relative aspect-square w-full max-w-[50vh] cursor-pointer overflow-hidden rounded-2xl shadow-2xl transition hover:scale-105 active:scale-95"
                onClick={onToggleFullscreen}
                whileTap={{ scale: 0.95 }}
            >
                <img src={image} alt={track.name} className="h-full w-full object-cover" />

                {/* Overlay hint */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/20">
                    <span className="opacity-0 transition group-hover:opacity-100"></span>
                </div>
            </motion.div>

            <div className="mt-8 text-center">
                <h1 className="line-clamp-1 text-4xl font-bold text-white shadow-black drop-shadow-lg">{track.name}</h1>
                <p className="mt-2 text-xl text-gray-300">{track.artists.map(a => a.name).join(", ")}</p>
            </div>
        </div>
    );
}
