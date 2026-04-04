"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Banknote, ChevronLeft, ChevronRight, ChevronDown, TrendingUp, ShoppingBag, Package, Users, Tag } from "lucide-react";

interface PriceGroupStat {
  id: string; name: string; color: string | null;
  amount: number; count: number; customerCount: number;
}
interface DailyReport {
  date: string;
  totalAmount: number;
  totalTransactions: number;
  categoryBreakdown: { name: string; amount: number; quantity: number }[];
  productBreakdown: { name: string; unit: string; amount: number; quantity: number }[];
  staffBreakdown: { name: string; amount: number; count: number }[];
  priceGroupBreakdown: PriceGroupStat[];
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
function localDateString(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return localDateString(d);
}
function isToday(dateStr: string) {
  return dateStr === localDateString();
}

const BAR_COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7"];

export default function OwnerDashboard() {
  const [daily, setDaily] = useState<DailyReport | null>(null);
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [prevMonthTotal, setPrevMonthTotal] = useState<number | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const [date, setDate] = useState(() => localDateString());
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); setShowAllProducts(false); }, [date]);

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
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="flex items-center gap-2 px-2 py-2">
          <button onClick={prevDay}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-500 active:bg-gray-100 transition-colors shrink-0 bg-gray-50">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center py-1">
            <p className="text-gray-800 font-semibold text-sm leading-tight">{formatDateThai(date)}</p>
            {isToday(date) && (
              <span className="inline-block mt-1 text-[11px] bg-emerald-100 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full">วันนี้</span>
            )}
          </div>
          <button onClick={nextDay} disabled={isToday(date)}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-500 active:bg-gray-100 disabled:opacity-30 transition-colors shrink-0 bg-gray-50">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {!isToday(date) && (
          <button onClick={() => setDate(localDateString())}
            className="w-full py-2.5 text-center text-emerald-600 text-xs font-semibold border-t border-gray-50 active:bg-emerald-50 transition-colors">
            กลับไปวันนี้ →
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
            style={{ background: "linear-gradient(135deg, #22c55e 0%, #10b981 50%, #0ea5e9 100%)", boxShadow: "0 10px 32px rgba(16,185,129,0.3), 0 2px 8px rgba(14,165,233,0.18)" }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full" style={{ background: "rgba(14,165,233,0.2)" }} />
            <div className="absolute top-1/2 right-16 w-16 h-16 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />

            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.22)" }}>
                  <Banknote className="w-4 h-4 text-white" />
                </div>
                <p className="text-white/80 text-sm font-semibold">ยอดรับซื้อวันนี้</p>
              </div>
              {daily?.totalAmount !== undefined ? (
                <p className="text-white font-bold tabular-nums leading-none" style={{ fontSize: "3.2rem" }}>
                  ฿{formatMoney(daily.totalAmount)}
                </p>
              ) : (
                <p className="text-white/50 text-4xl font-bold">฿0</p>
              )}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}>
                  <ShoppingBag className="w-4 h-4 text-white/80 shrink-0" />
                  <div>
                    <p className="text-white text-xl font-bold leading-none">{daily?.totalTransactions ?? 0}</p>
                    <p className="text-white/60 text-xs mt-0.5">รายการ</p>
                  </div>
                </div>
                {daily && daily.totalTransactions > 0 && (
                  <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}>
                    <TrendingUp className="w-4 h-4 text-white/80 shrink-0" />
                    <div>
                      <p className="text-white text-xl font-bold leading-none tabular-nums">
                        ฿{formatMoney(daily.totalAmount / daily.totalTransactions)}
                      </p>
                      <p className="text-white/60 text-xs mt-0.5">เฉลี่ย/บิล</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Month summary + comparison ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: ยอดเดือนนี้ */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-emerald-50">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
                  <Banknote className="w-3 h-3 text-emerald-600" />
                </div>
                <p className="text-gray-400 text-xs font-medium">ยอดเดือนนี้</p>
              </div>
              <p className="text-emerald-700 font-bold text-xl tabular-nums leading-tight break-all">
                ฿{formatMoney(monthly?.totalAmount ?? 0)}
              </p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {prevMonthTotal !== null && prevMonthTotal > 0 && (monthly?.totalAmount ?? 0) > 0 && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                    (monthly?.totalAmount ?? 0) >= prevMonthTotal
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {(monthly?.totalAmount ?? 0) >= prevMonthTotal ? "▲" : "▼"}
                    {Math.abs(Math.round(((monthly?.totalAmount ?? 0) / prevMonthTotal - 1) * 100))}%
                  </span>
                )}
                <p className="text-gray-400 text-xs">{monthly?.totalTransactions ?? 0} รายการ</p>
              </div>
            </div>
            {/* Card 2: เฉลี่ยต่อวัน */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-sky-50">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-md bg-sky-100 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-sky-600" />
                </div>
                <p className="text-gray-400 text-xs font-medium">เฉลี่ยต่อวัน</p>
              </div>
              <p className="text-sky-700 font-bold text-xl tabular-nums leading-tight break-all">
                ฿{monthly && monthly.totalTransactions > 0
                  ? formatMoney(monthly.totalAmount / (monthly.dailyData.filter((d) => d.amount > 0).length || 1))
                  : "0"}
              </p>
              {prevMonthTotal !== null && prevMonthTotal > 0 && (
                <p className="text-gray-400 text-xs mt-2">เดือนก่อน ฿{formatMoney(prevMonthTotal)}</p>
              )}
            </div>
          </div>

          {/* ── Products sold today ── */}
          {daily && daily.productBreakdown.length > 0 && (() => {
            const LIMIT = 10;
            const all = daily.productBreakdown;
            const shown = showAllProducts ? all : all.slice(0, LIMIT);
            const hidden = all.length - LIMIT;
            const topAmount = all[0]?.amount ?? 1;
            return (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="px-4 py-3.5 border-b border-gray-50 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #10b981, #0ea5e9)" }}>
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-gray-800 font-semibold text-sm flex-1">สินค้าที่รับซื้อ</p>
                  <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-100">{all.length} รายการ</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {shown.map((p, i) => {
                    const barPct = topAmount > 0 ? (p.amount / topAmount) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 text-emerald-700"
                          style={{ background: i === 0 ? "linear-gradient(135deg, #d1fae5, #a7f3d0)" : "#f9fafb" }}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-gray-800 font-semibold text-sm truncate">{p.name}</p>
                            <p className="font-bold text-sm tabular-nums shrink-0 text-emerald-700">
                              ฿{formatMoney(p.amount)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${barPct}%`, background: "linear-gradient(90deg, #10b981, #0ea5e9)" }} />
                            </div>
                            <p className="text-gray-400 text-xs shrink-0">{p.quantity} {p.unit === "KG" ? "กก." : "ชิ้น"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {all.length > LIMIT && (
                  <button onClick={() => setShowAllProducts(v => !v)}
                    className="w-full py-3 border-t border-dashed border-gray-200 text-sm font-medium text-gray-500 active:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAllProducts ? "rotate-180" : ""}`} />
                    {showAllProducts ? "แสดงน้อยลง" : `ดูเพิ่มเติม ${hidden} รายการ`}
                  </button>
                )}
                <div className="flex justify-between items-center px-4 py-3.5 border-t border-emerald-100 rounded-b-2xl"
                  style={{ background: "linear-gradient(90deg, #f0fdf4, #ecfeff)" }}>
                  <p className="text-emerald-700 font-semibold text-sm">รวมทั้งหมด</p>
                  <p className="text-emerald-700 font-bold text-xl tabular-nums">฿{formatMoneyFull(daily.totalAmount)}</p>
                </div>
              </div>
            );
          })()}

          {/* ── Category breakdown (today) ── */}
          {daily && daily.categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #22c55e, #10b981)" }}>
                  <Package className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-800 font-semibold text-sm">ยอดตามหมวดหมู่</p>
              </div>
              <div className="space-y-3">
                {daily.categoryBreakdown.map((c, i) => {
                  const pct = daily.totalAmount > 0 ? (c.amount / daily.totalAmount) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-gray-700 text-sm font-medium">{c.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">{Math.round(pct)}%</span>
                          <p className="text-emerald-700 text-sm tabular-nums font-bold">฿{formatMoney(c.amount)}</p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Staff breakdown (today) ── */}
          {daily && daily.staffBreakdown && daily.staffBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
                  <Users className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-800 font-semibold text-sm">ยอดตามพนักงาน</p>
              </div>
              <div className="space-y-3">
                {daily.staffBreakdown.map((s, i) => {
                  const pct = daily.totalAmount > 0 ? (s.amount / daily.totalAmount) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 text-white"
                            style={{ background: `linear-gradient(135deg, ${["#10b981","#0ea5e9","#6366f1","#f59e0b","#ec4899"][i % 5]}, ${["#0ea5e9","#6366f1","#f59e0b","#ec4899","#10b981"][i % 5]})` }}>
                            {s.name.charAt(0)}
                          </div>
                          <p className="text-gray-700 text-sm font-semibold">{s.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sky-700 text-sm font-bold tabular-nums">฿{formatMoney(s.amount)}</p>
                          <p className="text-gray-400 text-xs">{s.count} บิล</p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #0ea5e9, #6366f1)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Price group breakdown (today) ── */}
          {daily && daily.priceGroupBreakdown && daily.priceGroupBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-800 font-semibold text-sm">ยอดตามกลุ่มราคา</p>
              </div>
              <div className="space-y-3">
                {daily.priceGroupBreakdown.map((g, i) => {
                  const topAmt = daily.priceGroupBreakdown[0]?.amount ?? 1;
                  const barPct = topAmt > 0 ? (g.amount / topAmt) * 100 : 0;
                  const totalPct = daily.totalAmount > 0 ? (g.amount / daily.totalAmount) * 100 : 0;
                  const isNone = g.id === "__none__";
                  const groupColor = isNone ? "#9ca3af" : (g.color ?? "#16a34a");
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 text-white"
                          style={{ background: groupColor }}>
                          {isNone ? "—" : g.name}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-1">
                            <p className="text-gray-700 text-sm font-semibold truncate">
                              {isNone ? "ราคาปกติ" : `กลุ่ม ${g.name}`}
                            </p>
                            <div className="text-right shrink-0">
                              <p className="text-gray-800 text-sm font-bold tabular-nums">฿{formatMoney(g.amount)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs">{g.count} บิล</span>
                            {g.customerCount > 0 && <span className="text-gray-400 text-xs">· {g.customerCount} คน</span>}
                            <span className="text-gray-400 text-xs ml-auto">{Math.round(totalPct)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-10">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${barPct}%`, background: groupColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Monthly trend bar chart ── */}
          {monthly && monthly.dailyData.some((d) => d.amount > 0) && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #10b981, #0ea5e9)" }} />
                <p className="text-gray-700 font-semibold text-sm">ยอดรายวัน (เดือนนี้)</p>
              </div>
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
                      <Bar dataKey="amount" radius={[5, 5, 0, 0]} maxBarSize={20} fill="#10b981" />
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
