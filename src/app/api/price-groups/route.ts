import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await prisma.priceGroup.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { customers: true, items: true } },
    },
  });

  return NextResponse.json(groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    color: g.color,
    isActive: g.isActive,
    sortOrder: g.sortOrder,
    customerCount: g._count.customers,
    itemCount: g._count.items,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, color, sortOrder } = body;
  if (!name?.trim()) return NextResponse.json({ error: "ต้องใส่ชื่อกลุ่ม" }, { status: 400 });

  const group = await prisma.priceGroup.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      color: color || "#16a34a",
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(group, { status: 201 });
}
