"use client";

import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type Variant = "danger" | "warning" | "success";

interface Props {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES: Record<Variant, { icon: React.ReactNode; confirmCls: string }> = {
  danger: {
    icon: <XCircle className="w-7 h-7 text-red-500" />,
    confirmCls: "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white",
  },
  warning: {
    icon: <AlertTriangle className="w-7 h-7 text-amber-500" />,
    confirmCls: "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white",
  },
  success: {
    icon: <CheckCircle className="w-7 h-7 text-green-600" />,
    confirmCls: "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white",
  },
};

export default function ConfirmModal({
  title,
  description,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  variant = "warning",
  onConfirm,
  onCancel,
}: Props) {
  const { icon, confirmCls } = VARIANT_STYLES[variant];

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-5 backdrop-blur-sm"
      onClick={onCancel}>
      <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            {icon}
          </div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-gray-500 text-sm mt-1 leading-relaxed">{description}</p>}
        </div>
        <div className="flex gap-2.5">
          <button onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-2xl text-sm font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${confirmCls}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
