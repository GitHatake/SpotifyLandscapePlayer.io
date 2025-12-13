import type { Track } from '../services/spotify';

interface Props {
    queue: Track[];
}

export default function QueueList({ queue }: Props) {
    const nextTracks = queue.slice(0, 5); // Show next 5 tracks

    return (
        <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-gray-400">Up Next</h2>
            <div className="flex flex-col gap-4 overflow-y-auto">
                {nextTracks.map((track, i) => (
                    <div key={`${track.id}-${i}`} className="flex items-center gap-4 rounded-lg p-2 transition hover:bg-white/5">
                        <img
                            src={track.album.images[2]?.url || track.album.images[0]?.url}
                            alt={track.name}
                            className="h-12 w-12 rounded bg-gray-800 object-cover"
                        />
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate font-medium text-white">{track.name}</p>
                            <p className="truncate text-sm text-gray-400">{track.artists.map(a => a.name).join(", ")}</p>
                        </div>
                    </div>
                ))}
            </div>
            {queue.length === 0 && (
                <p className="text-gray-500">Queue is empty</p>
            )}
        </div>
    );
}
