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
                <div className="mb-4 aspect-square w-32 animate-pulse rounded-2xl bg-white/5 md:w-48"></div>
                <p className="text-lg font-semibold text-white md:text-xl">No Active Device</p>
                <p className="mt-2 text-xs text-gray-400 md:text-sm">Open Spotify on one of your devices<br />and start playing music.</p>
            </div>
        );
    }

    const image = track.album.images[0]?.url;

    return (
        <div className="relative flex h-full w-full flex-col items-center justify-center p-4 landscape:p-2">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={track.id}
                // Use a smaller relative size for landscape mobile
                className="relative aspect-square w-full max-w-[40vh] cursor-pointer overflow-hidden rounded-2xl shadow-2xl transition hover:scale-105 active:scale-95 landscape:max-w-[45vh]"
                onClick={onToggleFullscreen}
                whileTap={{ scale: 0.95 }}
            >
                <img src={image} alt={track.name} className="h-full w-full object-cover" />

                {/* Overlay hint */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/20">
                    <span className="opacity-0 transition group-hover:opacity-100"></span>
                </div>
            </motion.div>

            <div className="mt-4 text-center landscape:mt-3">
                <h1 className="line-clamp-1 text-2xl font-bold text-white shadow-black drop-shadow-lg md:text-4xl">{track.name}</h1>
                <p className="mt-1 text-lg text-gray-300 md:mt-2 md:text-xl">{track.artists.map(a => a.name).join(", ")}</p>
            </div>
        </div>
    );
}
