import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin login" };

export default async function Page() {
  if (await isAdmin()) redirect("/admin");
  return <LoginForm configured={!!process.env.ADMIN_PIN_HASH} />;
}
