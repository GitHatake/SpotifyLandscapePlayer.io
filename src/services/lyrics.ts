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
    // 1. Try strict fetch first
    let lyrics = await tryGetLyrics(trackName, artistName, albumName, durationMs);
    if (lyrics.isSynced || lyrics.plainLogs) return lyrics;

    // 2. If strict failed, try search with cleaned names
    const cleanTrack = cleanName(trackName);
    const cleanArtist = cleanName(artistName);
    
    console.log(`Strict search failed for "${trackName}". Retrying with "${cleanTrack}"...`);
    lyrics = await trySearchLyrics(cleanTrack, cleanArtist, durationMs);
    
    return lyrics;
}

async function tryGetLyrics(
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
        if (!response.ok) return { plainLogs: null, syncedLyrics: null, isSynced: false };

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
    } catch {
        return { plainLogs: null, syncedLyrics: null, isSynced: false };
    }
}

async function trySearchLyrics(
    trackName: string,
    artistName: string,
    durationMs: number
): Promise<LyricsData> {
    const params = new URLSearchParams({
        track_name: trackName,
        artist_name: artistName,
    });

    try {
        const response = await fetch(`https://lrclib.net/api/search?${params.toString()}`);
        if (!response.ok) return { plainLogs: null, syncedLyrics: null, isSynced: false };

        const results = await response.json();
        if (!Array.isArray(results) || results.length === 0) {
            return { plainLogs: null, syncedLyrics: null, isSynced: false };
        }

        // Find the best match by duration (within 5 seconds)
        const durationSec = durationMs / 1000;
        const bestMatch = results.find(r => Math.abs(r.duration - durationSec) < 5) || results[0];

        let syncedLyrics: LrcLine[] | null = null;
        if (bestMatch.syncedLyrics) {
            syncedLyrics = parseLrc(bestMatch.syncedLyrics);
        }

        return {
            plainLogs: bestMatch.plainLyrics || null,
            syncedLyrics,
            isSynced: !!syncedLyrics
        };
    } catch {
        return { plainLogs: null, syncedLyrics: null, isSynced: false };
    }
}

/**
 * Removes common noise from track/artist names to improve search hits.
 * e.g. "Song Name - Remastered 2020" -> "Song Name"
 */
function cleanName(name: string): string {
    return name
        .replace(/\(feat\..*?\)/gi, '')
        .replace(/\(with.*?\)/gi, '')
        .replace(/\(Remastered.*?\)/gi, '')
        .replace(/- Remastered.*?$/gi, '')
        .replace(/- Single Version/gi, '')
        .replace(/- Radio Edit/gi, '')
        .replace(/- Live.*?$/gi, '')
        .replace(/\(Live.*?\)/gi, '')
        .replace(/\[.*?\]/g, '') // Remove [Explicit], [Remaster], etc.
        .trim();
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
