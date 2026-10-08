import GamePage from "@/components/game/GamePage";
import TraineeGame from "@/components/game/TraineeGame";
import { getContent, onlyEnabled } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { questions } = await getContent("trainees");
  return (
    <GamePage title="Level 01 · Who is this trainee?">
      <TraineeGame questions={onlyEnabled(questions)} />
    </GamePage>
  );
}
