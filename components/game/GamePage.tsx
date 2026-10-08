import Hud from "./Hud";

/** Shared page frame for every game: HUD + centered column. */
export default function GamePage({ title, children, wide = false }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <Hud title={title} />
      <main className={`mx-auto px-4 py-8 ${wide ? "max-w-5xl" : "max-w-2xl"}`}>{children}</main>
    </>
  );
}
