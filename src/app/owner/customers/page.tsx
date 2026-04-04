import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CustomersPage from "@/components/owner/CustomersPage";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") redirect("/login");
  return <CustomersPage />;
}
