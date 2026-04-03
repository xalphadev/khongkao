"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ClipboardList, User, ChevronDown,
} from "lucide-react";

interface TransactionItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

interface Transaction {
  id: string;
  totalAmount: number;
  createdAt: string;
  customerName: string | null;
  note: string | null;
  items: TransactionItem[];
}

function formatMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTime(s: string) {
  return new Date(s).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function formatThaiDate() {
  return new Date().toLocaleDateString("th-TH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default function StaffHistory() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const todayTotal = transactions.reduce((s, t) => s + t.totalAmount, 0);

  useEffect(() => {
    const date = new Date().toISOString().split("T")[0];
    fetch(`/api/transactions?date=${date}`)
      .then((r) => r.json())
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      {/* ── HEADER ── */}
      <div className="relative bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-500 pt-10 pb-14 px-5 overflow-hidden">
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/[0.06]" />
        <div className="absolute top-12 right-8 w-20 h-20 rounded-full bg-white/[0.06]" />

        <div className="relative flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/staff")}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-medium text-lg">ประวัติวันนี้</h1>
            <p className="text-blue-200 text-xs">{formatThaiDate()}</p>
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-2xl px-4 py-3.5">
            <p className="text-blue-200 text-xs mb-0.5">ยอดรวม</p>
            <p className="text-white font-medium text-xl tabular-nums">฿{formatMoney(todayTotal)}</p>
          </div>
          <div className="bg-white/15 rounded-2xl px-4 py-3.5">
            <p className="text-blue-200 text-xs mb-0.5">จำนวนรายการ</p>
            <p className="text-white font-medium text-xl">{transactions.length} รายการ</p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 390 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0 48 C97.5 0 292.5 0 390 48 L390 48 L0 48 Z" fill="#f4f6f9" />
          </svg>
        </div>
      </div>

      {/* ── LIST ── */}
      <div className="flex-1 px-4 pt-4 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm">กำลังโหลด...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-2xl py-14 flex flex-col items-center gap-2 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-1">
              <ClipboardList className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium text-sm">ยังไม่มีรายการวันนี้</p>
            <p className="text-gray-400 text-xs">กลับไปบันทึกรายการรับซื้อ</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((t, idx) => (
              <div key={t.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-medium shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    {t.customerName && (
                      <div className="flex items-center gap-1 mb-0.5">
                        <User className="w-3 h-3 text-gray-400 shrink-0" />
                        <p className="text-gray-900 text-sm font-medium truncate">{t.customerName}</p>
                      </div>
                    )}
                    <p className={`truncate ${t.customerName ? "text-gray-400 text-xs" : "text-gray-800 text-sm font-medium"}`}>
                      {t.items.map((i) => i.productName).join(", ")}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {formatTime(t.createdAt)} · {t.items.length} รายการ
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-green-600 font-medium text-sm tabular-nums">
                      ฿{formatMoney(t.totalAmount)}
                    </p>
                    <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${expandedId === t.id ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {expandedId === t.id && (
                  <div className="border-t border-gray-50 bg-gray-50 px-4 py-3">
                    <p className="text-gray-300 text-xs font-mono mb-2.5">#{t.id.slice(-8).toUpperCase()}</p>
                    <div className="space-y-2">
                      {t.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-700 text-sm font-medium">{item.productName}</p>
                            <p className="text-gray-400 text-xs">
                              {item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"} × ฿{item.unitPrice.toLocaleString()}
                            </p>
                          </div>
                          <p className="text-green-600 text-sm font-medium tabular-nums">
                            ฿{formatMoney(item.subtotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-200 flex justify-between">
                      <p className="text-gray-500 text-sm font-medium">รวม</p>
                      <p className="text-green-600 font-medium tabular-nums">฿{formatMoney(t.totalAmount)}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
