"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LogOut, ShoppingBag, ChevronRight,
  Recycle, TrendingUp, Clock, ArrowRight,
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
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);

  useEffect(() => { loadToday(); loadHeld(); }, []);

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

  const loadHeld = async () => {
    const res = await fetch("/api/held-bills");
    if (res.ok) setHeldBills(await res.json());
  };

  const firstName = userName.split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col">

      {/* ── HEADER CARD ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(150deg, #15803d 0%, #16a34a 100%)",
          borderRadius: "0 0 32px 32px",
        }}
      >
        {/* decorative circles */}
        <div
          className="absolute -top-10 -right-10 w-52 h-52 rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />
        <div
          className="absolute top-8 -right-4 w-28 h-28 rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />
        <div
          className="absolute -bottom-6 -left-6 w-36 h-36 rounded-full"
          style={{ background: "rgba(0,0,0,0.07)" }}
        />

        {/* top bar */}
        <div className="relative flex items-center justify-between px-5 pt-14 pb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white font-semibold text-lg"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}
            >
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Recycle className="w-3.5 h-3.5 text-green-100 opacity-80" />
                <span className="text-green-100 text-xs opacity-80">มือสองของเก่า</span>
              </div>
              <p className="text-white font-semibold text-base leading-none">สวัสดี, {firstName}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white"
            style={{ background: "rgba(0,0,0,0.2)" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            ออก
          </button>
        </div>

        {/* stats panel */}
        <div className="relative px-5 pb-8">
          <p className="text-green-100 text-xs opacity-75 mb-3">{formatThaiDate()}</p>
          <div
            className="rounded-2xl px-5 py-4"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
          >
            <p className="text-green-50 text-xs opacity-80 mb-1">ยอดรับซื้อวันนี้</p>
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin my-2" />
            ) : (
              <p className="text-white tabular-nums leading-none" style={{ fontSize: "2.4rem", fontWeight: 600 }}>
                ฿{formatMoney(todayTotal)}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className="w-3.5 h-3.5 text-green-200" />
              <p className="text-green-100 text-xs opacity-85">
                {todayTransactions.length} รายการวันนี้
                {todayTransactions.length > 0 && todayTotal > 0 && (
                  <span className="opacity-70"> · เฉลี่ย ฿{formatMoney(todayTotal / todayTransactions.length)}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 px-4 pt-5 pb-28 space-y-5">

        {/* ── BIG ACTION BUTTON ── */}
        <button
          onClick={() => router.push("/staff/purchase")}
          className="w-full flex items-center gap-4 px-5 py-5 rounded-3xl active:scale-[0.98] transition-all text-left"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
            boxShadow: "0 10px 30px rgba(245,158,11,0.4)",
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-xl leading-tight">รับซื้อของเก่า</p>
            <p className="text-amber-100 text-sm mt-0.5">เริ่มบันทึกรายการรับซื้อใหม่</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white opacity-60 shrink-0" />
        </button>

        {/* ── HELD BILLS ── */}
        {heldBills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <p className="text-gray-700 font-semibold text-sm">บิลที่พักไว้ ({heldBills.length})</p>
            </div>
            <div className="space-y-2">
              {heldBills.map((bill) => {
                const total = bill.items.reduce((s, i) => s + i.subtotal, 0);
                return (
                  <button
                    key={bill.id}
                    onClick={() => router.push(`/staff/purchase?held=${bill.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white shadow-sm active:scale-[0.98] transition-all text-left"
                    style={{ border: "1.5px solid #fde68a" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#fef3c7" }}>
                      <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {bill.label && (
                        <p className="text-gray-800 text-sm font-medium truncate">{bill.label}</p>
                      )}
                      <p className={`truncate ${bill.label ? "text-gray-400 text-xs" : "text-gray-700 text-sm font-medium"}`}>
                        {bill.items.map((i) => i.productName).join(", ")}
                      </p>
                      {bill.heldBy && (
                        <p className="text-gray-400 text-xs mt-0.5">พักโดย {bill.heldBy}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-amber-600 font-semibold text-sm tabular-nums">฿{formatMoney(total)}</p>
                      <ArrowRight className="w-4 h-4 text-amber-400 mt-0.5 ml-auto" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}


      </div>

      <StaffTabBar />
    </div>
  );
}
