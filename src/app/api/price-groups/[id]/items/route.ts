import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: return all price items for this group
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const items = await prisma.priceGroupItem.findMany({
    where: { priceGroupId: id },
    include: { product: { include: { category: true } } },
  });

  return NextResponse.json(items);
}

// PUT: bulk upsert items  body: { items: [{ productId, pricePerUnit }] }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: priceGroupId } = await params;
  const body = await req.json();
  const items: { productId: string; pricePerUnit: number | null }[] = body.items ?? [];

  // Verify the group exists
  const group = await prisma.priceGroup.findUnique({ where: { id: priceGroupId } });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Process in a transaction
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (item.pricePerUnit === null || item.pricePerUnit === undefined) {
        // Remove override → fallback to default
        await tx.priceGroupItem.deleteMany({
          where: { priceGroupId, productId: item.productId },
        });
      } else {
        await tx.priceGroupItem.upsert({
          where: { priceGroupId_productId: { priceGroupId, productId: item.productId } },
          create: { priceGroupId, productId: item.productId, pricePerUnit: item.pricePerUnit },
          update: { pricePerUnit: item.pricePerUnit },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
