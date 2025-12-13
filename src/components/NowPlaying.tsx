import type { Track } from '../services/spotify';
import { motion } from 'framer-motion';

interface Props {
    track: Track | null;
}

export default function NowPlaying({ track }: Props) {
    if (!track) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                <p>No music playing</p>
                <p className="text-sm">Open Spotify on a device to start listening.</p>
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
                className="relative aspect-square w-full max-w-[50vh] overflow-hidden rounded-2xl shadow-2xl"
            >
                <img src={image} alt={track.name} className="h-full w-full object-cover" />
            </motion.div>

            <div className="mt-8 text-center">
                <h1 className="line-clamp-1 text-4xl font-bold text-white shadow-black drop-shadow-lg">{track.name}</h1>
                <p className="mt-2 text-xl text-gray-300">{track.artists.map(a => a.name).join(", ")}</p>
            </div>
        </div>
    );
}
