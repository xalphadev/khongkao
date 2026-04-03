"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const THAI_DAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function localDateString(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface Props {
  value: string;           // "YYYY-MM-DD"
  max?: string;            // "YYYY-MM-DD" — disable dates after this
  onSelect: (date: string) => void;
  onClose: () => void;
  accentFrom?: string;
  accentTo?: string;
}

export default function DatePickerModal({
  value,
  max,
  onSelect,
  onClose,
  accentFrom = "#4f46e5",
  accentTo = "#2563eb",
}: Props) {
  const today = localDateString();
  const maxDate = max ?? today;

  const initialDate = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-indexed
  const [selected, setSelected] = useState(value);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    const maxD = new Date(maxDate + "T00:00:00");
    const nextIsAfterMax = viewYear > maxD.getFullYear() ||
      (viewYear === maxD.getFullYear() && viewMonth >= maxD.getMonth());
    if (nextIsAfterMax) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  // Build calendar grid (pad to start from Sunday)
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const cellDate = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${viewYear}-${m}-${d}`;
  };

  const isDisabled = (day: number) => cellDate(day) > maxDate;
  const isSelected = (day: number) => cellDate(day) === selected;
  const isToday = (day: number) => cellDate(day) === today;

  const maxD = new Date(maxDate + "T00:00:00");
  const nextDisabled = viewYear > maxD.getFullYear() ||
    (viewYear === maxD.getFullYear() && viewMonth >= maxD.getMonth());

  const handleSelect = (day: number) => {
    if (isDisabled(day)) return;
    const d = cellDate(day);
    setSelected(d);
    onSelect(d);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Header gradient */}
        <div className="px-5 pt-5 pb-4 text-white"
          style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/80 text-xs font-medium uppercase tracking-wider">เลือกวันที่</p>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 active:bg-white/30">
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-2xl font-bold">
            {selected
              ? new Date(selected + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
              : "ยังไม่ได้เลือก"}
          </p>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 active:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className="font-semibold text-gray-800 text-sm">
            {THAI_MONTHS[viewMonth]} {viewYear + 543}
          </p>
          <button onClick={nextMonth} disabled={nextDisabled}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 active:bg-gray-100 disabled:opacity-30 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-3 pt-3 pb-1">
          {THAI_DAYS_SHORT.map((d, i) => (
            <div key={d} className={`text-center text-xs font-semibold pb-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 px-3 pb-5 gap-y-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} />;
            const disabled = isDisabled(day);
            const sel = isSelected(day);
            const tod = isToday(day);
            const isSun = (idx % 7) === 0;
            const isSat = (idx % 7) === 6;
            return (
              <button
                key={day}
                onClick={() => handleSelect(day)}
                disabled={disabled}
                className="relative flex items-center justify-center h-10 rounded-xl text-sm font-medium transition-all active:scale-90 disabled:opacity-30"
                style={sel ? { background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`, color: "#fff" } : {}}
              >
                {tod && !sel && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: accentTo }} />
                )}
                <span className={
                  sel ? "text-white font-bold" :
                  disabled ? "text-gray-300" :
                  tod ? "font-bold" :
                  isSun ? "text-red-400" :
                  isSat ? "text-blue-400" :
                  "text-gray-700"
                }>
                  {day}
                </span>
              </button>
            );
          })}
        </div>

        {/* Today shortcut */}
        <div className="px-4 pb-5">
          <button
            onClick={() => { setSelected(today); onSelect(today); onClose(); }}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-colors border-2"
            style={{ borderColor: accentTo, color: accentTo }}
          >
            กลับวันนี้
          </button>
        </div>
      </div>
    </div>
  );
}
