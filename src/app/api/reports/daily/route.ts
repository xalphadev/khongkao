import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  function localDateString(d: Date = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  const date = searchParams.get("date") || localDateString();

  const start = new Date(date + "T00:00:00");
  const end   = new Date(date + "T23:59:59.999");

  const transactions = await prisma.transaction.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: {
      staff: { select: { id: true, name: true } },
      items: { include: { product: { include: { category: true } } } },
      customer: {
        select: {
          id: true,
          name: true,
          priceGroup: { select: { id: true, name: true, color: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalTransactions = transactions.length;

  // Category breakdown
  const categoryBreakdown: Record<string, { name: string; amount: number; quantity: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const catName = item.product.category.name;
      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = { name: catName, amount: 0, quantity: 0 };
      }
      categoryBreakdown[catName].amount += item.subtotal;
      categoryBreakdown[catName].quantity += item.quantity;
    });
  });

  // Product breakdown
  const productBreakdown: Record<string, { name: string; unit: string; amount: number; quantity: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const key = item.productName;
      if (!productBreakdown[key]) {
        productBreakdown[key] = { name: item.productName, unit: item.unit, amount: 0, quantity: 0 };
      }
      productBreakdown[key].amount += item.subtotal;
      productBreakdown[key].quantity += item.quantity;
    });
  });

  // Staff breakdown
  const staffBreakdown: Record<string, { name: string; amount: number; count: number }> = {};
  transactions.forEach((t) => {
    const staffName = t.staff.name;
    if (!staffBreakdown[staffName]) {
      staffBreakdown[staffName] = { name: staffName, amount: 0, count: 0 };
    }
    staffBreakdown[staffName].amount += t.totalAmount;
    staffBreakdown[staffName].count += 1;
  });

  // Price group breakdown
  const pgMap: Record<string, { id: string; name: string; color: string | null; amount: number; count: number; customerIds: Set<string> }> = {};
  transactions.forEach((t) => {
    const pg = t.customer?.priceGroup ?? null;
    const key = pg?.id ?? "__none__";
    if (!pgMap[key]) {
      pgMap[key] = { id: key, name: pg ? pg.name : "ราคาปกติ", color: pg?.color ?? null, amount: 0, count: 0, customerIds: new Set() };
    }
    pgMap[key].amount += t.totalAmount;
    pgMap[key].count += 1;
    if (t.customerId) pgMap[key].customerIds.add(t.customerId);
  });
  const priceGroupBreakdown = Object.values(pgMap)
    .map((g) => ({ id: g.id, name: g.name, color: g.color, amount: g.amount, count: g.count, customerCount: g.customerIds.size }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({
    date,
    totalAmount,
    totalTransactions,
    transactions,
    categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount),
    productBreakdown: Object.values(productBreakdown).sort((a, b) => b.amount - a.amount),
    staffBreakdown: Object.values(staffBreakdown).sort((a, b) => b.amount - a.amount),
    priceGroupBreakdown,
  });
}
