"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Download, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar, CalendarDays, BarChart2, X, User, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TransactionItem {
  id: string; productName: string; quantity: number; unit: string; subtotal: number;
}
interface Transaction {
  id: string; totalAmount: number; customerName?: string; createdAt: string;
  staff: { name: string }; items: TransactionItem[];
}
interface PeriodReport {
  startDate: string; endDate: string;
  totalAmount: number; totalTransactions: number;
  dailyData: { date: string; amount: number; count: number }[];
  categoryBreakdown: { name: string; amount: number; quantity: number }[];
  productBreakdown: { name: string; unit: string; amount: number; quantity: number }[];
  staffBreakdown: { name: string; amount: number; count: number }[];
  transactions: Transaction[];
}

type Period = "day" | "week" | "month";

function formatMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatTime(s: string) {
  return new Date(s).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}
function formatDateShort(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}
function localDateString(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return localDateString(d);
}
function addMonths(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return localDateString(d);
}
function isToday(dateStr: string) {
  return dateStr === localDateString();
}
function getWeekRange(anchor: string) {
  const d = new Date(anchor + "T00:00:00");
  const day = d.getDay(); // 0=Sun
  const mon = new Date(d); mon.setDate(d.getDate() - ((day + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return {
    startDate: mon.toISOString().split("T")[0],
    endDate: sun.toISOString().split("T")[0],
  };
}
function getMonthRange(anchor: string) {
  const d = new Date(anchor + "T00:00:00");
  const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  return { startDate: start, endDate: end };
}
function periodLabel(period: Period, anchor: string) {
  if (period === "day") {
    const d = new Date(anchor + "T00:00:00");
    return d.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }
  if (period === "week") {
    const { startDate, endDate } = getWeekRange(anchor);
    return `${formatDateShort(startDate)} – ${formatDateShort(endDate)}`;
  }
  // month
  const d = new Date(anchor + "T00:00:00");
  return d.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
}

const COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const BGCOLORS = ["#dcfce7", "#dbeafe", "#fef3c7", "#fee2e2", "#ede9fe", "#cffafe"];

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("day");
  const [anchor, setAnchor] = useState(() => localDateString());
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [drillExpandedId, setDrillExpandedId] = useState<string | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);

  useEffect(() => { load(); setShowAllProducts(false); setShowAllTx(false); }, [period, anchor]);

  const getRange = () => {
    if (period === "day") return { startDate: anchor, endDate: anchor };
    if (period === "week") return getWeekRange(anchor);
    return getMonthRange(anchor);
  };

  const load = async () => {
    setLoading(true);
    setExpandedId(null);
    setSelectedProduct(null);
    const { startDate, endDate } = getRange();
    const r = await fetch(`/api/reports/period?startDate=${startDate}&endDate=${endDate}`);
    setReport(await r.json());
    setLoading(false);
  };

  const goBack = () => {
    if (period === "day") setAnchor(addDays(anchor, -1));
    else if (period === "week") setAnchor(addDays(anchor, -7));
    else setAnchor(addMonths(anchor, -1));
  };
  const goForward = () => {
    const today = new Date().toISOString().split("T")[0];
    let next: string;
    if (period === "day") next = addDays(anchor, 1);
    else if (period === "week") next = addDays(anchor, 7);
    else next = addMonths(anchor, 1);
    if (next <= today) setAnchor(next);
  };
  const isAtToday = () => {
    if (period === "day") return isToday(anchor);
    if (period === "week") return getWeekRange(new Date().toISOString().split("T")[0]).startDate === getWeekRange(anchor).startDate;
    return getMonthRange(new Date().toISOString().split("T")[0]).startDate === getMonthRange(anchor).startDate;
  };
  const goToToday = () => setAnchor(new Date().toISOString().split("T")[0]);

  const handleExport = () => {
    if (!report) return;
    let csv = "เลขที่,วันที่,เวลา,พนักงาน,ลูกค้า,สินค้า,จำนวน,หน่วย,ยอดเงิน\n";
    report.transactions.forEach((t) => {
      const d = new Date(t.createdAt).toLocaleDateString("th-TH");
      t.items.forEach((item) => {
        csv += `${t.id.slice(-8)},${d},${formatTime(t.createdAt)},${t.staff.name},${t.customerName ?? ""},${item.productName},${item.quantity},${item.unit === "KG" ? "กก." : "ชิ้น"},${item.subtotal}\n`;
      });
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `รายงาน_${report.startDate}_${report.endDate}.csv`;
    a.click();
  };

  const atToday = isAtToday();

  return (
    <div className="space-y-4">
      {/* ── Period tabs ── */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm flex gap-1">
        {([
          { key: "day",   label: "รายวัน",     icon: Calendar },
          { key: "week",  label: "รายสัปดาห์", icon: CalendarDays },
          { key: "month", label: "รายเดือน",   icon: BarChart2 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setPeriod(key); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              period === key
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-600 active:bg-gray-50"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Date navigator ── */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-4 shadow-lg shadow-blue-600/20">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/80 text-sm font-medium">ช่วงเวลา</p>
          <button
            onClick={handleExport}
            disabled={!report || report.totalTransactions === 0}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-40 text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goBack}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/20 text-white active:bg-white/30 shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 bg-white/20 rounded-xl px-3 py-2.5 text-center">
            <p className="text-white text-sm font-semibold leading-tight">{periodLabel(period, anchor)}</p>
          </div>
          <button onClick={goForward} disabled={atToday}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/20 text-white active:bg-white/30 disabled:opacity-30 shrink-0">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {!atToday && (
          <button onClick={goToToday}
            className="mt-2 w-full py-2 text-center text-white/80 text-xs font-medium bg-white/10 rounded-xl active:bg-white/20 transition-colors">
            กลับมาปัจจุบัน
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">กำลังโหลด...</p>
          </div>
        </div>
      ) : !report ? null : (
        <>
          {/* ── Summary tiles ── */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "ยอดรวม", color: "text-green-600", border: "border-t-green-500",
                value: `฿${report.totalAmount >= 1000 ? `${(report.totalAmount / 1000).toFixed(1)}k` : formatMoney(report.totalAmount)}` },
              { label: "รายการ", color: "text-blue-600", border: "border-t-blue-500",
                value: `${report.totalTransactions}` },
              { label: "เฉลี่ย/บิล", color: "text-orange-500", border: "border-t-orange-500",
                value: `฿${report.totalTransactions > 0 ? (report.totalAmount / report.totalTransactions >= 1000 ? `${(report.totalAmount / report.totalTransactions / 1000).toFixed(1)}k` : formatMoney(report.totalAmount / report.totalTransactions)) : "0"}` },
            ].map((tile) => (
              <div key={tile.label} className={`bg-white rounded-2xl px-2.5 py-3 shadow-sm border border-gray-100 border-t-4 ${tile.border} min-w-0`}>
                <p className="text-gray-400 text-xs leading-tight mb-1 truncate">{tile.label}</p>
                <p className={`${tile.color} font-bold text-base tabular-nums leading-tight break-all`}>{tile.value}</p>
              </div>
            ))}
          </div>

          {/* ── Daily chart (for week/month) ── */}
          {period !== "day" && report.dailyData.some((d) => d.amount > 0) && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                ยอดรายวัน ({period === "week" ? "รายสัปดาห์" : "รายเดือน"})
              </p>
              <div className="overflow-x-auto -mx-1">
                <div style={{ minWidth: Math.max(report.dailyData.length * 28, 280) }} className="px-1">
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={report.dailyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(v) => formatDateShort(v)}
                        tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                        tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip
                        formatter={(v) => [`฿${formatMoney(Number(v))}`, "ยอด"]}
                        labelFormatter={(l) => formatDateShort(String(l))}
                        contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: 13 }}
                      />
                      <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── Category breakdown ── */}
          {report.categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3">ยอดตามหมวดหมู่</p>
              <ResponsiveContainer width="100%" height={report.categoryBreakdown.length * 44 + 20}>
                <BarChart data={report.categoryBreakdown} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => v >= 1000 ? `฿${(v / 1000).toFixed(0)}k` : `฿${v}`}
                    tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }}
                    width={72} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`฿${formatMoney(Number(v))}`, "ยอด"]}
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: 13 }} />
                  <Bar dataKey="amount" fill="#16a34a" radius={[0, 6, 6, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Staff breakdown ── */}
          {report.staffBreakdown && report.staffBreakdown.length > 1 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3">ยอดตามพนักงาน</p>
              <div className="space-y-2.5">
                {report.staffBreakdown.map((s, i) => {
                  const pct = report.totalAmount > 0 ? (s.amount / report.totalAmount) * 100 : 0;
                  const colors = ["#16a34a", "#2563eb", "#d97706", "#7c3aed"];
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-gray-700 text-sm font-medium">{s.name}</p>
                        <div className="text-right">
                          <p className="text-gray-700 text-sm font-semibold tabular-nums">฿{formatMoney(s.amount)}</p>
                          <p className="text-gray-400 text-xs">{s.count} บิล</p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Product breakdown (clickable) ── */}
          {report.productBreakdown.length > 0 && (() => {
            const LIMIT = 10;
            const all = report.productBreakdown;
            const shown = showAllProducts ? all : all.slice(0, LIMIT);
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">รายการสินค้า</p>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{all.length} ชนิด</span>
                </div>
                <p className="text-xs text-gray-400 px-4 pt-2.5">กดสินค้าเพื่อดูรายละเอียดบิล</p>
                <div className="divide-y divide-gray-50 mt-1">
                  {shown.map((p, i) => (
                    <button key={i} onClick={() => { setSelectedProduct(p.name); setDrillExpandedId(null); }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-blue-50 hover:bg-gray-50 transition-colors">
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: BGCOLORS[i % BGCOLORS.length], color: COLORS[i % COLORS.length] }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm leading-tight">{p.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{p.quantity} {p.unit === "KG" ? "กก." : "ชิ้น"}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="font-bold tabular-nums text-sm" style={{ color: COLORS[i % COLORS.length] }}>฿{formatMoney(p.amount)}</p>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </button>
                  ))}
                </div>
                {all.length > LIMIT && (
                  <button onClick={() => setShowAllProducts(v => !v)}
                    className="w-full py-3 border-t border-dashed border-gray-200 text-sm font-medium text-gray-500 active:bg-gray-50 flex items-center justify-center gap-1.5">
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAllProducts ? "rotate-180" : ""}`} />
                    {showAllProducts ? "แสดงน้อยลง" : `ดูเพิ่มเติม ${all.length - LIMIT} รายการ`}
                  </button>
                )}
              </div>
            );
          })()}

          {/* ── Transaction list ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">รายการทั้งหมด</p>
              <span className="text-xs text-gray-400">{report.totalTransactions} รายการ</span>
            </div>
            {report.transactions.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-medium">ไม่มีรายการ</p>
                <p className="text-sm mt-1">ลองเลือกช่วงเวลาอื่น</p>
              </div>
            ) : (() => {
              const TX_LIMIT = 20;
              const allTx = report.transactions;
              const shownTx = showAllTx ? allTx : allTx.slice(0, TX_LIMIT);
              return (
                <>
                  <div className="divide-y divide-gray-50">
                    {shownTx.map((t) => (
                      <div key={t.id}>
                        <button
                          onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                          className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-gray-50 transition-colors"
                        >
                          <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg shrink-0">
                            #{t.id.slice(-5).toUpperCase()}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-gray-500 text-xs">
                                {period !== "day" && `${new Date(t.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })} `}
                                {formatTime(t.createdAt)}
                              </span>
                              <span className="text-blue-500 text-xs">· {t.staff.name}</span>
                              {t.customerName && <span className="text-gray-400 text-xs">· {t.customerName}</span>}
                            </div>
                            <p className="text-sm text-gray-700 truncate mt-0.5">{t.items.map((i) => i.productName).join(", ")}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-green-600 font-semibold text-sm tabular-nums">฿{formatMoney(t.totalAmount)}</span>
                            {expandedId === t.id ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                          </div>
                        </button>
                        {expandedId === t.id && (
                          <div className="bg-gray-50 px-4 pb-3 pt-1 space-y-2">
                            {t.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{item.productName}</span>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-gray-400">{item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"}</span>
                                  <span className="text-green-600 font-medium tabular-nums">฿{formatMoney(item.subtotal)}</span>
                                </div>
                              </div>
                            ))}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                              <span className="text-gray-500 text-xs font-medium">รวม</span>
                              <span className="text-green-700 font-medium tabular-nums">฿{formatMoney(t.totalAmount)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {allTx.length > TX_LIMIT && (
                    <button onClick={() => setShowAllTx(v => !v)}
                      className="w-full py-3 border-t border-dashed border-gray-200 text-sm font-medium text-gray-500 active:bg-gray-50 flex items-center justify-center gap-1.5">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAllTx ? "rotate-180" : ""}`} />
                      {showAllTx ? "แสดงน้อยลง" : `ดูเพิ่มเติม ${allTx.length - TX_LIMIT} บิล`}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* ── Product drill-down drawer ── */}
      {selectedProduct && report && (() => {
        const txns = report.transactions.filter((t) =>
          t.items.some((item) => item.productName === selectedProduct)
        );
        const totalQty = txns.reduce((s, t) => {
          const item = t.items.find((i) => i.productName === selectedProduct);
          return s + (item?.quantity ?? 0);
        }, 0);
        const totalAmt = txns.reduce((s, t) => {
          const item = t.items.find((i) => i.productName === selectedProduct);
          return s + (item?.subtotal ?? 0);
        }, 0);
        const unit = txns[0]?.items.find((i) => i.productName === selectedProduct)?.unit ?? "KG";
        return (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
              onClick={() => setSelectedProduct(null)}
            />
            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col"
              style={{ maxHeight: "82vh" }}>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">รายการสินค้า</p>
                  <p className="font-bold text-gray-900 text-lg leading-tight truncate">{selectedProduct}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                      ฿{formatMoney(totalAmt)}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                      {totalQty} {unit === "KG" ? "กก." : "ชิ้น"}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                      {txns.length} บิล
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 active:bg-gray-200"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Transaction list */}
              <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
                {txns.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <p className="text-sm">ไม่พบรายการ</p>
                  </div>
                ) : txns.map((t) => {
                  const prodItem = t.items.find((i) => i.productName === selectedProduct);
                  const isOpen = drillExpandedId === t.id;
                  return (
                    <div key={t.id}>
                      <button
                        onClick={() => setDrillExpandedId(isOpen ? null : t.id)}
                        className="w-full px-5 py-4 flex items-center gap-3 text-left active:bg-gray-50 transition-colors"
                      >
                        {/* Bill ID */}
                        <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg shrink-0">
                          #{t.id.slice(-5).toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          {/* Time + Staff */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                              <Clock className="w-3 h-3" />
                              {period !== "day" && `${new Date(t.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })} `}
                              {formatTime(t.createdAt)}
                            </div>
                            <div className="flex items-center gap-1 text-blue-500 text-xs font-medium">
                              <User className="w-3 h-3" />
                              {t.staff.name}
                            </div>
                            {t.customerName && (
                              <span className="text-gray-400 text-xs">· {t.customerName}</span>
                            )}
                          </div>
                          {/* This product qty */}
                          <p className="text-green-700 font-semibold text-sm mt-0.5">
                            {prodItem?.quantity} {prodItem?.unit === "KG" ? "กก." : "ชิ้น"} = ฿{formatMoney(prodItem?.subtotal ?? 0)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-gray-500 text-xs tabular-nums">฿{formatMoney(t.totalAmount)}</span>
                          {isOpen
                            ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                            : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                        </div>
                      </button>

                      {/* Expanded: full bill items */}
                      {isOpen && (
                        <div className="bg-blue-50 mx-4 mb-3 rounded-2xl px-4 py-3 space-y-2">
                          <p className="text-xs font-semibold text-blue-600 mb-2">รายการทั้งหมดในบิล</p>
                          {t.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                {item.productName === selectedProduct && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                )}
                                <span className={`text-sm ${item.productName === selectedProduct ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                                  {item.productName}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-gray-400">{item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"}</span>
                                <span className="text-green-700 font-semibold tabular-nums">฿{formatMoney(item.subtotal)}</span>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between pt-2 border-t border-blue-100">
                            <span className="text-xs text-blue-600 font-semibold">รวมทั้งบิล</span>
                            <span className="text-sm text-blue-700 font-bold tabular-nums">฿{formatMoney(t.totalAmount)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Safe area bottom */}
              <div className="shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", minHeight: 12 }} />
            </div>
          </>
        );
      })()}
    </div>
  );
}
