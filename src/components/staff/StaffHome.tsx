"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LogOut, ShoppingBag, ClipboardList, Package,
  User, ChevronRight, TrendingUp, Recycle,
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

const AMOUNT_COLORS = [
  "text-emerald-600", "text-blue-600", "text-violet-600",
  "text-orange-500", "text-rose-500",
];

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
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── TOP BAR ── */}
      <div className="bg-white px-5 pt-12 pb-4 flex items-center justify-between shadow-[0_1px_0_#e2e8f0]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md shadow-green-500/30">
            <span className="text-white font-medium text-lg leading-none">{initial}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900 leading-tight">{firstName}</p>
            <p className="text-gray-400 text-xs mt-0.5">{formatThaiDate()}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 border border-gray-200 text-gray-500 px-3 py-2 rounded-xl text-sm active:bg-gray-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออก</span>
        </button>
      </div>

      <div className="flex-1 px-4 pt-5 pb-10 space-y-4">

        {/* ── HERO STAT CARD ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-green-50 flex items-center justify-center">
                <Recycle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-gray-400 text-sm">มือสองของเก่า</p>
            </div>

            <p className="text-gray-400 text-sm mb-1">ยอดรับซื้อวันนี้</p>
            <p className="text-5xl font-medium text-gray-900 tabular-nums leading-tight">
              ฿{formatMoney(todayTotal)}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 border-t border-slate-100 divide-x divide-slate-100">
            <div className="px-5 py-3.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-gray-400 text-xs leading-tight">รายการทั้งหมด</p>
                <p className="text-gray-800 font-medium text-sm">
                  {todayTransactions.length} รายการ
                </p>
              </div>
            </div>
            <div className="px-5 py-3.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <ClipboardList className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-400 text-xs leading-tight">เฉลี่ย/รายการ</p>
                <p className="text-gray-800 font-medium text-sm tabular-nums">
                  ฿{todayTransactions.length > 0
                    ? formatMoney(todayTotal / todayTransactions.length)
                    : "0.00"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <button
            onClick={() => router.push("/staff/purchase")}
            className="w-full flex items-center gap-4 px-5 py-5 active:bg-slate-50 transition-colors border-b border-slate-100"
          >
            <div className="w-13 h-13 w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md shadow-green-500/30 shrink-0">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900 text-base">รับซื้อของเก่า</p>
              <p className="text-gray-400 text-sm mt-0.5">บันทึกรายการรับซื้อใหม่</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <ChevronRight className="w-4 h-4 text-green-600" />
            </div>
          </button>

          <button
            onClick={() => router.push("/staff/history")}
            className="w-full flex items-center gap-4 px-5 py-5 active:bg-slate-50 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900 text-base">ประวัติรายการ</p>
              <p className="text-gray-400 text-sm mt-0.5">ดูรายการรับซื้อวันนี้</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <ChevronRight className="w-4 h-4 text-blue-600" />
            </div>
          </button>
        </div>

        {/* ── RECENT TRANSACTIONS ── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-gray-700 text-sm font-medium">รายการล่าสุด</p>
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
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-green-500 rounded-full animate-spin" />
            </div>
          ) : todayTransactions.length === 0 ? (
            <div className="bg-white rounded-3xl py-12 flex flex-col items-center gap-2 shadow-sm border border-slate-100">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-1">
                <Package className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-gray-600 font-medium text-sm">ยังไม่มีรายการวันนี้</p>
              <p className="text-gray-400 text-xs">กด รับซื้อของเก่า เพื่อเริ่มบันทึก</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {todayTransactions.slice(0, 5).map((t, idx) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${idx > 0 ? "border-t border-slate-50" : ""}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-slate-500 text-sm font-medium">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {t.customerName && (
                      <div className="flex items-center gap-1 mb-0.5">
                        <User className="w-3 h-3 text-gray-400 shrink-0" />
                        <p className="text-gray-800 text-sm font-medium truncate">{t.customerName}</p>
                      </div>
                    )}
                    <p className={`text-sm truncate ${t.customerName ? "text-gray-400 text-xs" : "text-gray-700 font-medium"}`}>
                      {t.items.map((i) => i.productName).join(", ")}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">{formatTime(t.createdAt)}</p>
                  </div>
                  <p className={`font-medium text-sm tabular-nums shrink-0 ${AMOUNT_COLORS[idx % AMOUNT_COLORS.length]}`}>
                    ฿{formatMoney(t.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
