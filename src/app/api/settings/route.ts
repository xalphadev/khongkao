import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let settings = await prisma.shopSettings.findUnique({ where: { id: "settings" } });

  if (!settings) {
    settings = await prisma.shopSettings.create({
      data: { id: "settings", name: "มือสองของเก่า" },
    });
  }

  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const settings = await prisma.shopSettings.upsert({
    where: { id: "settings" },
    update: {
      name: body.name,
      address: body.address,
      phone: body.phone,
      taxId: body.taxId,
      receiptNote: body.receiptNote,
    },
    create: {
      id: "settings",
      name: body.name || "มือสองของเก่า",
      address: body.address,
      phone: body.phone,
      taxId: body.taxId,
      receiptNote: body.receiptNote,
    },
  });

  return NextResponse.json(settings);
}
