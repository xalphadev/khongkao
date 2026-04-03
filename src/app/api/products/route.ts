import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const includeInactive = searchParams.get("includeInactive") === "true";

  const products = await prisma.product.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(!includeInactive ? { isActive: true } : {}),
    },
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { categoryId, name, unit, pricePerUnit, customPrice } = body;

  if (!categoryId || !name || !unit) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      categoryId, name, unit,
      pricePerUnit: customPrice ? 0 : parseFloat(pricePerUnit ?? 0),
      customPrice: !!customPrice,
    },
    include: { category: true },
  });

  return NextResponse.json(product, { status: 201 });
}
