import GamePage from "@/components/game/GamePage";
import Timeline from "@/components/game/Timeline";
import { getContent, onlyEnabled } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { events } = await getContent("timeline");
  return (
    <GamePage title="Level 03 · The training timeline" wide>
      <Timeline events={onlyEnabled(events)} />
    </GamePage>
  );
}
