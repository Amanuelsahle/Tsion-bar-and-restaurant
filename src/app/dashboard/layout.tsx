import { redirect } from "next/navigation";
import { getUserSession } from "../../lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getUserSession();

  if (!session) {
    redirect("/");
  }

  return <>{children}</>;
}
