import { redirect } from "next/navigation";

export default function LegacyInsightsRoute() {
  redirect("/operations/insights");
}
