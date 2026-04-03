"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LogOut, ShoppingBag, ChevronRight,
  Recycle, Clock, ArrowRight, Wallet,
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
    <div className="min-h-screen flex flex-col" style={{ background: "#f0f2f5" }}>

      {/* ── HEADER ── */}
      <div
        className="relative overflow-hidden px-5 pt-14"
        style={{ background: "linear-gradient(160deg, #166534 0%, #16a34a 60%, #22c55e 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full"
          style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="absolute top-24 -left-12 w-48 h-48 rounded-full"
          style={{ background: "rgba(0,0,0,0.06)" }} />

        {/* Top bar */}
        <div className="relative flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-green-700 font-bold text-xl shadow-lg"
              style={{ background: "rgba(255,255,255,0.92)" }}
            >
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Recycle className="w-3 h-3 text-green-200" />
                <span className="text-green-200 text-xs">มือสองของเก่า</span>
              </div>
              <p className="text-white font-semibold text-lg leading-tight mt-0.5">
                สวัสดี, {firstName}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/80 transition-all active:scale-95"
            style={{ background: "rgba(0,0,0,0.18)" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            ออก
          </button>
        </div>

        {/* Stats */}
        <div className="relative mb-2">
          <p className="text-green-200 text-xs mb-1">{formatThaiDate()}</p>
          <p className="text-green-100 text-sm font-medium mb-1">ยอดรับซื้อวันนี้</p>
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin my-3" />
          ) : (
            <p className="text-white tabular-nums font-bold leading-none" style={{ fontSize: "3rem" }}>
              ฿{formatMoney(todayTotal)}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-300" />
              <span className="text-white text-xs">{todayTransactions.length} รายการ</span>
            </div>
            {todayTransactions.length > 0 && todayTotal > 0 && (
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                <Wallet className="w-3 h-3 text-green-300" />
                <span className="text-white text-xs">เฉลี่ย ฿{formatMoney(todayTotal / todayTransactions.length)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Overlap card area */}
        <div className="h-8" />
        <div
          className="absolute bottom-0 left-0 right-0 h-8"
          style={{ background: "#f0f2f5", borderRadius: "24px 24px 0 0" }}
        />
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 px-4 -mt-1 pb-28 space-y-4">

        {/* ── PURCHASE BUTTON ── */}
        <button
          onClick={() => router.push("/staff/purchase")}
          className="w-full relative overflow-hidden rounded-3xl active:scale-[0.98] transition-all text-left"
          style={{
            background: "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)",
            boxShadow: "0 12px 32px rgba(234,88,12,0.38)",
            padding: "20px 22px",
          }}
        >
          {/* decorative circle */}
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 right-16 w-24 h-24 rounded-full bg-black/10" />

          <div className="relative flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ background: "rgba(255,255,255,0.22)" }}
            >
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-2xl leading-tight">รับซื้อของเก่า</p>
              <p className="text-orange-100 text-sm mt-0.5">เริ่มบันทึกรายการรับซื้อใหม่</p>
            </div>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </button>

        {/* ── HELD BILLS ── */}
        {heldBills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-1 mb-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-3 h-3 text-amber-600" />
              </div>
              <p className="text-gray-600 font-semibold text-sm">
                บิลที่พักไว้
                <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{heldBills.length}</span>
              </p>
            </div>
            <div className="space-y-2.5">
              {heldBills.map((bill) => {
                const total = bill.items.reduce((s, i) => s + i.subtotal, 0);
                return (
                  <button
                    key={bill.id}
                    onClick={() => router.push(`/staff/purchase?held=${bill.id}`)}
                    className="w-full flex items-center gap-3.5 rounded-2xl bg-white active:scale-[0.98] transition-all text-left overflow-hidden"
                    style={{
                      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                      border: "1.5px solid #fef3c7",
                    }}
                  >
                    {/* Left accent bar */}
                    <div className="w-1 self-stretch bg-amber-400 shrink-0 rounded-l-2xl" />
                    <div className="flex items-center gap-3 flex-1 min-w-0 py-3.5 pr-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "#fef3c7" }}>
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

      </div>

      <StaffTabBar />
    </div>
  );
}
