import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&priceGroupId=<id|"none">
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
  const startDate = searchParams.get("startDate") ?? today;
  const endDate = searchParams.get("endDate") ?? startDate;
  const priceGroupId = searchParams.get("priceGroupId") ?? null;

  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T23:59:59");

  const baseWhere = { createdAt: { gte: start, lte: end } };
  const where = priceGroupId === "none"
    ? { ...baseWhere, OR: [{ customerId: null }, { customer: { priceGroupId: null } }] }
    : priceGroupId
    ? { ...baseWhere, customer: { priceGroupId } }
    : baseWhere;

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      staff: { select: { id: true, name: true } },
      items: { include: { product: { include: { category: true } } } },
      customer: {
        select: {
          id: true,
          name: true,
          nickname: true,
          priceGroup: { select: { id: true, name: true, color: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalAmount = transactions.reduce((s, t) => s + t.totalAmount, 0);
  const totalTransactions = transactions.length;

  // Daily breakdown
  const dailyMap: Record<string, { date: string; amount: number; count: number }> = {};
  transactions.forEach((t) => {
    const day = t.createdAt.toISOString().split("T")[0];
    if (!dailyMap[day]) dailyMap[day] = { date: day, amount: 0, count: 0 };
    dailyMap[day].amount += t.totalAmount;
    dailyMap[day].count += 1;
  });
  const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // Category breakdown
  const categoryMap: Record<string, { name: string; amount: number; quantity: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const cat = item.product.category.name;
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, amount: 0, quantity: 0 };
      categoryMap[cat].amount += item.subtotal;
      categoryMap[cat].quantity += item.quantity;
    });
  });

  // Product breakdown
  const productMap: Record<string, { name: string; unit: string; amount: number; quantity: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!productMap[item.productName]) {
        productMap[item.productName] = { name: item.productName, unit: item.unit, amount: 0, quantity: 0 };
      }
      productMap[item.productName].amount += item.subtotal;
      productMap[item.productName].quantity += item.quantity;
    });
  });

  // Staff breakdown
  const staffMap: Record<string, { name: string; amount: number; count: number }> = {};
  transactions.forEach((t) => {
    const name = t.staff.name;
    if (!staffMap[name]) staffMap[name] = { name, amount: 0, count: 0 };
    staffMap[name].amount += t.totalAmount;
    staffMap[name].count += 1;
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

  // Customer breakdown (top customers by spend)
  const customerMap: Record<string, {
    id: string; name: string; nickname: string | null;
    priceGroupName: string | null; priceGroupColor: string | null;
    amount: number; count: number;
  }> = {};
  transactions.forEach((t) => {
    if (!t.customer) return;
    const key = t.customer.id;
    if (!customerMap[key]) {
      customerMap[key] = {
        id: t.customer.id, name: t.customer.name, nickname: t.customer.nickname ?? null,
        priceGroupName: t.customer.priceGroup?.name ?? null,
        priceGroupColor: t.customer.priceGroup?.color ?? null,
        amount: 0, count: 0,
      };
    }
    customerMap[key].amount += t.totalAmount;
    customerMap[key].count += 1;
  });
  const customerBreakdown = Object.values(customerMap).sort((a, b) => b.amount - a.amount);

  return NextResponse.json({
    startDate,
    endDate,
    totalAmount,
    totalTransactions,
    dailyData,
    categoryBreakdown: Object.values(categoryMap).sort((a, b) => b.amount - a.amount),
    productBreakdown: Object.values(productMap).sort((a, b) => b.amount - a.amount),
    staffBreakdown: Object.values(staffMap).sort((a, b) => b.amount - a.amount),
    priceGroupBreakdown,
    customerBreakdown,
    transactions,
  });
}
