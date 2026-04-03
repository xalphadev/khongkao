"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LogOut, ShoppingBag, ClipboardList, Package,
  User, ChevronRight, Recycle, ArrowRight,
} from "lucide-react";

interface StaffHomeProps { userName: string; }
interface Transaction {
  id: string; totalAmount: number; createdAt: string;
  customerName?: string | null;
  items: { id: string; productName: string; quantity: number; unit: string; subtotal: number }[];
}

function formatTime(s: string) {
  return new Date(s).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}
function formatMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatThaiDate() {
  return new Date().toLocaleDateString("th-TH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default function StaffHome({ userName }: StaffHomeProps) {
  const router = useRouter();
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadToday(); }, []);

  const loadToday = async () => {
    try {
      const date = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/transactions?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setTodayTransactions(data);
        setTodayTotal(data.reduce((s: number, t: Transaction) => s + t.totalAmount, 0));
      }
    } finally { setLoading(false); }
  };

  const firstName = userName.split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f0f4f8" }}>

      {/* ── HEADER ── */}
      <div
        className="relative px-5 pt-12 pb-28 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f4c2a 0%, #166534 50%, #15803d 100%)" }}
      >
        {/* Subtle geometric shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4ade80, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #86efac, transparent)", transform: "translate(-30%, 30%)" }} />

        {/* Top bar */}
        <div className="relative flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.2)" }}>
              <span className="text-white font-medium text-lg leading-none">{initial}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Recycle className="w-3.5 h-3.5 text-green-300 opacity-70" />
                <span className="text-green-200 text-xs opacity-80">มือสองของเก่า</span>
              </div>
              <p className="text-white font-medium text-lg leading-tight mt-0.5">{firstName}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm text-white transition-all"
            style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออก</span>
          </button>
        </div>

        {/* Stat */}
        <div className="relative">
          <p className="text-green-200 text-sm mb-1 opacity-80">{formatThaiDate()}</p>
          <p className="text-green-100 text-sm mb-2">ยอดรับซื้อวันนี้</p>
          <p className="text-white font-medium tabular-nums leading-none" style={{ fontSize: "2.8rem" }}>
            ฿{formatMoney(todayTotal)}
          </p>
          <p className="text-green-300 text-sm mt-2 opacity-90">
            {todayTransactions.length} รายการ
            {todayTransactions.length > 0 && todayTotal > 0 && (
              <span className="opacity-70"> · เฉลี่ย ฿{formatMoney(todayTotal / todayTransactions.length)}</span>
            )}
          </p>
        </div>

        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#f0f4f8]"
          style={{ borderRadius: "50% 50% 0 0 / 100% 100% 0 0", transform: "scaleX(1.1)" }} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 px-4 -mt-6 relative z-10 space-y-4 pb-10">

        {/* ── ACTION CARDS ── */}
        <div className="grid grid-cols-2 gap-3">

          {/* รับซื้อ */}
          <button
            onClick={() => router.push("/staff/purchase")}
            className="relative flex flex-col justify-between rounded-3xl p-5 overflow-hidden active:scale-[0.97] transition-all text-left"
            style={{
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              minHeight: 150,
              boxShadow: "0 8px 24px rgba(22,163,74,0.35)",
            }}
          >
            <div className="absolute -top-3 -right-3 w-20 h-20 rounded-full bg-white opacity-10" />
            <div className="absolute -bottom-5 -left-3 w-24 h-24 rounded-full bg-black opacity-10" />
            <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div className="relative">
              <p className="text-white font-medium text-lg leading-tight">รับซื้อ</p>
              <p className="text-green-200 text-sm mt-0.5">ของเก่า</p>
            </div>
            <div className="absolute top-4 right-4">
              <ArrowRight className="w-4 h-4 text-white opacity-50" />
            </div>
          </button>

          {/* ประวัติ */}
          <button
            onClick={() => router.push("/staff/history")}
            className="relative flex flex-col justify-between rounded-3xl p-5 overflow-hidden active:scale-[0.97] transition-all text-left"
            style={{
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              minHeight: 150,
              boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
            }}
          >
            <div className="absolute -top-3 -right-3 w-20 h-20 rounded-full bg-white opacity-10" />
            <div className="absolute -bottom-5 -left-3 w-24 h-24 rounded-full bg-black opacity-10" />
            <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div className="relative">
              <p className="text-white font-medium text-lg leading-tight">ประวัติ</p>
              <p className="text-blue-200 text-sm mt-0.5">วันนี้</p>
            </div>
            <div className="absolute top-4 right-4">
              <ArrowRight className="w-4 h-4 text-white opacity-50" />
            </div>
          </button>
        </div>

        {/* ── RECENT TRANSACTIONS ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-700 font-medium text-sm">รายการล่าสุด</p>
            {todayTransactions.length > 0 && (
              <button
                onClick={() => router.push("/staff/history")}
                className="text-green-700 text-xs font-medium flex items-center gap-0.5"
              >
                ดูทั้งหมด <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl py-12 flex items-center justify-center shadow-sm">
              <div className="w-6 h-6 border-2 border-gray-100 border-t-green-500 rounded-full animate-spin" />
            </div>
          ) : todayTransactions.length === 0 ? (
            <div className="bg-white rounded-3xl py-12 flex flex-col items-center gap-2 shadow-sm">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
                style={{ background: "#f1f5f9" }}>
                <Package className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-gray-600 font-medium text-sm">ยังไม่มีรายการวันนี้</p>
              <p className="text-gray-400 text-xs">กด รับซื้อ เพื่อเริ่มบันทึก</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
              {todayTransactions.slice(0, 5).map((t, idx) => {
                const dotColors = ["#16a34a", "#2563eb", "#7c3aed", "#ea580c", "#e11d48"];
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3.5 px-4 py-3.5 ${idx > 0 ? "border-t border-gray-50" : ""}`}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                      style={{ background: dotColors[idx % dotColors.length] }} />
                    <div className="flex-1 min-w-0">
                      {t.customerName && (
                        <div className="flex items-center gap-1 mb-0.5">
                          <User className="w-3 h-3 text-gray-400 shrink-0" />
                          <p className="text-gray-800 text-sm font-medium truncate">{t.customerName}</p>
                        </div>
                      )}
                      <p className={`truncate ${t.customerName ? "text-gray-400 text-xs" : "text-gray-700 text-sm font-medium"}`}>
                        {t.items.map((i) => i.productName).join(", ")}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">{formatTime(t.createdAt)}</p>
                    </div>
                    <p className="text-sm font-medium tabular-nums shrink-0"
                      style={{ color: dotColors[idx % dotColors.length] }}>
                      ฿{formatMoney(t.totalAmount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
