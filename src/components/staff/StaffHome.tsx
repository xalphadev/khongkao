"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Recycle, LogOut, ShoppingBag, ClipboardList,
  Package, User, ChevronRight, TrendingUp,
} from "lucide-react";

interface StaffHomeProps {
  userName: string;
}

interface Transaction {
  id: string;
  totalAmount: number;
  createdAt: string;
  customerName?: string | null;
  items: { id: string; productName: string; quantity: number; unit: string; subtotal: number }[];
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function formatMoney(amount: number) {
  return amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatThaiDate() {
  return new Date().toLocaleDateString("th-TH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// Row accent colors cycling
const ROW_ACCENTS = [
  { bg: "bg-green-500", light: "bg-green-50", text: "text-green-600" },
  { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600" },
  { bg: "bg-violet-500", light: "bg-violet-50", text: "text-violet-600" },
  { bg: "bg-orange-500", light: "bg-orange-50", text: "text-orange-600" },
  { bg: "bg-rose-500", light: "bg-rose-50", text: "text-rose-600" },
];

export default function StaffHome({ userName }: StaffHomeProps) {
  const router = useRouter();
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTodayHistory(); }, []);

  const loadTodayHistory = async () => {
    try {
      const date = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/transactions?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setTodayTransactions(data);
        setTodayTotal(data.reduce((s: number, t: Transaction) => s + t.totalAmount, 0));
      }
    } finally {
      setLoading(false);
    }
  };

  const firstNameOnly = userName.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#f0f2f8]">

      {/* ── HEADER ── */}
      <div className="relative bg-gradient-to-br from-[#0ea84f] via-[#13c05a] to-[#2ecc71] pt-10 pb-16 px-5 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute top-8 right-4 w-24 h-24 rounded-full bg-white/15" />
        <div className="absolute bottom-4 left-8 w-36 h-36 rounded-full bg-[#09963f]/40" />

        {/* Top bar */}
        <div className="relative flex justify-between items-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/80 text-sm font-medium">มือสองของเก่า</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 bg-black/20 hover:bg-black/30 px-3.5 py-2 rounded-xl text-white text-sm transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออก</span>
          </button>
        </div>

        {/* Greeting */}
        <div className="relative mb-5">
          <p className="text-white/60 text-sm">สวัสดี</p>
          <h1 className="text-4xl font-medium text-white mt-0.5">{firstNameOnly}</h1>
          <p className="text-white/50 text-xs mt-1">{formatThaiDate()}</p>
        </div>

        {/* Stats row */}
        <div className="relative grid grid-cols-2 gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-200" />
              <p className="text-white/70 text-xs">ยอดรับซื้อวันนี้</p>
            </div>
            <p className="text-2xl font-medium text-white tabular-nums leading-tight">
              ฿{formatMoney(todayTotal)}
            </p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ClipboardList className="w-3.5 h-3.5 text-green-200" />
              <p className="text-white/70 text-xs">รายการ</p>
            </div>
            <p className="text-2xl font-medium text-white leading-tight">
              {todayTransactions.length} <span className="text-base text-white/60">รายการ</span>
            </p>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 390 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0 40 C97.5 0 292.5 0 390 40 L390 40 L0 40 Z" fill="#f0f2f8" />
          </svg>
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="px-4 pt-5 pb-4 grid grid-cols-2 gap-3">

        {/* รับซื้อ */}
        <button
          onClick={() => router.push("/staff/purchase")}
          className="relative bg-gradient-to-br from-emerald-400 to-green-600 rounded-3xl overflow-hidden active:scale-[0.96] transition-all shadow-xl shadow-green-500/40"
          style={{ minHeight: 160 }}
        >
          {/* Background circles */}
          <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/15 rounded-full" />
          <div className="absolute -top-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />

          <div className="relative p-5 flex flex-col items-start h-full justify-between">
            <div className="w-14 h-14 bg-white/25 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white font-medium text-xl leading-tight">รับซื้อ</p>
              <p className="text-white/70 text-sm">ของเก่า</p>
            </div>
          </div>
        </button>

        {/* ประวัติ */}
        <button
          onClick={() => router.push("/staff/history")}
          className="relative bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl overflow-hidden active:scale-[0.96] transition-all shadow-xl shadow-blue-500/40"
          style={{ minHeight: 160 }}
        >
          <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/15 rounded-full" />
          <div className="absolute -top-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />

          <div className="relative p-5 flex flex-col items-start h-full justify-between">
            <div className="w-14 h-14 bg-white/25 rounded-2xl flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white font-medium text-xl leading-tight">ประวัติ</p>
              <p className="text-white/70 text-sm">วันนี้</p>
            </div>
          </div>
        </button>
      </div>

      {/* ── RECENT TRANSACTIONS ── */}
      <div className="px-4 pb-12">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-600 text-sm font-medium">รายการล่าสุด</p>
          {todayTransactions.length > 0 && (
            <button
              onClick={() => router.push("/staff/history")}
              className="text-green-600 text-xs font-medium flex items-center gap-0.5"
            >
              ดูทั้งหมด <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
            <p className="text-sm">กำลังโหลด...</p>
          </div>
        ) : todayTransactions.length === 0 ? (
          <div className="bg-white rounded-3xl py-12 flex flex-col items-center gap-2 shadow-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-1">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-sm">ยังไม่มีรายการวันนี้</p>
            <p className="text-gray-400 text-xs">กดรับซื้อเพื่อเริ่มบันทึก</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayTransactions.slice(0, 5).map((t, idx) => {
              const accent = ROW_ACCENTS[idx % ROW_ACCENTS.length];
              return (
                <div key={t.id} className="bg-white rounded-2xl px-4 py-3.5 shadow-sm flex items-center gap-3">
                  {/* Colored number badge */}
                  <div className={`w-9 h-9 rounded-xl ${accent.bg} flex items-center justify-center text-sm font-medium text-white shrink-0 shadow-sm`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    {t.customerName && (
                      <div className="flex items-center gap-1 mb-0.5">
                        <User className="w-3 h-3 text-gray-400 shrink-0" />
                        <p className="text-gray-900 text-sm font-medium truncate">{t.customerName}</p>
                      </div>
                    )}
                    <p className={`truncate ${t.customerName ? "text-gray-400 text-xs" : "text-gray-800 text-sm font-medium"}`}>
                      {t.items.map((i) => i.productName).join(", ")}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">{formatTime(t.createdAt)}</p>
                  </div>
                  {/* Amount with accent color */}
                  <p className={`font-medium text-sm tabular-nums shrink-0 ${accent.text}`}>
                    ฿{formatMoney(t.totalAmount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
