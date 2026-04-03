import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Only include fields that were explicitly sent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};
  if (body.name !== undefined)        data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.icon !== undefined)        data.icon = body.icon;
  if (body.color !== undefined)       data.color = body.color;
  if (body.isActive !== undefined)    data.isActive = body.isActive;

  try {
    const category = await prisma.category.update({ where: { id }, data });
    return NextResponse.json(category);
  } catch (err) {
    console.error("[PUT /api/categories/[id]]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึก" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.category.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
