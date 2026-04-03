import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create owner
  const ownerPassword = await bcrypt.hash("owner123", 10);
  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {},
    create: {
      name: "เจ้าของร้าน",
      username: "owner",
      password: ownerPassword,
      role: "owner",
      phone: "081-234-5678",
    },
  });

  // Create staff
  const staffPassword = await bcrypt.hash("staff123", 10);
  await prisma.user.upsert({
    where: { username: "pa_daeng" },
    update: {},
    create: {
      name: "ป้าแดง",
      username: "pa_daeng",
      password: staffPassword,
      role: "staff",
      phone: "082-345-6789",
    },
  });

  await prisma.user.upsert({
    where: { username: "pa_noi" },
    update: {},
    create: {
      name: "ป้าน้อย",
      username: "pa_noi",
      password: staffPassword,
      role: "staff",
      phone: "083-456-7890",
    },
  });

  // Create shop settings
  await prisma.shopSettings.upsert({
    where: { id: "settings" },
    update: {},
    create: {
      id: "settings",
      name: "มือสองของเก่า",
      address: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
      phone: "081-234-5678",
      receiptNote: "ขอบคุณที่ใช้บริการ",
    },
  });

  // Create categories
  const categories = [
    { name: "โลหะ", description: "เหล็ก, ทองแดง, อลูมิเนียม, สังกะสี" },
    { name: "อิเล็กทรอนิกส์", description: "เครื่องใช้ไฟฟ้า, โทรศัพท์, คอมพิวเตอร์" },
    { name: "กระดาษ", description: "กระดาษ, หนังสือพิมพ์, กล่องกระดาษ" },
    { name: "พลาสติก", description: "ขวดพลาสติก, ถุงพลาสติก" },
    { name: "แก้ว", description: "ขวดแก้ว, กระจก" },
    { name: "อื่นๆ", description: "สินค้าอื่นๆ" },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!existing) {
      const created = await prisma.category.create({ data: cat });
      createdCategories[cat.name] = created.id;
    } else {
      createdCategories[cat.name] = existing.id;
    }
  }

  // Create products
  const products = [
    // โลหะ
    { categoryName: "โลหะ", name: "เหล็ก", unit: "KG", pricePerUnit: 8 },
    { categoryName: "โลหะ", name: "ทองแดง", unit: "KG", pricePerUnit: 180 },
    { categoryName: "โลหะ", name: "อลูมิเนียม", unit: "KG", pricePerUnit: 45 },
    { categoryName: "โลหะ", name: "สังกะสี", unit: "KG", pricePerUnit: 25 },
    { categoryName: "โลหะ", name: "สเตนเลส", unit: "KG", pricePerUnit: 30 },
    { categoryName: "โลหะ", name: "ตะกั่ว", unit: "KG", pricePerUnit: 60 },
    // อิเล็กทรอนิกส์
    { categoryName: "อิเล็กทรอนิกส์", name: "โทรทัศน์", unit: "PIECE", pricePerUnit: 200 },
    { categoryName: "อิเล็กทรอนิกส์", name: "ตู้เย็น", unit: "PIECE", pricePerUnit: 400 },
    { categoryName: "อิเล็กทรอนิกส์", name: "เครื่องซักผ้า", unit: "PIECE", pricePerUnit: 350 },
    { categoryName: "อิเล็กทรอนิกส์", name: "แอร์", unit: "PIECE", pricePerUnit: 500 },
    { categoryName: "อิเล็กทรอนิกส์", name: "คอมพิวเตอร์", unit: "PIECE", pricePerUnit: 300 },
    { categoryName: "อิเล็กทรอนิกส์", name: "โทรศัพท์มือถือ", unit: "PIECE", pricePerUnit: 100 },
    // กระดาษ
    { categoryName: "กระดาษ", name: "กระดาษขาว", unit: "KG", pricePerUnit: 4 },
    { categoryName: "กระดาษ", name: "หนังสือพิมพ์", unit: "KG", pricePerUnit: 3 },
    { categoryName: "กระดาษ", name: "กล่องกระดาษ", unit: "KG", pricePerUnit: 3.5 },
    // พลาสติก
    { categoryName: "พลาสติก", name: "ขวดพลาสติกใส (PET)", unit: "KG", pricePerUnit: 12 },
    { categoryName: "พลาสติก", name: "พลาสติกแข็ง (HDPE)", unit: "KG", pricePerUnit: 8 },
    // แก้ว
    { categoryName: "แก้ว", name: "ขวดแก้วน้ำดื่ม", unit: "KG", pricePerUnit: 1 },
    { categoryName: "แก้ว", name: "ขวดแก้วสีชา", unit: "KG", pricePerUnit: 1.5 },
  ];

  for (const p of products) {
    const catId = createdCategories[p.categoryName];
    if (catId) {
      const existing = await prisma.product.findFirst({
        where: { name: p.name, categoryId: catId },
      });
      if (!existing) {
        await prisma.product.create({
          data: {
            categoryId: catId,
            name: p.name,
            unit: p.unit,
            pricePerUnit: p.pricePerUnit,
          },
        });
      }
    }
  }

  console.log("✅ Seed complete!");
  console.log("  Owner: username=owner, password=owner123");
  console.log("  Staff: username=pa_daeng, password=staff123");
  console.log("  Staff: username=pa_noi, password=staff123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
