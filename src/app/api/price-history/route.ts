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
  const days = parseInt(searchParams.get("days") ?? "30");

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  try {
    const history = await prisma.productPriceHistory.findMany({
      where: { changedAt: { gte: since } },
      orderBy: { changedAt: "desc" },
      include: {
        product: {
          select: { name: true, unit: true, category: { select: { name: true } } },
        },
      },
    });
    return NextResponse.json(history);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
