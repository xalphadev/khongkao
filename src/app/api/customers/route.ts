import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const includeInactive = searchParams.get("includeInactive") === "true";
  const groupId = searchParams.get("groupId") ?? ""; // "" = all, "none" = no group
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const where = {
    isActive: includeInactive ? undefined : true,
    ...(q ? {
      OR: [
        { name: { contains: q } },
        { nickname: { contains: q } },
        { phone: { contains: q } },
      ],
    } : {}),
    ...(groupId === "none"
      ? { priceGroupId: null }
      : groupId
        ? { priceGroupId: groupId }
        : {}),
  };

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400_000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400_000);

  const [customers, total, activeCount, recentCount, newCount] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        _count: { select: { transactions: true } },
        transactions: {
          select: { totalAmount: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.customer.count({
      where: { isActive: true, transactions: { some: { createdAt: { gte: thirtyDaysAgo } } } },
    }),
    prisma.customer.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  const result = customers.map((c) => {
    const lastTx = c.transactions[0];
    return {
      id: c.id, name: c.name, nickname: c.nickname,
      phone: c.phone, address: c.address, notes: c.notes,
      isActive: c.isActive, createdAt: c.createdAt,
      priceGroupId: c.priceGroupId,
      billCount: c._count.transactions,
      lastVisit: lastTx?.createdAt ?? null,
    };
  });

  return NextResponse.json({
    customers: result,
    meta: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
      activeCount,
      recentCount,
      newCount,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, nickname, phone, address, notes } = body;
  if (!name?.trim()) return NextResponse.json({ error: "ต้องใส่ชื่อลูกค้า" }, { status: 400 });

  const customer = await prisma.customer.create({
    data: {
      name: name.trim(),
      nickname: nickname?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
