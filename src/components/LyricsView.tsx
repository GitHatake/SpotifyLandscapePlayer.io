import { useEffect, useRef, useState } from 'react';
import type { LrcLine } from '../services/lyrics';
import { motion } from 'framer-motion';

interface Props {
    lyrics: LrcLine[] | null;
    plainLyrics: string | null;
    currentTime: number; // in seconds
}

export default function LyricsView({ lyrics, plainLyrics, currentTime }: Props) {
    const activeIndexRef = useRef<number>(-1);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(-1);

    // Find active index efficiently
    useEffect(() => {
        if (!lyrics) return;

        // Polyfill-like logic for findLastIndex
        let index = -1;
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (lyrics[i].time <= currentTime) {
                index = i;
                break;
            }
        }

        if (index !== -1 && index !== activeIndexRef.current) {
            activeIndexRef.current = index;
            setActiveIndex(index);

            // Scroll to center
            const element = document.getElementById(`lyric-${index}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [lyrics, currentTime]);

    if (!lyrics && !plainLyrics) {
        return (
            <div className="flex h-full w-full items-center justify-center text-gray-500">
                <p>No lyrics found</p>
            </div>
        );
    }

    if (!lyrics && plainLyrics) {
        return (
            <div className="h-full w-full overflow-y-auto whitespace-pre-wrap p-4 text-center text-lg text-gray-300">
                {plainLyrics}
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-y-auto px-4 py-32 text-center mask-image-linear-to-b" ref={scrollRef}>
            {lyrics!.map((line, i) => {
                const isActive = i === activeIndex;
                return (
                    <motion.div
                        id={`lyric-${i}`}
                        key={line.id}
                        initial={{ opacity: 0.5, scale: 1 }}
                        animate={{
                            opacity: isActive ? 1 : 0.4,
                            scale: isActive ? 1.05 : 1,
                            color: isActive ? "#ffffff" : "#a1a1aa",
                            filter: isActive ? "blur(0px)" : "blur(1.5px)"
                        }}
                        transition={{ duration: 0.3 }}
                        className={`my-6 text-2xl font-bold transition-all duration-300 md:text-3xl ${isActive ? 'origin-center' : ''}`}
                    >
                        {line.text}
                    </motion.div>
                );
            })}
        </div>
    );
}
