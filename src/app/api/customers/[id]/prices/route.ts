import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: resolved prices for all products for this customer
// Priority: individual override > group price > default
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: customerId } = await params;

  const [customer, products] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        priceGroup: { include: { items: true } },
        productPrices: true,
      },
    }),
    prisma.product.findMany({
      where: { isActive: true, customPrice: false },
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    }),
  ]);

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const resolved = products.map((p) => {
    const override = customer.productPrices.find((pp) => pp.productId === p.id);
    if (override) {
      return { productId: p.id, pricePerUnit: override.pricePerUnit, source: "override" as const };
    }
    const groupItem = customer.priceGroup?.items.find((gi) => gi.productId === p.id);
    if (groupItem) {
      return { productId: p.id, pricePerUnit: groupItem.pricePerUnit, source: "group" as const };
    }
    return { productId: p.id, pricePerUnit: p.pricePerUnit, source: "default" as const };
  });

  return NextResponse.json({
    customerId,
    priceGroupId: customer.priceGroupId,
    priceGroupName: customer.priceGroup?.name ?? null,
    priceGroupColor: customer.priceGroup?.color ?? null,
    prices: resolved,
  });
}

// PUT: update individual product price overrides for this customer
// body: { overrides: [{ productId, pricePerUnit: number|null }] }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: customerId } = await params;
  const body = await req.json();
  const overrides: { productId: string; pricePerUnit: number | null }[] = body.overrides ?? [];

  await prisma.$transaction(async (tx) => {
    for (const ov of overrides) {
      if (ov.pricePerUnit === null || ov.pricePerUnit === undefined) {
        await tx.customerProductPrice.deleteMany({ where: { customerId, productId: ov.productId } });
      } else {
        await tx.customerProductPrice.upsert({
          where: { customerId_productId: { customerId, productId: ov.productId } },
          create: { customerId, productId: ov.productId, pricePerUnit: ov.pricePerUnit },
          update: { pricePerUnit: ov.pricePerUnit },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
