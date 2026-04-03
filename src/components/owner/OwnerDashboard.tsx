"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Banknote, ChevronLeft, ChevronRight, TrendingUp, ShoppingBag, Package, Users } from "lucide-react";

interface DailyReport {
  date: string;
  totalAmount: number;
  totalTransactions: number;
  categoryBreakdown: { name: string; amount: number; quantity: number }[];
  productBreakdown: { name: string; unit: string; amount: number; quantity: number }[];
  staffBreakdown: { name: string; amount: number; count: number }[];
}

interface MonthlyReport {
  totalAmount: number;
  totalTransactions: number;
  dailyData: { date: string; amount: number; count: number }[];
  categoryBreakdown: { name: string; amount: number }[];
  monthlyTrend: { month: string; amount: number }[];
}

function formatMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function formatMoneyFull(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDateThai(s: string) {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().split("T")[0];
}

const CAT_COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

export default function OwnerDashboard() {
  const [daily, setDaily] = useState<DailyReport | null>(null);
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [prevMonthTotal, setPrevMonthTotal] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [date]);

  const load = async () => {
    setLoading(true);
    const d = new Date(date + "T00:00:00");
    const prevMonth = d.getMonth() === 0
      ? { year: d.getFullYear() - 1, month: 12 }
      : { year: d.getFullYear(), month: d.getMonth() };
    const [dr, mr, pmr] = await Promise.all([
      fetch(`/api/reports/daily?date=${date}`).then((r) => r.json()),
      fetch(`/api/reports/monthly?year=${d.getFullYear()}&month=${d.getMonth() + 1}`).then((r) => r.json()),
      fetch(`/api/reports/monthly?year=${prevMonth.year}&month=${prevMonth.month}`).then((r) => r.json()),
    ]);
    setDaily(dr);
    setMonthly(mr);
    setPrevMonthTotal(pmr.totalAmount ?? 0);
    setLoading(false);
  };

  const prevDay = () => setDate(addDays(date, -1));
  const nextDay = () => { if (!isToday(date)) setDate(addDays(date, 1)); };

  return (
    <div className="space-y-4">

      {/* ── Date navigator ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center">
          <button
            onClick={prevDay}
            className="flex items-center justify-center w-14 h-14 text-gray-400 active:bg-gray-50 transition-colors shrink-0"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 text-center py-3">
            <p className="text-gray-800 font-semibold text-base leading-tight">{formatDateThai(date)}</p>
            {isToday(date) && (
              <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 font-medium px-2.5 py-0.5 rounded-full">วันนี้</span>
            )}
          </div>
          <button
            onClick={nextDay}
            disabled={isToday(date)}
            className="flex items-center justify-center w-14 h-14 text-gray-400 active:bg-gray-50 disabled:opacity-30 transition-colors shrink-0"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
        {/* Quick jump to today */}
        {!isToday(date) && (
          <button
            onClick={() => setDate(new Date().toISOString().split("T")[0])}
            className="w-full py-2.5 text-center text-green-600 text-sm font-medium border-t border-gray-50 active:bg-green-50 transition-colors"
          >
            กลับไปวันนี้
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">กำลังโหลด...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Hero: Today's Total ── */}
          <div
            className="relative rounded-3xl overflow-hidden px-6 py-6"
            style={{ background: "linear-gradient(135deg, #166534 0%, #16a34a 100%)" }}
          >
            <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-white/[0.07]" />
            <div className="absolute bottom-0 -left-4 w-28 h-28 rounded-full bg-black/[0.08]" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Banknote className="w-5 h-5 text-green-300" />
                <p className="text-green-100 text-base font-medium">ยอดรับซื้อ</p>
              </div>
              {daily?.totalAmount !== undefined ? (
                <p className="text-white font-bold tabular-nums leading-none" style={{ fontSize: "3.2rem" }}>
                  ฿{formatMoney(daily.totalAmount)}
                </p>
              ) : (
                <p className="text-white/50 text-4xl font-bold">฿0</p>
              )}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-4 py-2">
                  <ShoppingBag className="w-4 h-4 text-green-200 shrink-0" />
                  <div>
                    <p className="text-white text-xl font-bold leading-none">{daily?.totalTransactions ?? 0}</p>
                    <p className="text-green-200 text-xs mt-0.5">รายการ</p>
                  </div>
                </div>
                {daily && daily.totalTransactions > 0 && (
                  <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-4 py-2">
                    <TrendingUp className="w-4 h-4 text-green-200 shrink-0" />
                    <div>
                      <p className="text-white text-xl font-bold leading-none tabular-nums">
                        ฿{formatMoney(daily.totalAmount / daily.totalTransactions)}
                      </p>
                      <p className="text-green-200 text-xs mt-0.5">เฉลี่ย/บิล</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Month summary + comparison ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-gray-400 text-sm mb-1">ยอดเดือนนี้</p>
              <p className="text-amber-600 font-bold text-2xl tabular-nums leading-tight">
                ฿{formatMoney(monthly?.totalAmount ?? 0)}
              </p>
              {prevMonthTotal !== null && prevMonthTotal > 0 && (monthly?.totalAmount ?? 0) > 0 && (
                <div className="mt-1.5 flex items-center gap-1">
                  {(monthly?.totalAmount ?? 0) >= prevMonthTotal ? (
                    <span className="text-xs bg-green-100 text-green-700 font-medium px-1.5 py-0.5 rounded-lg">
                      +{Math.round(((monthly?.totalAmount ?? 0) / prevMonthTotal - 1) * 100)}% vs เดือนก่อน
                    </span>
                  ) : (
                    <span className="text-xs bg-red-50 text-red-500 font-medium px-1.5 py-0.5 rounded-lg">
                      {Math.round(((monthly?.totalAmount ?? 0) / prevMonthTotal - 1) * 100)}% vs เดือนก่อน
                    </span>
                  )}
                </div>
              )}
              <p className="text-gray-400 text-xs mt-1">{monthly?.totalTransactions ?? 0} รายการ</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-gray-400 text-sm mb-1">เฉลี่ยต่อวัน</p>
              <p className="text-blue-600 font-bold text-2xl tabular-nums leading-tight">
                ฿{monthly && monthly.totalTransactions > 0
                  ? formatMoney(monthly.totalAmount / (monthly.dailyData.filter((d) => d.amount > 0).length || 1))
                  : "0"}
              </p>
              {prevMonthTotal !== null && prevMonthTotal > 0 && (
                <p className="text-gray-400 text-xs mt-1">เดือนก่อน ฿{formatMoney(prevMonthTotal)}</p>
              )}
            </div>
          </div>

          {/* ── Products sold today ── */}
          {daily && daily.productBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-50 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <p className="text-gray-700 font-semibold text-sm">สินค้าที่รับซื้อ</p>
              </div>
              <div className="divide-y divide-gray-50">
                {daily.productBreakdown.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <span
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: `${CAT_COLORS[i % CAT_COLORS.length]}18`, color: CAT_COLORS[i % CAT_COLORS.length] }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium text-base truncate">{p.name}</p>
                      <p className="text-gray-400 text-sm">{p.quantity} {p.unit === "KG" ? "กก." : "ชิ้น"}</p>
                    </div>
                    <p className="text-green-600 font-bold text-base tabular-nums shrink-0">฿{formatMoney(p.amount)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center px-4 py-3.5 bg-green-50 border-t border-green-100">
                <p className="text-green-700 font-semibold text-base">รวมทั้งหมด</p>
                <p className="text-green-700 font-bold text-xl tabular-nums">฿{formatMoneyFull(daily.totalAmount)}</p>
              </div>
            </div>
          )}

          {/* ── Category breakdown (today) ── */}
          {daily && daily.categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-gray-700 font-semibold text-sm mb-3">ยอดตามหมวดหมู่</p>
              <div className="space-y-2.5">
                {daily.categoryBreakdown.map((c, i) => {
                  const pct = daily.totalAmount > 0 ? (c.amount / daily.totalAmount) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-gray-700 text-sm font-medium">{c.name}</p>
                        <p className="text-gray-600 text-sm tabular-nums font-semibold">฿{formatMoney(c.amount)}</p>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: CAT_COLORS[i % CAT_COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Staff breakdown (today) ── */}
          {daily && daily.staffBreakdown && daily.staffBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-400" />
                <p className="text-gray-700 font-semibold text-sm">ยอดตามพนักงาน</p>
              </div>
              <div className="space-y-3">
                {daily.staffBreakdown.map((s, i) => {
                  const pct = daily.totalAmount > 0 ? (s.amount / daily.totalAmount) * 100 : 0;
                  const colors = ["#16a34a", "#2563eb", "#d97706", "#7c3aed"];
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: colors[i % colors.length] }}
                          >
                            {s.name.charAt(0)}
                          </div>
                          <p className="text-gray-700 text-sm font-medium">{s.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-700 text-sm font-semibold tabular-nums">฿{formatMoney(s.amount)}</p>
                          <p className="text-gray-400 text-xs">{s.count} บิล</p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Monthly trend bar chart ── */}
          {monthly && monthly.dailyData.some((d) => d.amount > 0) && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-gray-700 font-semibold text-sm mb-3">ยอดรายวัน (เดือนนี้)</p>
              <div className="overflow-x-auto -mx-1">
                <div style={{ minWidth: Math.max(monthly.dailyData.length * 22, 280) }} className="px-1">
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={monthly.dailyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => new Date(v + "T00:00:00").getDate().toString()}
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        width={32}
                      />
                      <Tooltip
                        formatter={(v) => [`฿${formatMoneyFull(Number(v))}`, "ยอด"]}
                        labelFormatter={(l) => new Date(String(l) + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                        contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: 13 }}
                      />
                      <Bar
                        dataKey="amount"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                        fill="#16a34a"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {daily && daily.totalTransactions === 0 && (
            <div className="bg-white rounded-2xl py-16 text-center shadow-sm">
              <ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold text-lg">ไม่มีรายการ</p>
              <p className="text-gray-400 text-sm mt-1">วันนี้ยังไม่มีการรับซื้อ</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
