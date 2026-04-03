"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LogOut, ShoppingBag, Clock, ArrowRight, Recycle, AlertCircle,
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
  const [draftItems, setDraftItems] = useState(0);
  const [draftTotal, setDraftTotal] = useState(0);

  useEffect(() => {
    loadToday();
    loadHeld();
    // Check for unfinished draft in localStorage
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

  const loadToday = async () => {
    try {
      const d = new Date();
      const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
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

  const hasActivity = heldBills.length > 0 || draftItems > 0 || todayTransactions.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f5f7]">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(155deg, #14532d 0%, #15803d 45%, #16a34a 100%)" }}>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="absolute top-8 right-4 w-40 h-40 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />

        {/* Top bar */}
        <div className="relative flex items-center justify-between px-5 pt-14 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-green-700 font-bold text-xl shadow-lg"
              style={{ background: "rgba(255,255,255,0.95)" }}>
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Recycle className="w-3 h-3 text-green-300" />
                <span className="text-green-300 text-xs font-medium">มือสองของเก่า</span>
              </div>
              <p className="text-white font-bold text-xl leading-tight">สวัสดี, {firstName}</p>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/70 active:scale-95 transition-all"
            style={{ background: "rgba(0,0,0,0.2)" }}>
            <LogOut className="w-3.5 h-3.5" /> ออก
          </button>
        </div>

        {/* Today stat */}
        <div className="relative px-5 pt-5 pb-8">
          <p className="text-green-300 text-xs mb-3">{formatThaiDate()}</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-green-200 text-sm font-medium mb-1">ยอดรับซื้อวันนี้</p>
              {loading ? (
                <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin my-1" />
              ) : (
                <p className="text-white font-bold tabular-nums" style={{ fontSize: "clamp(2.2rem, 9vw, 3rem)", lineHeight: 1 }}>
                  ฿{formatMoney(todayTotal)}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "rgba(255,255,255,0.14)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-300" />
                  <span className="text-white text-sm font-medium">{todayTransactions.length} บิล</span>
                </div>
                {heldBills.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "rgba(251,191,36,0.25)" }}>
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span className="text-amber-200 text-sm font-medium">พัก {heldBills.length} บิล</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <svg viewBox="0 0 400 28" className="w-full block" style={{ marginBottom: -1 }}>
          <path d="M0,28 C80,0 320,0 400,28 L400,28 L0,28 Z" fill="#f4f5f7" />
        </svg>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 px-4 pt-3 pb-28 space-y-3">

        {/* ── DRAFT RECOVERY (if unfinished bill exists) ── */}
        {draftItems > 0 && (
          <button onClick={() => router.push("/staff/purchase")}
            className="w-full flex items-center gap-3 rounded-2xl text-left overflow-hidden active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg, #fff7ed, #ffedd5)", border: "1.5px solid #fed7aa", boxShadow: "0 2px 12px rgba(234,88,12,0.12)" }}>
            <div className="w-1.5 self-stretch bg-orange-400 shrink-0 rounded-l-2xl" />
            <div className="flex items-center gap-3 flex-1 py-3.5 pr-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-orange-800 font-semibold text-sm">มีบิลที่ยังบันทึกค้างไว้</p>
                <p className="text-orange-500 text-xs mt-0.5">{draftItems} รอบ · ยอด ฿{formatMoney(draftTotal)}</p>
              </div>
              <div className="flex items-center gap-1 text-orange-500 shrink-0">
                <span className="text-xs font-semibold">ทำต่อ</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        )}

        {/* ── HELD BILLS ── */}
        {heldBills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-1 mb-2.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <p className="text-gray-700 font-semibold text-sm">บิลที่พักไว้</p>
              <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{heldBills.length}</span>
            </div>
            <div className="space-y-2">
              {heldBills.map((bill) => {
                const total = bill.items.reduce((s, i) => s + i.subtotal, 0);
                return (
                  <button key={bill.id} onClick={() => router.push(`/staff/purchase?held=${bill.id}`)}
                    className="w-full flex items-center gap-0 rounded-2xl bg-white active:scale-[0.98] transition-all text-left overflow-hidden"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1.5px solid #fef3c7" }}>
                    <div className="w-1.5 self-stretch bg-amber-400 shrink-0" />
                    <div className="flex items-center gap-3 flex-1 min-w-0 py-3.5 px-3.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-50">
                        <Clock className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 text-sm font-semibold truncate">{bill.label || "บิลไม่มีชื่อ"}</p>
                        <p className="text-gray-400 text-xs truncate mt-0.5">{bill.items.map(i => i.productName).join(", ")}</p>
                        {bill.heldBy && <p className="text-gray-400 text-xs mt-0.5">พักโดย {bill.heldBy}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-amber-600 font-bold text-base tabular-nums">฿{formatMoney(total)}</p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <p className="text-amber-400 text-xs">ทำต่อ</p>
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

        {/* ── MAIN CTA ── */}
        <button onClick={() => router.push("/staff/purchase")}
          className="w-full relative overflow-hidden rounded-3xl active:scale-[0.97] transition-all text-left"
          style={{
            background: "linear-gradient(135deg, #4d7c0f 0%, #65a30d 45%, #84cc16 100%)",
            boxShadow: "0 8px 28px rgba(101,163,13,0.45), 0 2px 8px rgba(101,163,13,0.20)",
            padding: "20px 22px",
          }}>
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.18)" }}>
              <ShoppingBag className="w-8 h-8 text-white" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <p className="text-lime-100 text-sm font-medium">
                {draftItems > 0 ? "เปิดบิลใหม่" : "เริ่มบันทึก"}
              </p>
              <p className="text-white font-bold text-2xl leading-tight">รับซื้อของเก่า</p>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </button>

        {/* ── EMPTY / TODAY SUMMARY ── */}
        {!loading && !hasActivity && (
          <div className="bg-white rounded-3xl px-6 py-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
              <ShoppingBag className="w-8 h-8 text-green-400" strokeWidth={1.5} />
            </div>
            <p className="text-gray-700 font-semibold text-base">พร้อมรับซื้อวันนี้</p>
            <p className="text-gray-400 text-sm mt-1.5">กดปุ่มเขียว "รับซื้อของเก่า" ด้านบน<br/>เพื่อเริ่มบันทึกรายการ</p>
          </div>
        )}

        {/* Today's bills summary */}
        {!loading && todayTransactions.length > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <p className="text-gray-700 font-semibold text-sm">บิลวันนี้</p>
              <span className="text-gray-400 text-xs">{todayTransactions.length} รายการ</span>
            </div>
            {todayTransactions.slice(0, 5).map((t, i) => (
              <div key={t.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-gray-50" : ""}`}>
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <span className="text-green-600 text-xs font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm font-medium truncate">
                    {t.customerName || t.items.map(it => it.productName).join(", ")}
                  </p>
                  <p className="text-gray-400 text-xs">{t.items.length} รายการ</p>
                </div>
                <p className="text-green-600 font-semibold text-sm tabular-nums shrink-0">฿{formatMoney(t.totalAmount)}</p>
              </div>
            ))}
            {todayTransactions.length > 5 && (
              <div className="px-4 py-2.5 border-t border-gray-50 text-center">
                <p className="text-gray-400 text-xs">และอีก {todayTransactions.length - 5} รายการ · ดูทั้งหมดในประวัติ</p>
              </div>
            )}
          </div>
        )}

      </div>

      <StaffTabBar />
    </div>
  );
}
