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
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: {
      staff: { select: { id: true, name: true } },
      items: { include: { product: { include: { category: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalTransactions = transactions.length;

  // Group by category
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

  // Group by product
  const productBreakdown: Record<string, { name: string; unit: string; amount: number; quantity: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const key = item.productName;
      if (!productBreakdown[key]) {
        productBreakdown[key] = {
          name: item.productName,
          unit: item.unit,
          amount: 0,
          quantity: 0,
        };
      }
      productBreakdown[key].amount += item.subtotal;
      productBreakdown[key].quantity += item.quantity;
    });
  });

  return NextResponse.json({
    date,
    totalAmount,
    totalTransactions,
    transactions,
    categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount),
    productBreakdown: Object.values(productBreakdown).sort((a, b) => b.amount - a.amount),
  });
}
