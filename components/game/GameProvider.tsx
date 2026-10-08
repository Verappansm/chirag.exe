"use client";
// Global player state (XP, awards, completed levels). Saved in this browser's localStorage.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { play } from "@/lib/sfx";

export type LevelId = "trainee" | "says" | "timeline";
interface State { xp: number; awards: string[]; done: LevelId[]; cheat: boolean }
interface Ctx extends State {
  addXp: (n: number) => void;
  unlock: (title: string, description?: string) => void;
  complete: (l: LevelId) => void;
  enableCheat: () => void;
  reset: () => void;
}

const KEY = "cg:state:v1";
const empty: State = { xp: 0, awards: [], done: [], cheat: false };
const GameCtx = createContext<Ctx | null>(null);
export const useGame = () => {
  const c = useContext(GameCtx);
  if (!c) throw new Error("useGame outside provider");
  return c;
};
export const levelFromXp = (xp: number) => Math.floor(xp / 300) + 1;

export default function GameProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(empty);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ title: string; description?: string; k: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...empty, ...JSON.parse(raw) });
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  }, [s, ready]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const addXp = useCallback((n: number) => setS((p) => ({ ...p, xp: p.xp + n })), []);
  const unlock = useCallback((title: string, description?: string) => {
    if (!title) return;
    play("award");
    setS((p) => (p.awards.includes(title) ? p : { ...p, awards: [...p.awards, title] }));
    setToast({ title, description, k: Date.now() });
  }, []);
  const complete = useCallback(
    (l: LevelId) => setS((p) => (p.done.includes(l) ? p : { ...p, done: [...p.done, l] })), []);
  const enableCheat = useCallback(() => setS((p) => ({ ...p, cheat: true })), []);
  const reset = useCallback(() => setS(empty), []);

  return (
    <GameCtx.Provider value={{ ...s, addXp, unlock, complete, enableCheat, reset }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-50 flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.k}
              initial={{ y: -30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="card flex max-w-sm items-center gap-3 border-gold/60 px-4 py-3 shadow-[0_0_40px_-10px_rgba(255,200,87,.5)]"
            >
              <span className="text-2xl" aria-hidden>🏆</span>
              <div>
                <p className="label !text-gold">Achievement unlocked</p>
                <p className="font-bold">{toast.title}</p>
                {toast.description && <p className="text-sm text-muted">{toast.description}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameCtx.Provider>
  );
}
