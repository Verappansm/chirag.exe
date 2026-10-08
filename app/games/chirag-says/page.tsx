import GamePage from "@/components/game/GamePage";
import SayGame from "@/components/game/SayGame";
import { getContent, onlyEnabled } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { questions } = await getContent("chirag-says");
  return (
    <GamePage title="Level 02 · What would Chirag say?">
      <SayGame questions={onlyEnabled(questions)} />
    </GamePage>
  );
}
