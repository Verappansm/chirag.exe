"use client";
import { motion } from "framer-motion";
import { useMemo } from "react";

const COLORS = ["#7cf5c4", "#ffc857", "#8ab4ff", "#ff9ecb", "#ffffff"];

/** Lightweight confetti burst. Mount it to fire it. */
export default function Confetti({ count = 36 }: { count?: number }) {
  const bits = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 520,
      y: -120 - Math.random() * 260,
      r: Math.random() * 720 - 360,
      c: COLORS[i % COLORS.length],
      d: Math.random() * 0.15,
    })),
    [count],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex justify-center">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className="absolute h-2.5 w-1.5 rounded-sm"
          style={{ background: b.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 380], opacity: [1, 1, 0], rotate: b.r }}
          transition={{ duration: 1.6, delay: b.d, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
