"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Download, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar, CalendarDays, BarChart2, X, User, Clock, SlidersHorizontal, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DatePickerModal from "@/components/ui/DatePickerModal";

interface PriceGroup {
  id: string; name: string; color: string | null;
}
interface TransactionItem {
  id: string; productName: string; quantity: number; unit: string; subtotal: number;
}
interface Transaction {
  id: string; totalAmount: number; customerName?: string; createdAt: string;
  staff: { name: string }; items: TransactionItem[];
  customer?: { id: string; name: string; nickname?: string | null; priceGroup?: { id: string; name: string; color: string } | null } | null;
}
interface PriceGroupStat {
  id: string; name: string; color: string | null;
  amount: number; count: number; customerCount: number;
}
interface PeriodReport {
  startDate: string; endDate: string;
  totalAmount: number; totalTransactions: number;
  dailyData: { date: string; amount: number; count: number }[];
  categoryBreakdown: { name: string; amount: number; quantity: number }[];
  productBreakdown: { name: string; unit: string; amount: number; quantity: number }[];
  staffBreakdown: { name: string; amount: number; count: number }[];
  priceGroupBreakdown: PriceGroupStat[];
  transactions: Transaction[];
}

type Period = "day" | "week" | "month" | "custom";

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
  const day = d.getDay();
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
  // Custom range
  const [customStart, setCustomStart] = useState(() => localDateString());
  const [customEnd, setCustomEnd] = useState(() => localDateString());
  const [customPickerFor, setCustomPickerFor] = useState<"start" | "end" | null>(null);
  const [customApplied, setCustomApplied] = useState(false);
  // Price group filter
  const [priceGroups, setPriceGroups] = useState<PriceGroup[]>([]);
  const [filterGroupId, setFilterGroupId] = useState(""); // "" = all, "none" = ราคาปกติ, else groupId

  // Fetch price groups once on mount
  useEffect(() => {
    fetch("/api/price-groups").then((r) => r.ok ? r.json() : []).then(setPriceGroups);
  }, []);

  useEffect(() => {
    if (period !== "custom") { load(); setShowAllProducts(false); setShowAllTx(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, anchor, filterGroupId]);

  const getRange = () => {
    if (period === "day") return { startDate: anchor, endDate: anchor };
    if (period === "week") return getWeekRange(anchor);
    if (period === "custom") return { startDate: customStart, endDate: customEnd };
    return getMonthRange(anchor);
  };

  const load = async () => {
    setLoading(true);
    setExpandedId(null);
    setSelectedProduct(null);
    const { startDate, endDate } = getRange();
    const params = new URLSearchParams({ startDate, endDate });
    if (filterGroupId) params.set("priceGroupId", filterGroupId);
    const r = await fetch(`/api/reports/period?${params}`);
    setReport(await r.json());
    setLoading(false);
  };

  const goBack = () => {
    if (period === "day") setAnchor(addDays(anchor, -1));
    else if (period === "week") setAnchor(addDays(anchor, -7));
    else if (period === "month") setAnchor(addMonths(anchor, -1));
  };
  const goForward = () => {
    let next: string;
    if (period === "day") next = addDays(anchor, 1);
    else if (period === "week") next = addDays(anchor, 7);
    else next = addMonths(anchor, 1);
    if (next <= localDateString()) setAnchor(next);
  };
  const isAtToday = () => {
    if (period === "day") return isToday(anchor);
    if (period === "week") return getWeekRange(localDateString()).startDate === getWeekRange(anchor).startDate;
    return getMonthRange(localDateString()).startDate === getMonthRange(anchor).startDate;
  };
  const goToToday = () => setAnchor(localDateString());

  const applyCustom = () => {
    if (customStart > customEnd) return;
    setCustomApplied(true);
    setShowAllProducts(false);
    setShowAllTx(false);
    load();
  };

  const handleExport = () => {
    if (!report) return;
    let csv = "เลขที่,วันที่,เวลา,พนักงาน,ลูกค้า,กลุ่มราคา,สินค้า,จำนวน,หน่วย,ยอดเงิน\n";
    report.transactions.forEach((t) => {
      const d = new Date(t.createdAt).toLocaleDateString("th-TH");
      const pgName = t.customer?.priceGroup?.name ? `กลุ่ม ${t.customer.priceGroup.name}` : "ราคาปกติ";
      const customerDisplay = t.customer?.name ?? t.customerName ?? "";
      t.items.forEach((item) => {
        csv += `${t.id.slice(-8)},${d},${formatTime(t.createdAt)},${t.staff.name},${customerDisplay},${pgName},${item.productName},${item.quantity},${item.unit === "KG" ? "กก." : "ชิ้น"},${item.subtotal}\n`;
      });
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `รายงาน_${report.startDate}_${report.endDate}.csv`;
    a.click();
  };

  const atToday = period !== "custom" && isAtToday();

  // Active filter label for display
  const activeFilterLabel = filterGroupId === "none"
    ? "ราคาปกติ"
    : filterGroupId
    ? `กลุ่ม ${priceGroups.find((g) => g.id === filterGroupId)?.name ?? ""}`
    : null;

  return (
    <div className="space-y-4">
      {/* ── Period tabs ── */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm flex gap-1 border border-gray-100">
        {([
          { key: "day",    label: "รายวัน",     icon: Calendar },
          { key: "week",   label: "รายสัปดาห์", icon: CalendarDays },
          { key: "month",  label: "รายเดือน",   icon: BarChart2 },
          { key: "custom", label: "กำหนดเอง",   icon: SlidersHorizontal },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setPeriod(key); setCustomApplied(false); setReport(null); }}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              period === key ? "text-white shadow-sm" : "text-gray-400 active:bg-gray-50"
            }`}
            style={period === key ? { background: "linear-gradient(135deg, #10b981, #0ea5e9)" } : {}}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Price group filter chips ── */}
      {priceGroups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto -mx-0 pb-0.5" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setFilterGroupId("")}
            className={`flex-none px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              filterGroupId === "" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-500 border-gray-200 shadow-sm"
            }`}
          >
            ทุกกลุ่ม
          </button>
          {priceGroups.map((g) => {
            const active = filterGroupId === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setFilterGroupId(active ? "" : g.id)}
                className={`flex-none px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  active ? "text-white border-transparent shadow-sm" : "bg-white border-gray-200 shadow-sm"
                }`}
                style={active ? { background: g.color ?? "#16a34a" } : { color: g.color ?? "#16a34a" }}
              >
                กลุ่ม {g.name}
              </button>
            );
          })}
          <button
            onClick={() => setFilterGroupId(filterGroupId === "none" ? "" : "none")}
            className={`flex-none px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              filterGroupId === "none" ? "bg-gray-500 text-white border-gray-500 shadow-sm" : "bg-white text-gray-400 border-gray-200 shadow-sm"
            }`}
          >
            ราคาปกติ
          </button>
        </div>
      )}

      {/* ── Date navigator (standard periods) ── */}
      {period !== "custom" && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-4 shadow-lg shadow-blue-600/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/80 text-sm font-medium">ช่วงเวลา</p>
              {activeFilterLabel && (
                <p className="text-white/60 text-xs mt-0.5">กรอง: {activeFilterLabel}</p>
              )}
            </div>
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
      )}

      {/* ── Custom date range picker ── */}
      {period === "custom" && (
        <div className="bg-gradient-to-br from-violet-600 to-violet-500 rounded-2xl p-4 shadow-lg shadow-violet-600/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/80 text-sm font-medium">กำหนดช่วงวันที่</p>
              {activeFilterLabel && (
                <p className="text-white/60 text-xs mt-0.5">กรอง: {activeFilterLabel}</p>
              )}
            </div>
            {customApplied && report && (
              <button
                onClick={handleExport}
                disabled={report.totalTransactions === 0}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-40 text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setCustomPickerFor("start")}
              className={`flex-1 bg-white/20 rounded-xl px-3 py-2.5 text-center active:bg-white/30 transition-colors border-2 ${
                customPickerFor === "start" ? "border-white/60" : "border-transparent"
              }`}
            >
              <p className="text-white/70 text-[10px] font-medium mb-0.5">ตั้งแต่</p>
              <p className="text-white text-sm font-bold leading-tight">{formatDateShort(customStart)}</p>
            </button>
            <div className="text-white/60 text-sm font-bold shrink-0">→</div>
            <button
              onClick={() => setCustomPickerFor("end")}
              className={`flex-1 bg-white/20 rounded-xl px-3 py-2.5 text-center active:bg-white/30 transition-colors border-2 ${
                customPickerFor === "end" ? "border-white/60" : "border-transparent"
              }`}
            >
              <p className="text-white/70 text-[10px] font-medium mb-0.5">ถึงวันที่</p>
              <p className="text-white text-sm font-bold leading-tight">{formatDateShort(customEnd)}</p>
            </button>
          </div>
          {customStart > customEnd && (
            <p className="text-red-200 text-xs text-center mb-2">วันเริ่มต้นต้องไม่มากกว่าวันสิ้นสุด</p>
          )}
          <button
            onClick={applyCustom}
            disabled={customStart > customEnd}
            className="w-full py-2.5 bg-white text-violet-700 font-bold text-sm rounded-xl disabled:opacity-40 active:bg-white/90 transition-all"
          >
            ดูรายงาน
          </button>
        </div>
      )}

      {/* DatePickerModal for custom range */}
      {customPickerFor === "start" && (
        <DatePickerModal
          value={customStart}
          max={localDateString()}
          onSelect={(d) => { setCustomStart(d); if (d > customEnd) setCustomEnd(d); setCustomPickerFor(null); }}
          onClose={() => setCustomPickerFor(null)}
          accentFrom="#7c3aed"
          accentTo="#8b5cf6"
        />
      )}
      {customPickerFor === "end" && (
        <DatePickerModal
          value={customEnd}
          max={localDateString()}
          onSelect={(d) => { setCustomEnd(d); setCustomPickerFor(null); }}
          onClose={() => setCustomPickerFor(null)}
          accentFrom="#7c3aed"
          accentTo="#8b5cf6"
        />
      )}

      {period === "custom" && !customApplied ? (
        <div className="flex flex-col items-center justify-center py-14 text-center text-gray-400">
          <SlidersHorizontal className="w-10 h-10 text-gray-200 mb-3" />
          <p className="font-medium text-sm">เลือกช่วงวันที่แล้วกด "ดูรายงาน"</p>
        </div>
      ) : loading ? (
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
            <div className="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-emerald-50 min-w-0">
              <div className="w-6 h-6 rounded-lg mb-2 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #10b981, #34d399)" }}>
                <Download className="w-3 h-3 text-white" />
              </div>
              <p className="text-gray-400 text-xs mb-1">ยอดรวม</p>
              <p className="text-emerald-600 font-bold text-base tabular-nums leading-tight break-all">
                ฿{report.totalAmount >= 1000 ? `${(report.totalAmount / 1000).toFixed(1)}k` : formatMoney(report.totalAmount)}
              </p>
            </div>
            <div className="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-sky-50 min-w-0">
              <div className="w-6 h-6 rounded-lg mb-2 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #38bdf8)" }}>
                <ClipboardList className="w-3 h-3 text-white" />
              </div>
              <p className="text-gray-400 text-xs mb-1">รายการ</p>
              <p className="text-sky-600 font-bold text-base tabular-nums leading-tight">{report.totalTransactions}</p>
            </div>
            <div className="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-orange-50 min-w-0">
              <div className="w-6 h-6 rounded-lg mb-2 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}>
                <BarChart2 className="w-3 h-3 text-white" />
              </div>
              <p className="text-gray-400 text-xs mb-1">เฉลี่ย/บิล</p>
              <p className="text-orange-500 font-bold text-base tabular-nums leading-tight break-all">
                ฿{report.totalTransactions > 0
                  ? (report.totalAmount / report.totalTransactions >= 1000
                    ? `${(report.totalAmount / report.totalTransactions / 1000).toFixed(1)}k`
                    : formatMoney(report.totalAmount / report.totalTransactions))
                  : "0"}
              </p>
            </div>
          </div>

          {/* ── Daily chart (for week/month/custom) ── */}
          {period !== "day" && report.dailyData.some((d) => d.amount > 0) && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #0ea5e9, #6366f1)" }} />
                <p className="text-sm font-semibold text-gray-700">
                  {period === "week" ? "ยอดรายวัน (สัปดาห์)"
                    : period === "month" ? "ยอดรายวัน (เดือนนี้)"
                    : `ยอดรายวัน (${formatDateShort(customStart)} – ${formatDateShort(customEnd)})`}
                </p>
              </div>
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
                      <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── Price group breakdown ── */}
          {report.priceGroupBreakdown && report.priceGroupBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                  <Users className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700 flex-1">ยอดตามกลุ่มราคา</p>
                {filterGroupId && (
                  <button
                    onClick={() => setFilterGroupId("")}
                    className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 rounded-lg px-2 py-1 active:bg-gray-200"
                  >
                    <X className="w-3 h-3" /> ล้างกรอง
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {report.priceGroupBreakdown.map((g, i) => {
                  const topAmt = report.priceGroupBreakdown[0]?.amount ?? 1;
                  const barPct = topAmt > 0 ? (g.amount / topAmt) * 100 : 0;
                  const totalPct = report.totalAmount > 0 ? (g.amount / report.totalAmount) * 100 : 0;
                  const isNone = g.id === "__none__";
                  const groupColor = isNone ? "#6b7280" : (g.color ?? "#16a34a");
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 text-white cursor-pointer active:scale-95 transition-transform"
                          style={{ background: groupColor }}
                          onClick={() => setFilterGroupId(filterGroupId === (isNone ? "none" : g.id) ? "" : (isNone ? "none" : g.id))}
                        >
                          {isNone ? "—" : g.name}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-1">
                            <p className="text-gray-700 text-sm font-semibold truncate">
                              {isNone ? "ราคาปกติ" : `กลุ่ม ${g.name}`}
                            </p>
                            <p className="text-gray-700 text-sm font-bold tabular-nums shrink-0">
                              ฿{formatMoney(g.amount)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-gray-400 text-xs">{g.count} บิล</span>
                            {g.customerCount > 0 && (
                              <span className="text-gray-400 text-xs">· {g.customerCount} คน</span>
                            )}
                            <span className="text-gray-400 text-xs ml-auto">{Math.round(totalPct)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-10">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${barPct}%`, background: `${groupColor}` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-3 text-center">กดที่ป้ายกลุ่มเพื่อกรองข้อมูล</p>
            </div>
          )}

          {/* ── Category breakdown ── */}
          {report.categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #10b981, #22c55e)" }} />
                <p className="text-sm font-semibold text-gray-700">ยอดตามหมวดหมู่</p>
              </div>
              <div className="space-y-2.5">
                {report.categoryBreakdown.map((c, i) => {
                  const topCat = report.categoryBreakdown[0]?.amount ?? 1;
                  const barPct = topCat > 0 ? (c.amount / topCat) * 100 : 0;
                  const totalPct = report.totalAmount > 0 ? (c.amount / report.totalAmount) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ background: COLORS[i % COLORS.length] }}>
                            {i + 1}
                          </span>
                          <p className="text-gray-700 text-sm font-medium">{c.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">{Math.round(totalPct)}%</span>
                          <p className="text-emerald-700 text-sm font-bold tabular-nums">฿{formatMoney(c.amount)}</p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${barPct}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Staff breakdown ── */}
          {report.staffBreakdown && report.staffBreakdown.length > 1 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #0ea5e9, #6366f1)" }} />
                <p className="text-sm font-semibold text-gray-700">ยอดตามพนักงาน</p>
              </div>
              <div className="space-y-3">
                {report.staffBreakdown.map((s, i) => {
                  const pct = report.totalAmount > 0 ? (s.amount / report.totalAmount) * 100 : 0;
                  const avatarGrads = [
                    ["#10b981","#0ea5e9"], ["#0ea5e9","#6366f1"],
                    ["#f59e0b","#ef4444"], ["#6366f1","#ec4899"],
                  ];
                  const [c1, c2] = avatarGrads[i % avatarGrads.length];
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 text-white"
                          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                          {s.name.charAt(0)}
                        </div>
                        <p className="text-gray-700 text-sm font-semibold flex-1">{s.name}</p>
                        <div className="text-right">
                          <p className="text-sky-700 text-sm font-bold tabular-nums">฿{formatMoney(s.amount)}</p>
                          <p className="text-gray-400 text-xs">{s.count} บิล</p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-10">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
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
            const topAmt = all[0]?.amount ?? 1;
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3.5 border-b border-gray-50 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #10b981, #0ea5e9)" }}>
                    <ClipboardList className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 flex-1">รายการสินค้า</p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{all.length} ชนิด</span>
                </div>
                <p className="text-xs text-gray-400 px-4 pt-2.5 pb-0.5">กดสินค้าเพื่อดูรายละเอียดบิล</p>
                <div className="divide-y divide-gray-50">
                  {shown.map((p, i) => {
                    const barPct = topAmt > 0 ? (p.amount / topAmt) * 100 : 0;
                    return (
                      <button key={i} onClick={() => { setSelectedProduct(p.name); setDrillExpandedId(null); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50 transition-colors">
                        <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 text-emerald-700 bg-emerald-50">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="font-semibold text-gray-800 text-sm leading-tight truncate">{p.name}</p>
                            <p className="font-bold tabular-nums text-sm shrink-0 text-emerald-600">
                              ฿{formatMoney(p.amount)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${barPct}%`, background: "linear-gradient(90deg, #10b981, #0ea5e9)" }} />
                            </div>
                            <p className="text-gray-400 text-xs shrink-0">{p.quantity} {p.unit === "KG" ? "กก." : "ชิ้น"}</p>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
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
            <div className="px-4 py-3.5 border-b border-gray-50 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                <CalendarDays className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-700 flex-1">รายการทั้งหมด</p>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {report.totalTransactions} รายการ
              </span>
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
                    {shownTx.map((t, idx) => {
                      const pg = t.customer?.priceGroup;
                      return (
                        <div key={t.id} className="overflow-hidden">
                          <button
                            onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                            className="w-full flex items-stretch active:bg-gray-50 transition-colors text-left"
                          >
                            <div className="w-1 shrink-0 bg-emerald-400" style={{ opacity: 0.6 + (idx % 3) * 0.15 }} />
                            <div className="flex items-center gap-3 flex-1 min-w-0 px-3.5 py-3">
                              <span className="font-mono text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md shrink-0">
                                #{t.id.slice(-5).toUpperCase()}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-gray-500 text-xs">
                                    {period !== "day" && `${new Date(t.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })} `}
                                    {formatTime(t.createdAt)}
                                  </span>
                                  <span className="text-sky-500 text-xs font-medium">· {t.staff.name}</span>
                                  {(t.customer?.name ?? t.customerName) && (
                                    <span className="text-gray-400 text-xs">· {t.customer?.name ?? t.customerName}</span>
                                  )}
                                  {pg && (
                                    <span className="text-[10px] text-white font-semibold rounded px-1.5 py-0.5 leading-none"
                                      style={{ background: pg.color ?? "#6b7280" }}>
                                      {pg.name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 truncate mt-0.5">{t.items.map((i) => i.productName).join(", ")}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-emerald-600 font-bold text-sm tabular-nums">฿{formatMoney(t.totalAmount)}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-300 transition-transform ${expandedId === t.id ? "rotate-180" : ""}`} />
                              </div>
                            </div>
                          </button>
                          {expandedId === t.id && (
                            <div className="bg-emerald-50/50 px-4 pb-3 pt-2 space-y-2 border-t border-emerald-100">
                              {t.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">{item.productName}</span>
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="text-gray-400">{item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"}</span>
                                    <span className="text-emerald-600 font-semibold tabular-nums">฿{formatMoney(item.subtotal)}</span>
                                  </div>
                                </div>
                              ))}
                              <div className="flex justify-between items-center pt-2 border-t border-emerald-100">
                                <span className="text-gray-500 text-xs font-medium">รวม</span>
                                <span className="text-emerald-700 font-bold tabular-nums">฿{formatMoney(t.totalAmount)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
            <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={() => setSelectedProduct(null)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: "82vh" }}>
              <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">รายการสินค้า</p>
                  <p className="font-bold text-gray-900 text-lg leading-tight truncate">{selectedProduct}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">฿{formatMoney(totalAmt)}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{totalQty} {unit === "KG" ? "กก." : "ชิ้น"}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">{txns.length} บิล</span>
                  </div>
                </div>
                <button onClick={() => setSelectedProduct(null)}
                  className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 active:bg-gray-200">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
                {txns.length === 0 ? (
                  <div className="py-16 text-center text-gray-400"><p className="text-sm">ไม่พบรายการ</p></div>
                ) : txns.map((t) => {
                  const prodItem = t.items.find((i) => i.productName === selectedProduct);
                  const isOpen = drillExpandedId === t.id;
                  const pg = t.customer?.priceGroup;
                  return (
                    <div key={t.id}>
                      <button
                        onClick={() => setDrillExpandedId(isOpen ? null : t.id)}
                        className="w-full px-5 py-4 flex items-center gap-3 text-left active:bg-gray-50 transition-colors"
                      >
                        <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg shrink-0">#{t.id.slice(-5).toUpperCase()}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                              <Clock className="w-3 h-3" />
                              {period !== "day" && `${new Date(t.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })} `}
                              {formatTime(t.createdAt)}
                            </div>
                            <div className="flex items-center gap-1 text-blue-500 text-xs font-medium">
                              <User className="w-3 h-3" /> {t.staff.name}
                            </div>
                            {(t.customer?.name ?? t.customerName) && (
                              <span className="text-gray-400 text-xs">· {t.customer?.name ?? t.customerName}</span>
                            )}
                            {pg && (
                              <span className="text-[10px] text-white font-semibold rounded px-1.5 py-0.5 leading-none"
                                style={{ background: pg.color ?? "#6b7280" }}>
                                {pg.name}
                              </span>
                            )}
                          </div>
                          <p className="text-emerald-700 font-semibold text-sm mt-0.5">
                            {prodItem?.quantity} {prodItem?.unit === "KG" ? "กก." : "ชิ้น"} = ฿{formatMoney(prodItem?.subtotal ?? 0)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-gray-500 text-xs tabular-nums">฿{formatMoney(t.totalAmount)}</span>
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="bg-blue-50 mx-4 mb-3 rounded-2xl px-4 py-3 space-y-2">
                          <p className="text-xs font-semibold text-blue-600 mb-2">รายการทั้งหมดในบิล</p>
                          {t.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                {item.productName === selectedProduct && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                                <span className={`text-sm ${item.productName === selectedProduct ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                                  {item.productName}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-gray-400">{item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"}</span>
                                <span className="text-emerald-700 font-semibold tabular-nums">฿{formatMoney(item.subtotal)}</span>
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
              <div className="shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", minHeight: 12 }} />
            </div>
          </>
        );
      })()}
    </div>
  );
}
