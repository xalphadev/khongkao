"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LogOut, ShoppingBag, Clock, ArrowRight, Recycle,
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
    <div className="min-h-screen flex flex-col bg-[#f4f5f7]">

      {/* ── HEADER ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(155deg, #14532d 0%, #15803d 45%, #16a34a 100%)" }}
      >
        {/* Decorative shapes */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="absolute top-8 right-4 w-40 h-40 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full" style={{ background: "rgba(0,0,0,0.07)" }} />

        {/* Top bar */}
        <div className="relative flex items-center justify-between px-5 pt-14 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-green-700 font-bold text-lg shadow-lg"
              style={{ background: "rgba(255,255,255,0.95)" }}>
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Recycle className="w-3 h-3 text-green-300" />
                <span className="text-green-300 text-xs font-medium">มือสองของเก่า</span>
              </div>
              <p className="text-white font-bold text-lg leading-tight">สวัสดี, {firstName}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/70 active:scale-95 transition-all"
            style={{ background: "rgba(0,0,0,0.2)" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            ออก
          </button>
        </div>

        {/* Today's total */}
        <div className="relative px-5 pt-7 pb-10">
          <p className="text-green-300 text-sm mb-0.5">{formatThaiDate()}</p>
          <p className="text-green-100 text-base font-medium mb-2">ยอดรับซื้อวันนี้</p>
          {loading ? (
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin my-2" />
          ) : (
            <p className="text-white font-bold tabular-nums" style={{ fontSize: "clamp(2.4rem, 10vw, 3.5rem)", lineHeight: 1 }}>
              ฿{formatMoney(todayTotal)}
            </p>
          )}
          {/* Stat chips */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5" style={{ background: "rgba(255,255,255,0.14)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-300" />
              <span className="text-white text-sm font-medium">{todayTransactions.length} รายการ</span>
            </div>
            {heldBills.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5" style={{ background: "rgba(251,191,36,0.25)" }}>
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-amber-200 text-sm font-medium">พัก {heldBills.length} บิล</span>
              </div>
            )}
          </div>
        </div>

        {/* Wave bottom */}
        <svg viewBox="0 0 400 28" className="w-full block" style={{ marginBottom: -1 }}>
          <path d="M0,28 C80,0 320,0 400,28 L400,28 L0,28 Z" fill="#f4f5f7" />
        </svg>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 px-4 pt-2 pb-28 space-y-4">

        {/* ── PURCHASE BUTTON ── */}
        <button
          onClick={() => router.push("/staff/purchase")}
          className="w-full relative overflow-hidden rounded-3xl active:scale-[0.97] transition-all text-left"
          style={{
            background: "linear-gradient(135deg, #c2410c 0%, #ea580c 40%, #f97316 100%)",
            boxShadow: "0 8px 28px rgba(234,88,12,0.40), 0 2px 8px rgba(234,88,12,0.20)",
            padding: "18px 20px",
          }}
        >
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="absolute -bottom-6 right-14 w-28 h-28 rounded-full" style={{ background: "rgba(0,0,0,0.08)" }} />

          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
              style={{ background: "rgba(255,255,255,0.18)" }}>
              <ShoppingBag className="w-8 h-8 text-white" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-2xl leading-tight">รับซื้อของเก่า</p>
              <p className="text-orange-100 text-sm mt-0.5 font-medium">เริ่มบันทึกรายการรับซื้อใหม่</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.18)" }}>
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </button>

        {/* ── HELD BILLS ── */}
        {heldBills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-1 mb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <p className="text-gray-700 font-semibold text-sm">บิลที่พักไว้</p>
              <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {heldBills.length}
              </span>
            </div>
            <div className="space-y-2.5">
              {heldBills.map((bill) => {
                const total = bill.items.reduce((s, i) => s + i.subtotal, 0);
                return (
                  <button
                    key={bill.id}
                    onClick={() => router.push(`/staff/purchase?held=${bill.id}`)}
                    className="w-full flex items-center gap-0 rounded-2xl bg-white active:scale-[0.98] transition-all text-left overflow-hidden"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1.5px solid #fef3c7" }}
                  >
                    <div className="w-1 self-stretch bg-amber-400 shrink-0" />
                    <div className="flex items-center gap-3 flex-1 min-w-0 py-3.5 px-3.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-50">
                        <Clock className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {bill.label ? (
                          <>
                            <p className="text-gray-800 text-sm font-semibold truncate">{bill.label}</p>
                            <p className="text-gray-400 text-xs truncate mt-0.5">
                              {bill.items.map((i) => i.productName).join(", ")}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-700 text-sm font-medium truncate">
                            {bill.items.map((i) => i.productName).join(", ")}
                          </p>
                        )}
                        {bill.heldBy && (
                          <p className="text-gray-400 text-xs mt-0.5">พักโดย {bill.heldBy}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-amber-600 font-bold text-base tabular-nums">฿{formatMoney(total)}</p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <p className="text-amber-400 text-xs">ดำเนินการ</p>
                          <ArrowRight className="w-3 h-3 text-amber-400" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── EMPTY STATE (no held bills, no transactions) ── */}
        {heldBills.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
              <ShoppingBag className="w-10 h-10 text-green-400" strokeWidth={1.5} />
            </div>
            <p className="text-gray-500 text-base font-medium">ยังไม่มีรายการวันนี้</p>
            <p className="text-gray-400 text-sm mt-1">กดปุ่มด้านบนเพื่อเริ่มรับซื้อ</p>
          </div>
        )}

      </div>

      <StaffTabBar />
    </div>
  );
}
