# มือสองของเก่า — ระบบรับซื้อของเก่า

## 🚀 Deploy ด้วย Docker

### สิ่งที่ต้องมีบนเซิร์ฟเวอร์
- Docker Engine ≥ 24
- Docker Compose v2 (`docker compose`)
- Port 80 และ 443 ว่าง

---

### ขั้นตอน Deploy (ครั้งแรก)

**1. Clone โปรเจ็กต์**
```bash
git clone <repo-url> khongkao
cd khongkao
```

**2. สร้างไฟล์ `.env`**
```bash
cp .env.example .env
```
แก้ไข `.env` — ต้องเปลี่ยน `NEXTAUTH_SECRET`:
```bash
# สร้าง secret แบบสุ่ม
openssl rand -base64 32
```

**3. ใส่ SSL Certificate**

เลือก 1 วิธี:

- **วิธี A (แนะนำ): ใช้ Cloudflare**
  - ตั้งค่า DNS A record ของ `khongkao.xalpha.co.th` → IP เซิร์ฟเวอร์
  - Cloudflare SSL Mode: **Full (strict)**
  - ดาวน์โหลด **Cloudflare Origin Certificate** แล้ววางไฟล์:
    ```
    nginx/ssl/cert.pem   ← Origin Certificate
    nginx/ssl/key.pem    ← Private Key
    ```

- **วิธี B: ใช้ cert ตัวเอง**
  - วางไฟล์ cert ใน `nginx/ssl/cert.pem` และ `nginx/ssl/key.pem`

**4. Build และ Start**
```bash
docker compose up --build -d
```

ระบบจะทำให้อัตโนมัติ:
- Build Next.js application
- รัน database migrations
- Seed ข้อมูลเริ่มต้น (users, categories, products)
- Start nginx + app

---

### อัปเดตเวอร์ชันใหม่
```bash
git pull
docker compose up --build -d
```

---

### ดู Logs
```bash
# ดู log ทั้งหมด
docker compose logs -f

# ดูเฉพาะ app
docker compose logs -f app

# ดูเฉพาะ nginx
docker compose logs -f nginx
```

### หยุดระบบ
```bash
docker compose down
```

### Backup ฐานข้อมูล
```bash
# Copy ไฟล์ SQLite ออกมา
docker compose cp app:/app/data/prod.db ./backup-$(date +%Y%m%d).db
```

---

## 👤 บัญชีเริ่มต้น (หลัง seed)

| บทบาท | Username | Password |
|--------|----------|----------|
| เจ้าของร้าน | `owner` | `owner123` |
| พนักงาน (ป้าแดง) | `pa_daeng` | `staff123` |
| พนักงาน (ป้าน้อย) | `pa_noi` | `staff123` |

> ⚠️ **เปลี่ยนรหัสผ่านหลัง deploy ทันที** ผ่านหน้า จัดการพนักงาน

---

## 🛠 Development (Local)

```bash
npm install
cp .env.example .env.local
# แก้ .env.local ให้ DATABASE_URL=file:./prisma/dev.db

npx prisma migrate dev
npm run db:seed
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)
