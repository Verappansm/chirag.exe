"use client";
// Image / GIF / video with a graceful fallback so broken external media never breaks the layout.
import { useEffect, useState } from "react";

const isVideo = (u: string) => /\.(mp4|webm|mov)(\?|$)/i.test(u);

export default function Media({
  url, query, source, alt = "", className = "", controls = false,
}: { url?: string; query?: string; source?: string; alt?: string; className?: string; controls?: boolean }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [url]);

  if (!url || bad) {
    const search = query ? `https://giphy.com/search/${encodeURIComponent(query)}` : "";
    return (
      <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-panel2 p-6 text-center ${className}`}>
        <span className="text-4xl" aria-hidden>🎞️</span>
        <p className="label">{bad ? "Meme failed to load" : "Meme slot"}</p>
        {query && <p className="font-mono text-sm text-mint">“{query}”</p>}
        {search && (
          <a href={search} target="_blank" rel="noreferrer" className="text-xs text-muted underline hover:text-text">
            find one on GIPHY
          </a>
        )}
        {source && bad && (
          <a href={source} target="_blank" rel="noreferrer" className="text-xs text-muted underline hover:text-text">source</a>
        )}
      </div>
    );
  }
  return isVideo(url) ? (
    <video src={url} className={`rounded-xl object-contain ${className}`} autoPlay loop muted playsInline controls={controls} onError={() => setBad(true)} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} referrerPolicy="no-referrer" loading="lazy" className={`rounded-xl object-contain ${className}`} onError={() => setBad(true)} />
  );
}
