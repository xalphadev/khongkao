import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bills = await prisma.heldBill.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    bills.map((b: { id: string; label: string | null; items: string; heldBy: string | null; createdAt: Date }) => ({
      ...b,
      items: JSON.parse(b.items),
    }))
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { label, items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  const bill = await prisma.heldBill.create({
    data: {
      label: label || null,
      items: JSON.stringify(items),
      heldBy: session.user.name ?? session.user.id,
    },
  });

  return NextResponse.json({ ...bill, items });
}
