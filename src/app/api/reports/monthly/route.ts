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
  const now = new Date();
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));

  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: {
      items: { include: { product: { include: { category: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const dailyData: Record<string, { date: string; amount: number; count: number }> = {};
  transactions.forEach((t) => {
    const day = t.createdAt.toISOString().split("T")[0];
    if (!dailyData[day]) {
      dailyData[day] = { date: day, amount: 0, count: 0 };
    }
    dailyData[day].amount += t.totalAmount;
    dailyData[day].count += 1;
  });

  // Fill missing days
  const daysInMonth = new Date(year, month, 0).getDate();
  const allDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    const key = d.toISOString().split("T")[0];
    return dailyData[key] || { date: key, amount: 0, count: 0 };
  });

  const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalTransactions = transactions.length;

  // Category breakdown
  const categoryBreakdown: Record<string, { name: string; amount: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const catName = item.product.category.name;
      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = { name: catName, amount: 0 };
      }
      categoryBreakdown[catName].amount += item.subtotal;
    });
  });

  // Last 6 months for trend
  const sixMonthsAgo = new Date(year, month - 7, 1);
  const sixMonthsTransactions = await prisma.transaction.findMany({
    where: { createdAt: { gte: sixMonthsAgo, lt: start } },
    orderBy: { createdAt: "asc" },
  });

  const monthlyTrend: Record<string, { month: string; amount: number }> = {};
  [...sixMonthsTransactions, ...transactions].forEach((t) => {
    const d = t.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyTrend[key]) {
      monthlyTrend[key] = { month: key, amount: 0 };
    }
    monthlyTrend[key].amount += t.totalAmount;
  });

  return NextResponse.json({
    year,
    month,
    totalAmount,
    totalTransactions,
    dailyData: allDays,
    categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount),
    monthlyTrend: Object.values(monthlyTrend).sort((a, b) => a.month.localeCompare(b.month)),
  });
}
