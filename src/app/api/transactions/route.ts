import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  let dateFilter = {};

  // Use "T00:00:00" suffix so Date parses as LOCAL midnight, not UTC midnight
  if (date) {
    const start = new Date(date + "T00:00:00");
    const end   = new Date(date + "T23:59:59.999");
    dateFilter = { createdAt: { gte: start, lte: end } };
  } else if (startDate && endDate) {
    const start = new Date(startDate + "T00:00:00");
    const end   = new Date(endDate   + "T23:59:59.999");
    dateFilter = { createdAt: { gte: start, lte: end } };
  }

  // Staff can only see their own transactions
  const staffFilter =
    session.user.role === "staff" ? { staffId: session.user.id } : {};

  const transactions = await prisma.transaction.findMany({
    where: { ...dateFilter, ...staffFilter },
    include: {
      staff: { select: { id: true, name: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { items, note, customerName } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" }, { status: 400 });
  }

  const totalAmount = items.reduce(
    (sum: number, item: { subtotal: number }) => sum + item.subtotal,
    0
  );

  const transaction = await prisma.transaction.create({
    data: {
      staffId: session.user.id,
      totalAmount,
      customerName: customerName || null,
      note,
      items: {
        create: items.map((item: {
          productId: string;
          productName: string;
          quantity: number;
          unitPrice: number;
          subtotal: number;
          unit: string;
        }) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          unit: item.unit,
        })),
      },
    },
    include: {
      staff: { select: { id: true, name: true } },
      items: true,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
