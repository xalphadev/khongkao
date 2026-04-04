import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(n: number, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding database...");

  // ── Users ──────────────────────────────────────────────────────
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

  const staffPassword = await bcrypt.hash("staff123", 10);
  const paDaeng = await prisma.user.upsert({
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

  const paNoi = await prisma.user.upsert({
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

  // ── Shop settings ──────────────────────────────────────────────
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

  // ── Categories ─────────────────────────────────────────────────
  const categoryDefs = [
    { name: "โลหะ",           description: "เหล็ก, ทองแดง, อลูมิเนียม, สังกะสี",          icon: "Wrench",    color: "#475569" },
    { name: "อิเล็กทรอนิกส์", description: "เครื่องใช้ไฟฟ้า, โทรศัพท์, คอมพิวเตอร์",     icon: "Cpu",       color: "#2563eb" },
    { name: "กระดาษ",          description: "กระดาษ, หนังสือพิมพ์, กล่องกระดาษ",           icon: "Newspaper", color: "#d97706" },
    { name: "พลาสติก",         description: "ขวดพลาสติก, ถุงพลาสติก",                      icon: "Recycle",   color: "#7c3aed" },
    { name: "แก้ว",            description: "ขวดแก้ว, กระจก",                              icon: "GlassWater",color: "#0891b2" },
    { name: "อื่นๆ",           description: "สินค้าอื่นๆ ที่ไม่อยู่ในหมวดหมู่",           icon: "Package",   color: "#16a34a" },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of categoryDefs) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!existing) {
      const created = await prisma.category.create({ data: cat });
      catMap[cat.name] = created.id;
    } else {
      // Update icon/color if not set yet
      if (!existing.icon || !existing.color) {
        await prisma.category.update({ where: { id: existing.id }, data: { icon: cat.icon, color: cat.color } });
      }
      catMap[cat.name] = existing.id;
    }
  }

  // ── Products ───────────────────────────────────────────────────
  const productDefs = [
    // โลหะ
    { cat: "โลหะ", name: "เหล็ก",            unit: "KG",    price: 8,   custom: false },
    { cat: "โลหะ", name: "ทองแดง",           unit: "KG",    price: 180, custom: false },
    { cat: "โลหะ", name: "อลูมิเนียม",       unit: "KG",    price: 45,  custom: false },
    { cat: "โลหะ", name: "สังกะสี",          unit: "KG",    price: 25,  custom: false },
    { cat: "โลหะ", name: "สเตนเลส",          unit: "KG",    price: 30,  custom: false },
    { cat: "โลหะ", name: "ตะกั่ว",           unit: "KG",    price: 60,  custom: false },
    // อิเล็กทรอนิกส์
    { cat: "อิเล็กทรอนิกส์", name: "โทรทัศน์",        unit: "PIECE", price: 200, custom: false },
    { cat: "อิเล็กทรอนิกส์", name: "ตู้เย็น",          unit: "PIECE", price: 400, custom: false },
    { cat: "อิเล็กทรอนิกส์", name: "เครื่องซักผ้า",   unit: "PIECE", price: 350, custom: false },
    { cat: "อิเล็กทรอนิกส์", name: "แอร์",             unit: "PIECE", price: 500, custom: false },
    { cat: "อิเล็กทรอนิกส์", name: "คอมพิวเตอร์",     unit: "PIECE", price: 300, custom: false },
    { cat: "อิเล็กทรอนิกส์", name: "โทรศัพท์มือถือ",  unit: "PIECE", price: 100, custom: false },
    // กระดาษ
    { cat: "กระดาษ", name: "กระดาษขาว",      unit: "KG", price: 4,   custom: false },
    { cat: "กระดาษ", name: "หนังสือพิมพ์",   unit: "KG", price: 3,   custom: false },
    { cat: "กระดาษ", name: "กล่องกระดาษ",    unit: "KG", price: 3.5, custom: false },
    // พลาสติก
    { cat: "พลาสติก", name: "ขวดพลาสติกใส (PET)", unit: "KG", price: 12, custom: false },
    { cat: "พลาสติก", name: "พลาสติกแข็ง (HDPE)", unit: "KG", price: 8,  custom: false },
    { cat: "พลาสติก", name: "ขวดน้ำพลาสติก",      unit: "KG", price: 6,  custom: false },
    // แก้ว
    { cat: "แก้ว", name: "ขวดแก้วน้ำดื่ม", unit: "KG", price: 1,   custom: false },
    { cat: "แก้ว", name: "ขวดแก้วสีชา",    unit: "KG", price: 1.5, custom: false },
    // อื่นๆ — กำหนดราคาเอง
    { cat: "อื่นๆ", name: "ค่าอื่นๆ",      unit: "PIECE", price: 0, custom: true },
    { cat: "อื่นๆ", name: "ของเบ็ดเตล็ด",  unit: "KG",    price: 0, custom: true },
  ];

  const prodMap: Record<string, string> = {};
  for (const p of productDefs) {
    const catId = catMap[p.cat];
    if (!catId) continue;
    const existing = await prisma.product.findFirst({ where: { name: p.name, categoryId: catId } });
    if (!existing) {
      const created = await prisma.product.create({
        data: { categoryId: catId, name: p.name, unit: p.unit, pricePerUnit: p.price, customPrice: p.custom },
      });
      prodMap[p.name] = created.id;
    } else {
      prodMap[p.name] = existing.id;
      // update customPrice flag if needed
      if (existing.customPrice !== p.custom) {
        await prisma.product.update({ where: { id: existing.id }, data: { customPrice: p.custom } });
      }
    }
  }

  // ── Customers (skip if already have data) ─────────────────────
  const custCount = await prisma.customer.count();
  if (custCount === 0) {
    console.log("  Creating sample customers...");

    const customerDefs = [
      { name: "ลุงสมชาย",    nickname: "ลุง",    phone: "081-111-2222", address: "ซอยลาดพร้าว 10",  notes: "มาทุกอาทิตย์" },
      { name: "ป้าสมศรี",    nickname: "ป้าศรี", phone: "082-222-3333", address: "ตลาดมีนบุรี",     notes: "ขายกระดาษและขวดเป็นหลัก" },
      { name: "นายประสิทธิ์", nickname: "ต้น",    phone: "083-333-4444", address: "บางนา",           notes: "" },
      { name: "แม่ค้าตลาด",  nickname: "แม่ค้า", phone: "084-444-5555", address: "ตลาดอินทรา",     notes: "ขายพลาสติกและแก้ว" },
      { name: "คุณวิชัย",    nickname: "ไวย์",   phone: "085-555-6666", address: "ลาดกระบัง",       notes: "เครื่องใช้ไฟฟ้ามือสอง" },
      { name: "ป้าจันทร์",   nickname: "ป้าจัน", phone: "086-666-7777", address: "มีนบุรี",         notes: "" },
      { name: "คุณสมบัติ",   nickname: "บัติ",   phone: "087-777-8888", address: "รังสิต",          notes: "โลหะเป็นหลัก" },
      { name: "ยายแดง",      nickname: "ยาย",    phone: "088-888-9999", address: "ปทุมธานี",        notes: "" },
    ];

    for (const c of customerDefs) {
      await prisma.customer.create({
        data: {
          name: c.name,
          nickname: c.nickname || null,
          phone: c.phone || null,
          address: c.address || null,
          notes: c.notes || null,
        },
      });
    }

    console.log(`  ✓ Created ${customerDefs.length} sample customers`);
  } else {
    console.log(`  ⚠ Skipped sample customers (${custCount} already exist)`);
  }

  // ── Sample Transactions (skip if already have data) ────────────
  const txCount = await prisma.transaction.count();
  if (txCount === 0) {
    console.log("  Creating sample transactions...");

    type TxDef = {
      staffId: string; customerName: string; createdAt: Date;
      items: { name: string; qty: number; unit: string; unitPrice: number }[];
    };

    const sampleTx: TxDef[] = [
      // 7 วันที่แล้ว
      {
        staffId: paDaeng.id, customerName: "ลุงสมชาย", createdAt: daysAgo(7, 9, 15),
        items: [
          { name: "เหล็ก",    qty: 50, unit: "KG",    unitPrice: 8 },
          { name: "สังกะสี",  qty: 20, unit: "KG",    unitPrice: 25 },
        ],
      },
      {
        staffId: paNoi.id, customerName: "ป้าสมศรี", createdAt: daysAgo(7, 14, 30),
        items: [
          { name: "กล่องกระดาษ",  qty: 30, unit: "KG", unitPrice: 3.5 },
          { name: "หนังสือพิมพ์", qty: 15, unit: "KG", unitPrice: 3 },
        ],
      },
      // 6 วันที่แล้ว
      {
        staffId: paDaeng.id, customerName: "นายประสิทธิ์", createdAt: daysAgo(6, 10, 0),
        items: [
          { name: "ทองแดง",    qty: 5, unit: "KG",    unitPrice: 180 },
          { name: "อลูมิเนียม", qty: 8, unit: "KG",    unitPrice: 45 },
        ],
      },
      {
        staffId: paDaeng.id, customerName: "แม่ค้าตลาด", createdAt: daysAgo(6, 15, 45),
        items: [
          { name: "ขวดพลาสติกใส (PET)", qty: 20, unit: "KG", unitPrice: 12 },
          { name: "ขวดแก้วน้ำดื่ม",     qty: 25, unit: "KG", unitPrice: 1 },
        ],
      },
      // 5 วันที่แล้ว
      {
        staffId: paNoi.id, customerName: "คุณวิชัย", createdAt: daysAgo(5, 11, 20),
        items: [
          { name: "โทรทัศน์",   qty: 2, unit: "PIECE", unitPrice: 200 },
          { name: "ตู้เย็น",    qty: 1, unit: "PIECE", unitPrice: 400 },
        ],
      },
      {
        staffId: paDaeng.id, customerName: "ป้าจันทร์", createdAt: daysAgo(5, 13, 0),
        items: [
          { name: "เหล็ก",      qty: 80,  unit: "KG", unitPrice: 8 },
          { name: "สเตนเลส",    qty: 10,  unit: "KG", unitPrice: 30 },
          { name: "กระดาษขาว",  qty: 25,  unit: "KG", unitPrice: 4 },
        ],
      },
      // 4 วันที่แล้ว
      {
        staffId: paDaeng.id, customerName: "นายทองดี", createdAt: daysAgo(4, 9, 30),
        items: [
          { name: "แอร์",       qty: 1, unit: "PIECE", unitPrice: 500 },
          { name: "เครื่องซักผ้า", qty: 1, unit: "PIECE", unitPrice: 350 },
        ],
      },
      {
        staffId: paNoi.id, customerName: "คุณนิด", createdAt: daysAgo(4, 16, 0),
        items: [
          { name: "ทองแดง",    qty: 3,  unit: "KG", unitPrice: 180 },
          { name: "ตะกั่ว",    qty: 5,  unit: "KG", unitPrice: 60 },
        ],
      },
      // 3 วันที่แล้ว
      {
        staffId: paDaeng.id, customerName: "ลุงแก่", createdAt: daysAgo(3, 8, 45),
        items: [
          { name: "เหล็ก",     qty: 120, unit: "KG", unitPrice: 8 },
          { name: "อลูมิเนียม", qty: 15, unit: "KG", unitPrice: 45 },
          { name: "สังกะสี",   qty: 30,  unit: "KG", unitPrice: 25 },
        ],
      },
      {
        staffId: paNoi.id, customerName: "แม่น้องแป้ง", createdAt: daysAgo(3, 14, 10),
        items: [
          { name: "ขวดพลาสติกใส (PET)", qty: 35, unit: "KG", unitPrice: 12 },
          { name: "พลาสติกแข็ง (HDPE)", qty: 20, unit: "KG", unitPrice: 8 },
        ],
      },
      // 2 วันที่แล้ว
      {
        staffId: paDaeng.id, customerName: "ป้าเหลือง", createdAt: daysAgo(2, 10, 30),
        items: [
          { name: "กล่องกระดาษ",  qty: 60, unit: "KG", unitPrice: 3.5 },
          { name: "หนังสือพิมพ์", qty: 30, unit: "KG", unitPrice: 3 },
          { name: "กระดาษขาว",    qty: 20, unit: "KG", unitPrice: 4 },
        ],
      },
      {
        staffId: paDaeng.id, customerName: "คุณสิทธิ์", createdAt: daysAgo(2, 13, 55),
        items: [
          { name: "คอมพิวเตอร์",    qty: 2, unit: "PIECE", unitPrice: 300 },
          { name: "โทรศัพท์มือถือ", qty: 3, unit: "PIECE", unitPrice: 100 },
        ],
      },
      {
        staffId: paNoi.id, customerName: "นายรุ่ง", createdAt: daysAgo(2, 16, 20),
        items: [
          { name: "ทองแดง", qty: 8, unit: "KG", unitPrice: 180 },
          { name: "ตะกั่ว", qty: 4, unit: "KG", unitPrice: 60 },
        ],
      },
      // เมื่อวาน
      {
        staffId: paDaeng.id, customerName: "แม่ค้าเก่า", createdAt: daysAgo(1, 9, 0),
        items: [
          { name: "เหล็ก",       qty: 200, unit: "KG", unitPrice: 8 },
          { name: "สเตนเลส",     qty: 25,  unit: "KG", unitPrice: 30 },
        ],
      },
      {
        staffId: paNoi.id, customerName: "คุณศรีนวล", createdAt: daysAgo(1, 11, 30),
        items: [
          { name: "ตู้เย็น", qty: 2, unit: "PIECE", unitPrice: 400 },
          { name: "แอร์",    qty: 1, unit: "PIECE", unitPrice: 500 },
        ],
      },
      {
        staffId: paDaeng.id, customerName: "ลุงมนตรี", createdAt: daysAgo(1, 15, 45),
        items: [
          { name: "ขวดแก้วน้ำดื่ม",     qty: 40, unit: "KG", unitPrice: 1 },
          { name: "ขวดแก้วสีชา",         qty: 25, unit: "KG", unitPrice: 1.5 },
          { name: "ขวดพลาสติกใส (PET)",  qty: 15, unit: "KG", unitPrice: 12 },
        ],
      },
    ];

    for (const tx of sampleTx) {
      const totalAmount = tx.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
      const transaction = await prisma.transaction.create({
        data: {
          staffId: tx.staffId,
          customerName: tx.customerName,
          totalAmount,
          createdAt: tx.createdAt,
          updatedAt: tx.createdAt,
        },
      });

      for (const item of tx.items) {
        const productId = prodMap[item.name];
        if (!productId) continue;
        await prisma.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId,
            productName: item.name,
            quantity: item.qty,
            unit: item.unit,
            unitPrice: item.unitPrice,
            subtotal: item.qty * item.unitPrice,
          },
        });
      }
    }

    console.log(`  ✓ Created ${sampleTx.length} sample transactions`);
  } else {
    console.log(`  ⚠ Skipped sample transactions (${txCount} already exist)`);
  }

  console.log("");
  console.log("✅ Seed complete!");
  console.log("  Owner  : username=owner,    password=owner123");
  console.log("  Staff  : username=pa_daeng, password=staff123");
  console.log("  Staff  : username=pa_noi,   password=staff123");
  console.log("");
  console.log("  หมวดหมู่ : 6 หมวด");
  console.log("  สินค้า   : 22 รายการ (รวม 2 รายการแบบกำหนดราคาเอง)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
