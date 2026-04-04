import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const group = await prisma.priceGroup.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { category: true } } } },
      customers: { select: { id: true, name: true, nickname: true } },
    },
  });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(group);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, description, color, sortOrder, isActive } = body;

  const group = await prisma.priceGroup.update({
    where: { id },
    data: {
      name: name?.trim(),
      description: description?.trim() ?? null,
      color: color ?? undefined,
      sortOrder: sortOrder ?? undefined,
      isActive: isActive ?? undefined,
    },
  });

  return NextResponse.json(group);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // unlink customers first
  await prisma.customer.updateMany({ where: { priceGroupId: id }, data: { priceGroupId: null } });
  await prisma.priceGroup.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
