import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StaffHome from "@/components/staff/StaffHome";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);

  return <StaffHome userName={session?.user.name || "พนักงาน"} />;
}
