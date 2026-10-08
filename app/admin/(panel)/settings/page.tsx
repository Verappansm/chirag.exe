import SettingsPanel from "@/components/admin/SettingsPanel";
import { getStorage } from "@/lib/storage";

export default function Page() {
  const s = getStorage();
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Settings</h1>
      <SettingsPanel storage={s.name} persistent={s.persistent} />
    </div>
  );
}
