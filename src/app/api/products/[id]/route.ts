import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Record price history if price is changing (best-effort, non-blocking)
  if (body.pricePerUnit !== undefined && !body.customPrice) {
    try {
      const current = await prisma.product.findUnique({ where: { id } });
      const newPrice = Number(body.pricePerUnit);
      if (current && current.pricePerUnit !== newPrice && !current.customPrice) {
        await prisma.productPriceHistory.create({
          data: { productId: id, oldPrice: current.pricePerUnit, newPrice },
        });
      }
    } catch {
      // price history table may not exist yet — continue without recording
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      categoryId: body.categoryId,
      name: body.name,
      unit: body.unit,
      pricePerUnit: body.customPrice ? 0 : (body.pricePerUnit !== undefined ? parseFloat(body.pricePerUnit) : undefined),
      customPrice: body.customPrice !== undefined ? !!body.customPrice : undefined,
      isActive: body.isActive,
    },
    include: { category: true },
  });

  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.product.update({ where: { id }, data: { isActive: false } });

  return NextResponse.json({ success: true });
}
