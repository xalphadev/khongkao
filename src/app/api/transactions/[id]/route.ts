import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      staff: { select: { id: true, name: true } },
      items: { include: { product: { include: { category: true } } } },
    },
  });

  if (!transaction) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  return NextResponse.json(transaction);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { customerName, customerId, items } = body as {
    customerName?: string;
    customerId?: string | null;
    items: { id?: string; productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number; unit: string }[];
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "ต้องมีสินค้าอย่างน้อย 1 รายการ" }, { status: 400 });
  }

  const totalAmount = items.reduce((s, i) => s + i.subtotal, 0);

  // Delete all existing items and recreate
  await prisma.transactionItem.deleteMany({ where: { transactionId: id } });

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      customerName: customerName ?? null,
      customerId: customerId ?? null,
      totalAmount,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          unit: item.unit,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(updated);
}
