"use client";
import { useState } from "react";

/** Chirag's avatar. Drop the real image at public/images/chirag.png; falls back to a monogram. */
export default function Avatar({ size = 40, src = "/images/chirag.png", label = "CT" }: { size?: number; src?: string; label?: string }) {
  const [bad, setBad] = useState(false);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-mint/50 bg-panel2 font-mono font-bold text-mint"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {bad ? (
        label
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={size} height={size} className="h-full w-full object-cover" onError={() => setBad(true)} />
      )}
    </span>
  );
}
