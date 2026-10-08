"use client";
import { motion } from "framer-motion";

/**
 * Parody of an Indian film-censor certificate card. It deliberately uses its own made-up
 * board name and no government emblem, and says it is a parody.
 */
export default function Certificate() {
  const rows: [string, string][] = [
    ["Title", "CHIRAG TANK"],
    ["Subtitle", "THE TRAINING TIMELINE"],
    ["Category", "U/A (Unofficially Approved)"],
    ["Genres", "Comedy · Drama · Several Incidents"],
    ["Duration", "3 months (approx. 1 Loss Function)"],
    ["Language", "English · Hindi · Chaos"],
    ["Cast", "23 Trainees + 1 Instructor"],
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-sm border-[3px] border-[#1b1b1b] bg-[#f3eddc] p-5 text-left text-[#1b1b1b] shadow-[0_20px_60px_-15px_rgba(0,0,0,.8)]"
      role="img"
      aria-label="Parody film certificate: Chirag Tank, The Training Timeline, rated U/A"
    >
      <div className="rounded-sm border border-[#1b1b1b] p-4">
        <p className="text-center font-serif text-[11px] font-bold uppercase tracking-[0.25em]">
          Central Board of Trainee Certification
        </p>
        <p className="mt-0.5 text-center font-serif text-[10px] italic">(a parody — not an official certificate)</p>
        <div className="my-3 border-t-2 border-double border-[#1b1b1b]" />
        <p className="text-center font-serif text-lg font-black uppercase tracking-[0.3em]">Certificate</p>
        <p className="mt-1 text-center font-mono text-[10px]">Certificate No. 23/3/1 · Validity: until the next game</p>

        <dl className="mt-4 space-y-1.5 font-serif text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="w-24 shrink-0 font-bold">{k}</dt>
              <dd className="flex-1">: {v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#1b1b1b] pt-3">
          <p className="max-w-[12rem] font-serif text-[10px] leading-snug">
            Certified for public viewing, with parental guidance (of Chirag) advised for viewers under 23.
          </p>
          <motion.div
            initial={{ scale: 2.4, opacity: 0, rotate: -18 }}
            animate={{ scale: 1, opacity: 1, rotate: -8 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 260, damping: 14 }}
            className="flex h-20 w-24 shrink-0 items-center justify-center rounded-md border-[5px] border-[#b3261e] text-4xl font-black tracking-tighter text-[#b3261e]"
            style={{ boxShadow: "inset 0 0 0 2px #f3eddc, inset 0 0 0 3px #b3261e" }}
          >
            U/A
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
