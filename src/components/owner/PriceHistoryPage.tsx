"use client";

import { useState, useEffect } from "react";
import { History, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";

interface PriceChange {
  id: string;
  oldPrice: number;
  newPrice: number;
  changedAt: string;
  product: {
    name: string;
    unit: string;
    category: { name: string };
  };
}

function formatMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function localDateString(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatThaiDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("th-TH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}
function isToday(dateStr: string) {
  return dateStr === localDateString();
}
function isYesterday(dateStr: string) {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateStr === localDateString(d);
}
function dateLabel(dateStr: string) {
  if (isToday(dateStr)) return "วันนี้";
  if (isYesterday(dateStr)) return "เมื่อวาน";
  return formatThaiDate(dateStr);
}

const DAYS_OPTIONS = [7, 14, 30, 90];

export default function PriceHistoryPage() {
  const [history, setHistory] = useState<PriceChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => { load(); }, [days]);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/price-history?days=${days}`);
    if (res.ok) setHistory(await res.json());
    setLoading(false);
  };

  // Group by local date
  const groups: Record<string, PriceChange[]> = {};
  history.forEach((h) => {
    const d = localDateString(new Date(h.changedAt));
    if (!groups[d]) groups[d] = [];
    groups[d].push(h);
  });
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const totalChanges = history.length;
  const priceUp = history.filter(h => h.newPrice > h.oldPrice).length;
  const priceDown = history.filter(h => h.newPrice < h.oldPrice).length;

  return (
    <div className="space-y-4">

      {/* ── Period selector ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gray-400 text-xs font-medium mr-1">ย้อนหลัง</span>
        {DAYS_OPTIONS.map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              days === d ? "text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200"
            }`}
            style={days === d ? { background: "linear-gradient(135deg, #10b981, #0ea5e9)" } : {}}>
            {d} วัน
          </button>
        ))}
      </div>

      {/* ── Summary cards ── */}
      {!loading && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-gray-100 text-center">
            <div className="w-7 h-7 rounded-xl mx-auto mb-2 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <History className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800 tabular-nums">{totalChanges}</p>
            <p className="text-gray-400 text-xs mt-0.5">ครั้งทั้งหมด</p>
          </div>
          <div className="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-emerald-50 text-center">
            <div className="w-7 h-7 rounded-xl mx-auto mb-2 flex items-center justify-center bg-emerald-100">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{priceUp}</p>
            <p className="text-gray-400 text-xs mt-0.5">ราคาขึ้น</p>
          </div>
          <div className="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-red-50 text-center">
            <div className="w-7 h-7 rounded-xl mx-auto mb-2 flex items-center justify-center bg-red-50">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400 tabular-nums">{priceDown}</p>
            <p className="text-gray-400 text-xs mt-0.5">ราคาลง</p>
          </div>
        </div>
      )}

      {/* ── History list ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <div className="w-7 h-7 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm">กำลังโหลด...</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-white rounded-2xl py-16 text-center shadow-sm border border-gray-100">
          <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">ไม่มีการเปลี่ยนแปลงราคา</p>
          <p className="text-gray-400 text-sm mt-1">ใน {days} วันที่ผ่านมา</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: isToday(date) ? "linear-gradient(135deg, #10b981, #0ea5e9)" : "#f3f4f6" }}>
                  <Calendar className={`w-3.5 h-3.5 ${isToday(date) ? "text-white" : "text-gray-400"}`} />
                </div>
                <p className={`text-sm font-bold ${isToday(date) ? "text-emerald-700" : "text-gray-600"}`}>
                  {dateLabel(date)}
                </p>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                  {groups[date].length} รายการ
                </span>
              </div>

              {/* Changes */}
              <div className="space-y-2">
                {groups[date].map((h) => {
                  const diff = h.newPrice - h.oldPrice;
                  const isUp = diff > 0;
                  const isDown = diff < 0;
                  const pct = h.oldPrice > 0 ? Math.abs(diff / h.oldPrice * 100) : 0;
                  return (
                    <div key={h.id} className="bg-white rounded-2xl shadow-sm overflow-hidden"
                      style={{ border: `1px solid ${isUp ? "#d1fae5" : isDown ? "#fee2e2" : "#f3f4f6"}` }}>
                      <div className="flex items-stretch">
                        {/* Accent bar */}
                        <div className="w-1 shrink-0 rounded-l-2xl"
                          style={{ background: isUp ? "#10b981" : isDown ? "#ef4444" : "#9ca3af" }} />
                        <div className="flex-1 px-4 py-3.5">
                          <div className="flex items-start justify-between gap-3">
                            {/* Product info */}
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 text-sm leading-tight">{h.product.name}</p>
                              <p className="text-gray-400 text-xs mt-0.5">
                                {h.product.category.name} · {h.product.unit === "KG" ? "กก." : "ชิ้น"}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                {new Date(h.changedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                              </p>
                            </div>
                            {/* Price change */}
                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-1.5 justify-end mb-1">
                                <span className="text-gray-400 text-xs line-through tabular-nums">
                                  ฿{formatMoney(h.oldPrice)}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className={`font-bold text-base tabular-nums ${isUp ? "text-emerald-600" : isDown ? "text-red-500" : "text-gray-600"}`}>
                                  ฿{formatMoney(h.newPrice)}
                                </span>
                              </div>
                              {/* Change indicator */}
                              <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${isUp ? "text-emerald-600" : isDown ? "text-red-500" : "text-gray-400"}`}>
                                {isUp ? <TrendingUp className="w-3.5 h-3.5" />
                                  : isDown ? <TrendingDown className="w-3.5 h-3.5" />
                                  : <Minus className="w-3.5 h-3.5" />}
                                <span>
                                  {isUp ? "+" : isDown ? "-" : ""}{formatMoney(Math.abs(diff))}
                                  {pct > 0 && ` (${pct.toFixed(0)}%)`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
