import Finale from "@/components/game/Finale";
import { getContent, onlyEnabled } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getContent("thank-you");
  return <Finale data={{ ...data, messages: onlyEnabled(data.messages) }} />;
}
