import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import OwnerShell from "@/components/owner/OwnerShell";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "owner") redirect("/staff");

  return <OwnerShell>{children}</OwnerShell>;
}
