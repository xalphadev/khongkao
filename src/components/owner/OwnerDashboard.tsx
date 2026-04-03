"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Banknote, ClipboardList, CalendarDays, BarChart2 } from "lucide-react";

interface DailyReport {
  date: string;
  totalAmount: number;
  totalTransactions: number;
  categoryBreakdown: { name: string; amount: number; quantity: number }[];
  productBreakdown: { name: string; unit: string; amount: number; quantity: number }[];
}

interface MonthlyReport {
  totalAmount: number;
  totalTransactions: number;
  dailyData: { date: string; amount: number; count: number }[];
  categoryBreakdown: { name: string; amount: number }[];
  monthlyTrend: { month: string; amount: number }[];
}

const PIE_COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

function formatMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function formatMonthLabel(m: string) {
  const [y, mo] = m.split("-");
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${months[parseInt(mo) - 1]}`;
}

const StatCard = ({ label, value, sub, gradient, icon: Icon }: {
  label: string; value: string; sub?: string; gradient: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className={`relative bg-gradient-to-br ${gradient} rounded-2xl p-4 shadow-lg overflow-hidden`}>
    <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
    <p className="text-white/70 text-xs mb-1">{label}</p>
    <p className="text-2xl font-medium text-white tabular-nums">{value}</p>
    {sub && <p className="text-white/60 text-xs mt-0.5">{sub}</p>}
    <div className="absolute bottom-3 right-3 opacity-30">
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

export default function OwnerDashboard() {
  const [daily, setDaily] = useState<DailyReport | null>(null);
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [date]);

  const load = async () => {
    setLoading(true);
    const d = new Date(date);
    const [dr, mr] = await Promise.all([
      fetch(`/api/reports/daily?date=${date}`).then((r) => r.json()),
      fetch(`/api/reports/monthly?year=${d.getFullYear()}&month=${d.getMonth() + 1}`).then((r) => r.json()),
    ]);
    setDaily(dr);
    setMonthly(mr);
    setLoading(false);
  };

  const today = new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      {/* Page title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">แดชบอร์ด</h1>
          <p className="text-gray-400 text-sm mt-0.5">{today}</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-green-500 focus:outline-none bg-white shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">กำลังโหลด...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stat grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard label="ยอดวันนี้" value={`฿${formatMoney(daily?.totalAmount ?? 0)}`} gradient="from-green-600 to-green-500" icon={Banknote} />
            <StatCard label="รายการวันนี้" value={String(daily?.totalTransactions ?? 0)} sub="รายการ" gradient="from-blue-600 to-blue-500" icon={ClipboardList} />
            <StatCard label="ยอดเดือนนี้" value={`฿${formatMoney(monthly?.totalAmount ?? 0)}`} gradient="from-amber-500 to-orange-500" icon={CalendarDays} />
            <StatCard label="รายการเดือนนี้" value={String(monthly?.totalTransactions ?? 0)} sub="รายการ" gradient="from-violet-600 to-purple-500" icon={BarChart2} />
          </div>

          {/* Daily bar chart */}
          {monthly && monthly.dailyData.some((d) => d.amount > 0) && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">ยอดรับซื้อรายวัน (เดือนนี้)</h2>
              {/* Scrollable on mobile so 30 bars don't squish */}
              <div className="overflow-x-auto -mx-1">
                <div style={{ minWidth: monthly.dailyData.length * 22 }} className="px-1">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={monthly.dailyData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v).getDate().toString()} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip
                        formatter={(v) => [`฿${formatMoney(Number(v))}`, "ยอด"]}
                        labelFormatter={(l) => new Date(String(l)).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                        contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
                      />
                      <Bar dataKey="amount" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Pie */}
            {daily && daily.categoryBreakdown.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-sm font-medium text-gray-700 mb-4">สัดส่วนหมวดหมู่ (วันนี้)</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={daily.categoryBreakdown} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={35}>
                      {daily.categoryBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`฿${formatMoney(Number(v))}`, ""]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: "#6b7280" }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Trend */}
            {monthly && monthly.monthlyTrend.length > 1 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-sm font-medium text-gray-700 mb-4">แนวโน้ม 6 เดือน</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthly.monthlyTrend} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tickFormatter={(v) => formatMonthLabel(String(v))} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip
                      formatter={(v) => [`฿${formatMoney(Number(v))}`, "ยอด"]}
                      labelFormatter={(l) => formatMonthLabel(String(l))}
                      contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
                    />
                    <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Products today */}
          {daily && daily.productBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="text-sm font-medium text-gray-700">สินค้าที่รับซื้อวันนี้</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {daily.productBreakdown.map((p, i) => (
                  <div key={i} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-medium">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.quantity} {p.unit === "KG" ? "กก." : "ชิ้น"}</p>
                      </div>
                    </div>
                    <p className="text-green-600 font-medium text-sm tabular-nums">฿{formatMoney(p.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {daily && daily.totalTransactions === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">ไม่มีข้อมูลในวันที่เลือก</p>
              <p className="text-gray-400 text-sm mt-1">ลองเลือกวันอื่น</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
