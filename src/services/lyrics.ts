export interface LrcLine {
    id: string; // unique key
    time: number; // in seconds
    text: string;
}

export interface LyricsData {
    plainLogs: string | null;
    syncedLyrics: LrcLine[] | null;
    isSynced: boolean;
}

export async function fetchLyrics(
    trackName: string,
    artistName: string,
    albumName: string,
    durationMs: number
): Promise<LyricsData> {
    const params = new URLSearchParams({
        track_name: trackName,
        artist_name: artistName,
        album_name: albumName,
        duration: (durationMs / 1000).toString(),
    });

    try {
        const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
        if (!response.ok) {
            throw new Error("No lyrics found");
        }

        const data = await response.json();

        let syncedLyrics: LrcLine[] | null = null;
        if (data.syncedLyrics) {
            syncedLyrics = parseLrc(data.syncedLyrics);
        }

        return {
            plainLogs: data.plainLyrics || null,
            syncedLyrics,
            isSynced: !!syncedLyrics
        };

    } catch (error) {
        // Fallback or silence
        return { plainLogs: null, syncedLyrics: null, isSynced: false };
    }
}

function parseLrc(lrc: string): LrcLine[] {
    const lines = lrc.split('\n');
    const regex = /^\[(\d{2}):(\d{2})\.(\d{2})\](.*)/;
    const result: LrcLine[] = [];

    lines.forEach((line, index) => {
        const match = line.match(regex);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const hundredths = parseInt(match[3], 10);

            const time = minutes * 60 + seconds + hundredths / 100;
            const text = match[4].trim();

            if (text) {
                result.push({
                    id: `${index}-${time}`,
                    time,
                    text
                });
            }
        }
    });

    return result;
}
