"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LogOut, ShoppingBag, Clock, ArrowRight, AlertCircle,
  TrendingUp, Banknote, BarChart2,
} from "lucide-react";
import StaffTabBar from "./StaffTabBar";

interface StaffHomeProps { userName: string; }
interface Transaction {
  id: string; totalAmount: number; createdAt: string;
  customerName?: string | null;
  items: { id: string; productName: string; quantity: number; unit: string; subtotal: number }[];
}
interface HeldBill {
  id: string; label: string | null; heldBy: string | null; createdAt: string;
  items: { productName: string; quantity: number; unitPrice: number; subtotal: number }[];
}

function formatMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatMoneyShort(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// Derive top products from transactions
function getTopProducts(txns: Transaction[]) {
  const map: Record<string, { name: string; total: number }> = {};
  txns.forEach(t => t.items.forEach(i => {
    if (!map[i.productName]) map[i.productName] = { name: i.productName, total: 0 };
    map[i.productName].total += i.subtotal;
  }));
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 6);
}

const CHIP_COLORS = [
  { bg: "#22c55e", text: "#fff" },
  { bg: "#3b82f6", text: "#fff" },
  { bg: "#f59e0b", text: "#fff" },
  { bg: "#8b5cf6", text: "#fff" },
  { bg: "#ec4899", text: "#fff" },
  { bg: "#06b6d4", text: "#fff" },
];

export default function StaffHome({ userName }: StaffHomeProps) {
  const router = useRouter();
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [draftItems, setDraftItems] = useState(0);
  const [draftTotal, setDraftTotal] = useState(0);

  useEffect(() => {
    loadAll();
    try {
      const raw = localStorage.getItem("purchase_cart_draft");
      if (raw) {
        const { cart } = JSON.parse(raw);
        if (cart && cart.length > 0) {
          setDraftItems(cart.length);
          setDraftTotal(cart.reduce((s: number, i: { subtotal: number }) => s + i.subtotal, 0));
        }
      }
    } catch {}
  }, []);

  const loadAll = async () => {
    const d = new Date();
    const date = localDate();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const [txRes, heldRes, monthRes] = await Promise.all([
      fetch(`/api/transactions?date=${date}`),
      fetch("/api/held-bills"),
      fetch(`/api/reports/monthly?year=${year}&month=${month}`),
    ]);
    if (txRes.ok) {
      const data: Transaction[] = await txRes.json();
      setTodayTransactions(data);
      setTodayTotal(data.reduce((s, t) => s + t.totalAmount, 0));
    }
    if (heldRes.ok) setHeldBills(await heldRes.json());
    if (monthRes.ok) {
      const m = await monthRes.json();
      setMonthTotal(m.totalAmount ?? 0);
      setMonthCount(m.totalTransactions ?? 0);
    }
    setLoading(false);
  };

  const firstName = userName.split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();
  const avgPerBill = todayTransactions.length > 0 ? todayTotal / todayTransactions.length : 0;
  const topProducts = getTopProducts(todayTransactions);

  const thaiDate = new Date().toLocaleDateString("th-TH", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#eef2f7" }}>

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(140deg, #059669 0%, #10b981 40%, #0ea5e9 100%)" }}>

        {/* Decorative blobs */}
        <div className="absolute -top-14 -right-14 w-60 h-60 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent)" }} />
        <div className="absolute bottom-10 -left-8 w-44 h-44 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.25), transparent)" }} />
        <div className="absolute top-24 right-8 w-20 h-20 rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }} />

        {/* Top bar */}
        <div className="relative flex items-center justify-between px-5 pb-4"
          style={{ paddingTop: "max(env(safe-area-inset-top), 56px)" }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold text-lg shadow-lg"
              style={{ background: "rgba(255,255,255,0.25)", color: "#fff", backdropFilter: "blur(4px)" }}>
              {initial}
            </div>
            <div>
              <p className="text-emerald-100 text-xs font-medium opacity-80">มือสองของเก่า</p>
              <p className="text-white font-bold text-lg leading-tight">สวัสดี, {firstName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-xs hidden sm:block">{thaiDate}</span>
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-95 transition-all"
              style={{ background: "rgba(0,0,0,0.15)" }}>
              <LogOut className="w-4 h-4 text-white/80" />
            </button>
          </div>
        </div>

        {/* Total card floating */}
        <div className="relative mx-5 mb-3 rounded-2xl px-5 py-4"
          style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <p className="text-white/70 text-xs font-medium mb-1">ยอดรับซื้อวันนี้</p>
          {loading ? (
            <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin my-1" />
          ) : (
            <p className="text-white font-bold tabular-nums leading-none"
              style={{ fontSize: "clamp(2rem, 9vw, 2.6rem)" }}>
              ฿{formatMoney(todayTotal)}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2.5">
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              {todayTransactions.length} บิลวันนี้
            </span>
            {heldBills.length > 0 && (
              <span className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-amber-200"
                style={{ background: "rgba(251,191,36,0.22)" }}>
                <Clock className="w-3 h-3" />
                พัก {heldBills.length} บิล
              </span>
            )}
          </div>
        </div>

        {/* Wave */}
        <svg viewBox="0 0 400 32" className="w-full block" style={{ marginBottom: -1 }}>
          <path d="M0,32 C100,0 300,0 400,32 L400,32 L0,32 Z" fill="#eef2f7" />
        </svg>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 px-4 pt-3 pb-28 space-y-3">

        {/* Draft recovery */}
        {draftItems > 0 && (
          <button onClick={() => router.push("/staff/purchase")}
            className="w-full flex items-center gap-0 rounded-2xl text-left overflow-hidden active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg, #fff7ed, #ffedd5)", border: "1.5px solid #fed7aa" }}>
            <div className="w-1.5 self-stretch bg-orange-400 shrink-0" />
            <div className="flex items-center gap-3 flex-1 py-3.5 px-4">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-orange-800 font-semibold text-sm">มีบิลที่ยังบันทึกค้างไว้</p>
                <p className="text-orange-500 text-xs mt-0.5">{draftItems} รอบ · ฿{formatMoney(draftTotal)}</p>
              </div>
              <div className="flex items-center gap-1 text-orange-500 shrink-0">
                <span className="text-xs font-semibold">ทำต่อ</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        )}

        {/* Held bills */}
        {heldBills.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <p className="text-gray-600 font-semibold text-sm">บิลที่พักไว้</p>
              <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{heldBills.length}</span>
            </div>
            {heldBills.map((bill) => {
              const total = bill.items.reduce((s, i) => s + i.subtotal, 0);
              return (
                <button key={bill.id} onClick={() => router.push(`/staff/purchase?held=${bill.id}`)}
                  className="w-full flex items-center gap-0 rounded-2xl bg-white active:scale-[0.98] transition-all text-left overflow-hidden"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1.5px solid #fef3c7" }}>
                  <div className="w-1.5 self-stretch bg-amber-400 shrink-0" />
                  <div className="flex items-center gap-3 flex-1 min-w-0 py-3.5 px-3.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Clock className="w-4.5 h-4.5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 text-sm font-semibold truncate">{bill.label || "บิลไม่มีชื่อ"}</p>
                      <p className="text-gray-400 text-xs truncate mt-0.5">{bill.items.map(i => i.productName).join(", ")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-amber-600 font-bold text-sm tabular-nums">฿{formatMoney(total)}</p>
                      <p className="text-amber-400 text-xs mt-0.5">ทำต่อ →</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── BIG CTA ── */}
        <button onClick={() => router.push("/staff/purchase")}
          className="w-full relative overflow-hidden rounded-3xl active:scale-[0.96] transition-all"
          style={{
            background: "linear-gradient(135deg, #84cc16 0%, #22c55e 55%, #16a34a 100%)",
            boxShadow: "0 16px 48px rgba(132,204,22,0.45), 0 4px 16px rgba(34,197,94,0.4)",
            padding: "26px 24px",
          }}>
          {/* Decorative glow blobs */}
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="absolute top-3 right-24 w-16 h-16 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="relative flex items-center gap-4">
            {/* Icon with pulsing ring */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl animate-ping opacity-30"
                style={{ background: "rgba(255,255,255,0.5)", animationDuration: "2s" }} />
              <div className="w-18 h-18 rounded-2xl flex items-center justify-center relative"
                style={{ width: 72, height: 72, background: "rgba(255,255,255,0.28)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                <ShoppingBag className="w-9 h-9 text-white" strokeWidth={2} />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white/75 text-sm font-medium mb-0.5">
                {draftItems > 0 ? "เปิดบิลใหม่" : "กดเพื่อเริ่มบันทึก"}
              </p>
              <p className="text-white font-black leading-tight" style={{ fontSize: "1.75rem" }}>รับซื้อของเก่า</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.3)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <ArrowRight className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </button>

        {/* ── QUICK STATS ── */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl px-3 py-3.5 flex flex-col gap-1 shadow-sm"
            style={{ background: "linear-gradient(135deg, #d1fae5, #6ee7b7)", boxShadow: "0 4px 12px rgba(16,185,129,0.2)" }}>
            <Banknote className="w-4 h-4 text-emerald-700" />
            <p className="text-xs font-medium mt-0.5 text-emerald-700">เดือนนี้</p>
            <p className="font-bold tabular-nums text-base leading-tight text-emerald-800">
              ฿{formatMoneyShort(monthTotal)}
            </p>
            <p className="text-xs text-emerald-600">{monthCount} บิล</p>
          </div>
          <div className="rounded-2xl px-3 py-3.5 flex flex-col gap-1 shadow-sm"
            style={{ background: "linear-gradient(135deg, #dbeafe, #93c5fd)", boxShadow: "0 4px 12px rgba(59,130,246,0.2)" }}>
            <BarChart2 className="w-4 h-4 text-blue-700" />
            <p className="text-xs font-medium mt-0.5 text-blue-700">บิลวันนี้</p>
            <p className="font-bold tabular-nums text-base leading-tight text-blue-800">
              {todayTransactions.length}
            </p>
            <p className="text-xs text-blue-600">รายการ</p>
          </div>
          <div className="rounded-2xl px-3 py-3.5 flex flex-col gap-1 shadow-sm"
            style={{ background: "linear-gradient(135deg, #fed7aa, #fdba74)", boxShadow: "0 4px 12px rgba(251,146,60,0.2)" }}>
            <TrendingUp className="w-4 h-4 text-orange-700" />
            <p className="text-xs font-medium mt-0.5 text-orange-700">เฉลี่ย/บิล</p>
            <p className="font-bold tabular-nums text-base leading-tight text-orange-800">
              ฿{formatMoneyShort(avgPerBill)}
            </p>
            <p className="text-xs text-orange-600">วันนี้</p>
          </div>
        </div>

        {/* ── TODAY'S TOP PRODUCTS ── */}
        {topProducts.length > 0 && (
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-sky-400" />
              <p className="text-gray-600 text-xs font-bold uppercase tracking-wide">สินค้าที่รับซื้อวันนี้</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {topProducts.map((p, i) => (
                <div key={p.name}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                  style={{ background: CHIP_COLORS[i % CHIP_COLORS.length].bg }}>
                  <span className="text-xs font-semibold"
                    style={{ color: CHIP_COLORS[i % CHIP_COLORS.length].text }}>
                    {p.name}
                  </span>
                  <span className="text-xs font-bold tabular-nums"
                    style={{ color: CHIP_COLORS[i % CHIP_COLORS.length].text }}>
                    ฿{formatMoneyShort(p.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && todayTransactions.length === 0 && heldBills.length === 0 && draftItems === 0 && (
          <div className="bg-white rounded-2xl px-6 py-7 text-center shadow-sm border border-gray-100">
            <p className="text-gray-600 font-semibold text-base">พร้อมรับซื้อแล้ว!</p>
            <p className="text-gray-400 text-sm mt-1">กดปุ่มเขียวด้านบนเพื่อเริ่มบันทึก</p>
          </div>
        )}

      </div>

      <StaffTabBar />
    </div>
  );
}
