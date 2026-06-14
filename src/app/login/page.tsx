import { LoginPage } from "@/features/auth/login-page";
import { getCurrentAdmin } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function LoginRoute() {
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect("/");
  }

  return <LoginPage />;
}
