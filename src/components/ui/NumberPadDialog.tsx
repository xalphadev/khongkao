"use client";

import { useState, useEffect, useCallback } from "react";

// ── Helpers ────────────────────────────────────────────────────

export function evalCalcExpr(expr: string): number | null {
  const trimmed = expr.trim();
  if (!trimmed) return null;
  const sanitized = trimmed.replace(/×/g, "*").replace(/÷/g, "/");
  if (!/^[\d\s+\-*/\.]+$/.test(sanitized)) return null;
  if (/[+\-*/]$/.test(sanitized.trim())) return null;
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${sanitized})`)() as number;
    if (typeof result !== "number" || !isFinite(result) || result < 0) return null;
    return Math.round(result * 1000) / 1000;
  } catch { return null; }
}

export function hasCalcOperator(expr: string) { return /[+\-×÷]/.test(expr); }

// ── Internal Keypad ────────────────────────────────────────────

function CalcKeys({ onKey, onConfirm, canConfirm }: {
  onKey: (k: string) => void;
  onConfirm: () => void;
  canConfirm: boolean;
}) {
  const autoKeys: { label: string; k: string; cls: string }[] = [
    { label: "C",   k: "C",   cls: "bg-gray-100 text-gray-500 text-xl" },
    { label: "÷",   k: "÷",   cls: "bg-gray-100 text-emerald-600 text-xl font-bold" },
    { label: "×",   k: "×",   cls: "bg-gray-100 text-emerald-600 text-xl font-bold" },
    { label: "⌫",   k: "⌫",   cls: "bg-emerald-50 text-emerald-600 text-xl" },
    { label: "7",   k: "7",   cls: "bg-white text-gray-800 text-2xl font-semibold shadow-sm" },
    { label: "8",   k: "8",   cls: "bg-white text-gray-800 text-2xl font-semibold shadow-sm" },
    { label: "9",   k: "9",   cls: "bg-white text-gray-800 text-2xl font-semibold shadow-sm" },
    { label: "−",   k: "-",   cls: "bg-gray-100 text-emerald-600 text-xl font-bold" },
    { label: "4",   k: "4",   cls: "bg-white text-gray-800 text-2xl font-semibold shadow-sm" },
    { label: "5",   k: "5",   cls: "bg-white text-gray-800 text-2xl font-semibold shadow-sm" },
    { label: "6",   k: "6",   cls: "bg-white text-gray-800 text-2xl font-semibold shadow-sm" },
    { label: "+",   k: "+",   cls: "bg-gray-100 text-emerald-600 text-xl font-bold" },
    { label: "1",   k: "1",   cls: "bg-white text-gray-800 text-2xl font-semibold shadow-sm" },
    { label: "2",   k: "2",   cls: "bg-white text-gray-800 text-2xl font-semibold shadow-sm" },
    { label: "3",   k: "3",   cls: "bg-white text-gray-800 text-2xl font-semibold shadow-sm" },
    // col 4 row 4-5 → เสร็จสิ้น (explicitly placed)
    { label: "0",   k: "0",   cls: "bg-white text-gray-800 text-2xl font-semibold shadow-sm" },
    { label: "000", k: "000", cls: "bg-white text-gray-600 text-lg font-semibold shadow-sm" },
    { label: ".",   k: ".",   cls: "bg-white text-gray-800 text-2xl font-semibold shadow-sm" },
  ];

  return (
    <div className="p-3" style={{ background: "#eef2f7" }}>
      <div
        className="grid grid-cols-4 gap-2"
        style={{ gridTemplateRows: "repeat(5, 3.5rem)" }}
      >
        {autoKeys.map(({ label, k, cls }) => (
          <button
            key={k + label}
            onClick={() => onKey(k)}
            className={`flex items-center justify-center rounded-2xl transition-all active:scale-95 select-none ${cls}`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          style={{ gridColumnStart: 4, gridRowStart: 4, gridRowEnd: "span 2" }}
          className={`flex items-center justify-center rounded-2xl font-bold text-base transition-all select-none ${
            canConfirm
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 active:scale-95"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          เสร็จสิ้น
        </button>
      </div>
    </div>
  );
}

// ── Public Dialog ──────────────────────────────────────────────

export interface NumberPadHistoryItem {
  expr: string;
  result: number;
  unit: string;
}

export interface NumberPadDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with the evaluated number when the user confirms */
  onConfirm: (value: number) => void;
  /** Short label shown at the top of the dialog */
  title?: string;
  /** Unit label shown next to the result (e.g. "กก.", "ชิ้น", "บาท") */
  unit?: string;
  /** Initial numeric value to pre-fill */
  initialValue?: number | null;
  /** Shared history array (pass your own state for persistence across opens) */
  history?: NumberPadHistoryItem[];
  onHistoryChange?: (h: NumberPadHistoryItem[]) => void;
}

export default function NumberPadDialog({
  open,
  onClose,
  onConfirm,
  title,
  unit,
  initialValue,
  history: externalHistory,
  onHistoryChange,
}: NumberPadDialogProps) {
  const [expr, setExpr] = useState("");
  const [internalHistory, setInternalHistory] = useState<NumberPadHistoryItem[]>([]);

  const history = externalHistory ?? internalHistory;
  const setHistory = useCallback((updater: (prev: NumberPadHistoryItem[]) => NumberPadHistoryItem[]) => {
    if (onHistoryChange) {
      onHistoryChange(updater(externalHistory ?? []));
    } else {
      setInternalHistory(updater);
    }
  }, [onHistoryChange, externalHistory]);

  // Reset expression each time the dialog opens
  useEffect(() => {
    if (open) {
      setExpr(initialValue != null && initialValue > 0 ? String(initialValue) : "");
    }
  }, [open, initialValue]);

  const handleKey = useCallback((k: string) => {
    setExpr(prev => {
      if (k === "C") return "";
      if (k === "⌫") return prev.slice(0, -1);
      const ops = ["+", "-", "×", "÷"];
      const lastIsOp = ops.some(o => prev.endsWith(o));
      if (ops.includes(k) && lastIsOp) return prev.slice(0, -1) + k;
      if (ops.includes(k) && !prev) return prev;
      if (k === "000" && !prev) return "0";
      return prev + k;
    });
  }, []);

  const calcResult = evalCalcExpr(expr || "0");
  const canConfirm = calcResult !== null && calcResult > 0;

  const handleConfirm = useCallback(() => {
    if (!calcResult || calcResult <= 0) return;
    if (hasCalcOperator(expr)) {
      setHistory(prev => [
        { expr, result: calcResult, unit: unit ?? "" },
        ...prev,
      ].slice(0, 12));
    }
    onConfirm(calcResult);
    onClose();
  }, [calcResult, expr, unit, onConfirm, onClose, setHistory]);

  if (!open) return null;

  const displayLen = expr.length;
  const exprFontSize = displayLen > 16 ? "text-2xl" : displayLen > 10 ? "text-3xl" : displayLen > 6 ? "text-4xl" : "text-6xl";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full max-w-md overflow-hidden"
        style={{ borderRadius: "24px 24px 0 0" }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        {title && (
          <p className="text-center text-gray-400 text-sm font-medium px-4 pb-2 pt-1">{title}</p>
        )}

        {/* Expression display */}
        <div className="px-5 pt-2 pb-3 text-center">
          <p className={`font-bold tabular-nums leading-none transition-all ${exprFontSize} ${calcResult !== null ? "text-gray-800" : "text-gray-300"}`}>
            {expr || "0"}
          </p>
          {hasCalcOperator(expr) && calcResult !== null && (
            <div className="mt-1.5 flex items-center justify-center gap-1.5">
              <span className="text-gray-300 text-sm">＝</span>
              <span className="text-emerald-600 font-semibold text-xl tabular-nums">{calcResult}</span>
              {unit && <span className="text-gray-400 text-sm">{unit}</span>}
            </div>
          )}
        </div>

        {/* History — last 3 items */}
        {history.length > 0 && (
          <div className="mx-4 mb-2 bg-gray-50 rounded-2xl px-4 py-2.5 space-y-1">
            <p className="text-gray-400 text-[11px] font-medium mb-1.5">ประวัติ</p>
            {history.slice(0, 3).map((h, i) => (
              <button
                key={i}
                onClick={() => setExpr(String(h.result))}
                className="w-full flex items-center justify-between text-sm active:opacity-70"
              >
                <span className="text-gray-400 font-mono truncate mr-2">{h.expr}</span>
                <span className="text-emerald-600 font-semibold tabular-nums shrink-0">
                  = {h.result}{h.unit ? ` ${h.unit}` : ""}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Keypad */}
        <CalcKeys onKey={handleKey} onConfirm={handleConfirm} canConfirm={canConfirm} />

        {/* iOS safe area */}
        <div style={{ height: "env(safe-area-inset-bottom)" }} />
      </div>
    </div>
  );
}
