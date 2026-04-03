"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Download, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TransactionItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  subtotal: number;
}

interface Transaction {
  id: string;
  totalAmount: number;
  customerName?: string;
  createdAt: string;
  staff: { name: string };
  items: TransactionItem[];
}

interface DailyReport {
  date: string;
  totalAmount: number;
  totalTransactions: number;
  transactions: Transaction[];
  categoryBreakdown: { name: string; amount: number; quantity: number }[];
  productBreakdown: { name: string; unit: string; amount: number; quantity: number }[];
}

function formatMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatTime(s: string) {
  return new Date(s).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}
function formatDateThai(s: string) {
  return new Date(s).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function ReportsPage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { load(); }, [date]);

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/reports/daily?date=${date}`);
    setReport(await r.json());
    setLoading(false);
  };

  const handleExport = () => {
    if (!report) return;
    let csv = "เลขที่,เวลา,พนักงาน,สินค้า,จำนวน,หน่วย,ยอดเงิน\n";
    report.transactions.forEach((t) => {
      t.items.forEach((item) => {
        csv += `${t.id.slice(-8)},${formatTime(t.createdAt)},${t.staff.name},${item.productName},${item.quantity},${item.unit === "KG" ? "กก." : "ชิ้น"},${item.subtotal}\n`;
      });
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `รายงาน_${date}.csv`;
    a.click();
  };

  return (
    <div>
      {/* ── Header card ── */}
      <div className="bg-gradient-to-br from-green-600 to-green-500 rounded-2xl p-5 mb-5 shadow-lg shadow-green-600/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-xs mb-0.5">รายงานประจำวัน</p>
            {report && !loading && (
              <p className="text-white/80 text-xs">{formatDateThai(date)}</p>
            )}
          </div>
          <button
            onClick={handleExport}
            disabled={!report || report.totalTransactions === 0}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-40 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Date picker */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-white/20 text-white placeholder-white/60 border-0 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white/30 transition-all"
          style={{ colorScheme: "dark" }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">กำลังโหลด...</p>
          </div>
        </div>
      ) : !report ? null : (
        <>
          {/* ── Summary tiles ── */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            <div className="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-gray-100 border-t-4 border-t-green-500">
              <p className="text-gray-400 text-xs leading-tight mb-1.5">ยอดรวม</p>
              <p className="text-green-600 font-medium text-base tabular-nums leading-tight">
                ฿{report.totalAmount >= 1000
                  ? `${(report.totalAmount / 1000).toFixed(1)}k`
                  : formatMoney(report.totalAmount)}
              </p>
            </div>
            <div className="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-gray-100 border-t-4 border-t-blue-500">
              <p className="text-gray-400 text-xs leading-tight mb-1.5">รายการ</p>
              <p className="text-blue-600 font-medium text-base tabular-nums leading-tight">
                {report.totalTransactions}
                <span className="text-xs text-gray-400 ml-1">รายการ</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-gray-100 border-t-4 border-t-orange-500">
              <p className="text-gray-400 text-xs leading-tight mb-1.5">เฉลี่ย</p>
              <p className="text-orange-500 font-medium text-base tabular-nums leading-tight">
                ฿{report.totalTransactions > 0
                  ? (report.totalAmount / report.totalTransactions >= 1000
                    ? `${(report.totalAmount / report.totalTransactions / 1000).toFixed(1)}k`
                    : formatMoney(report.totalAmount / report.totalTransactions))
                  : "0"}
              </p>
            </div>
          </div>

          {/* ── Category chart ── */}
          {report.categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">ยอดตามหมวดหมู่</h2>
              <ResponsiveContainer width="100%" height={report.categoryBreakdown.length * 44 + 20}>
                <BarChart
                  data={report.categoryBreakdown}
                  layout="vertical"
                  margin={{ left: 0, right: 12, top: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => v >= 1000 ? `฿${(v / 1000).toFixed(0)}k` : `฿${v}`}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#374151" }}
                    width={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v) => [`฿${formatMoney(Number(v))}`, "ยอด"]}
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: 13 }}
                  />
                  <Bar dataKey="amount" fill="#16a34a" radius={[0, 6, 6, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Product breakdown ── */}
          {report.productBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
              <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-700">รายการสินค้า</h2>
                <span className="text-xs text-gray-400">{report.productBreakdown.length} รายการ</span>
              </div>
              <div className="divide-y divide-gray-50">
                {report.productBreakdown.map((p, i) => {
                  const pct = report.totalAmount > 0
                    ? ((p.amount / report.totalAmount) * 100).toFixed(1)
                    : "0";
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs flex items-center justify-center shrink-0 font-medium">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm leading-tight">{p.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {p.quantity} {p.unit === "KG" ? "กก." : "ชิ้น"} · {pct}%
                        </p>
                      </div>
                      <p className="text-green-600 font-medium tabular-nums text-sm shrink-0">
                        ฿{formatMoney(p.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Transaction list ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">รายการทั้งหมด</h2>
              <span className="text-xs text-gray-400">{report.totalTransactions} รายการ</span>
            </div>

            {report.transactions.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-medium">ไม่มีรายการ</p>
                <p className="text-sm mt-1">ลองเลือกวันอื่น</p>
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
                          <span className="text-gray-500 text-xs">{formatTime(t.createdAt)}</span>
                          <span className="text-blue-500 text-xs">· {t.staff.name}</span>
                          {t.customerName && (
                            <span className="text-gray-400 text-xs">· {t.customerName}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 truncate mt-0.5">
                          {t.items.map((i) => i.productName).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        <span className="text-green-600 font-medium text-sm tabular-nums">
                          ฿{formatMoney(t.totalAmount)}
                        </span>
                        {expandedId === t.id
                          ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                          : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        }
                      </div>
                    </button>

                    {expandedId === t.id && (
                      <div className="bg-gray-50 px-4 pb-3 pt-1">
                        <div className="space-y-2">
                          {t.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">{item.productName}</span>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-gray-400">
                                  {item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"}
                                </span>
                                <span className="text-green-600 font-medium tabular-nums">
                                  ฿{formatMoney(item.subtotal)}
                                </span>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-gray-500 text-xs font-medium">รวม</span>
                            <span className="text-green-700 font-medium tabular-nums">
                              ฿{formatMoney(t.totalAmount)}
                            </span>
                          </div>
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
