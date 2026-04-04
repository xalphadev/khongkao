import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        include: {
          items: { select: { productName: true, quantity: true, unit: true, subtotal: true } },
          staff: { select: { name: true } },
        },
      },
    },
  });

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalSpend = customer.transactions.reduce((s, t) => s + t.totalAmount, 0);
  const lastVisit = customer.transactions[0]?.createdAt ?? null;
  return NextResponse.json({ ...customer, totalSpend, lastVisit, billCount: customer.transactions.length });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, nickname, phone, address, notes, isActive, priceGroupId } = body;
  if (!name?.trim()) return NextResponse.json({ error: "ต้องใส่ชื่อลูกค้า" }, { status: 400 });

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: name.trim(),
      nickname: nickname?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
      isActive: isActive ?? true,
      priceGroupId: priceGroupId ?? null,
    },
  });

  return NextResponse.json(customer);
}
