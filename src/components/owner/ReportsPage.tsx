"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Download, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, BarChart2, Calendar, CalendarDays } from "lucide-react";
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
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
function addMonths(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split("T")[0];
}
function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().split("T")[0];
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

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("day");
  const [anchor, setAnchor] = useState(new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { load(); }, [period, anchor]);

  const getRange = () => {
    if (period === "day") return { startDate: anchor, endDate: anchor };
    if (period === "week") return getWeekRange(anchor);
    return getMonthRange(anchor);
  };

  const load = async () => {
    setLoading(true);
    setExpandedId(null);
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
      {/* ── Page banner ── */}
      <div className="relative rounded-3xl overflow-hidden px-5 py-5 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)" }}>
        <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full bg-white/[0.08]" />
        <div className="absolute bottom-0 left-12 w-20 h-20 rounded-full bg-black/[0.07]" />
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <BarChart2 className="w-6 h-6 text-white" />
        </div>
        <div className="relative">
          <p className="text-white font-bold text-lg leading-tight">รายงาน</p>
          <p className="text-blue-200 text-sm">ข้อมูลรายการรับซื้อ</p>
        </div>
      </div>

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

          {/* ── Product breakdown ── */}
          {report.productBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">รายการสินค้า</p>
                <span className="text-xs text-gray-400">{report.productBreakdown.length} ชนิด</span>
              </div>
              <div className="divide-y divide-gray-50">
                {report.productBreakdown.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs flex items-center justify-center shrink-0 font-medium">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm leading-tight">{p.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{p.quantity} {p.unit === "KG" ? "กก." : "ชิ้น"}</p>
                    </div>
                    <p className="text-green-600 font-semibold tabular-nums text-sm shrink-0">฿{formatMoney(p.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            ) : (
              <div className="divide-y divide-gray-50">
                {report.transactions.map((t) => (
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
