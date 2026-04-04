import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  const categories = await prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: { products: { where: { isActive: true }, orderBy: { name: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, icon, color } = body;

  if (!name) return NextResponse.json({ error: "ต้องระบุชื่อหมวดหมู่" }, { status: 400 });

  const category = await prisma.category.create({
    data: { name, description, icon, color },
  });

  return NextResponse.json(category, { status: 201 });
}

// PATCH /api/categories — bulk reorder: body = [{ id, sortOrder }]
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items: { id: string; sortOrder: number }[] = await req.json();
  await Promise.all(
    items.map((item) =>
      prisma.category.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
    )
  );
  return NextResponse.json({ ok: true });
}
