import { PlayIcon, PauseIcon, ForwardIcon, BackwardIcon } from '@heroicons/react/24/solid';
import { play, pause, next, previous } from '../services/spotify';

interface Props {
    isPlaying: boolean;
    onAction: () => void;
}

export default function Controls({ isPlaying, onAction }: Props) {
    const handleAction = async (action: () => Promise<void>) => {
        await action();
        setTimeout(onAction, 500); // Wait a bit for state to update
    }

    return (
        <div className="flex items-center justify-center gap-8 py-6">
            <button
                onClick={() => handleAction(previous)}
                className="rounded-full p-4 text-white transition hover:bg-white/10"
            >
                <BackwardIcon className="h-10 w-10" />
            </button>

            <button
                onClick={() => handleAction(isPlaying ? pause : play)}
                className="scale-100 transform rounded-full bg-green-500 p-6 text-black shadow-lg transition hover:scale-110 hover:bg-green-400 active:scale-95"
            >
                {isPlaying ? (
                    <PauseIcon className="h-12 w-12" />
                ) : (
                    <PlayIcon className="h-12 w-12" />
                )}
            </button>

            <button
                onClick={() => handleAction(next)}
                className="rounded-full p-4 text-white transition hover:bg-white/10"
            >
                <ForwardIcon className="h-10 w-10" />
            </button>
        </div>
    );
}
