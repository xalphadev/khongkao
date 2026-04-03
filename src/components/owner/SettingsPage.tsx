"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Save } from "lucide-react";

interface ShopSettings {
  name: string; address: string | null; phone: string | null;
  taxId: string | null; receiptNote: string | null;
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{children}</label>
);
const FieldInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none transition-all ${props.className ?? ""}`} />
);

export default function SettingsPage() {
  const [form, setForm] = useState({ name: "", address: "", phone: "", taxId: "", receiptNote: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d: ShopSettings) => {
      setForm({ name: d.name ?? "", address: d.address ?? "", phone: d.phone ?? "", taxId: d.taxId ?? "", receiptNote: d.receiptNote ?? "" });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError("");
    const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else setError("เกิดข้อผิดพลาดในการบันทึก");
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl">
        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div>
            <FieldLabel>ชื่อร้าน *</FieldLabel>
            <FieldInput type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="มือสองของเก่า" />
          </div>
          <div>
            <FieldLabel>ที่อยู่</FieldLabel>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none resize-none transition-all"
              rows={2} placeholder="เลขที่ ถนน ตำบล อำเภอ จังหวัด" />
          </div>
          <div>
            <FieldLabel>เบอร์โทรศัพท์</FieldLabel>
            <FieldInput type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0xx-xxx-xxxx" />
          </div>
          <div>
            <FieldLabel>เลขที่ผู้เสียภาษี</FieldLabel>
            <FieldInput type="text" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="0-0000-0000-00-0 (ถ้ามี)" />
          </div>
          <div>
            <FieldLabel>ข้อความท้ายใบเสร็จ</FieldLabel>
            <FieldInput type="text" value={form.receiptNote} onChange={(e) => setForm({ ...form, receiptNote: e.target.value })} placeholder="ขอบคุณที่ใช้บริการ" />
          </div>

          {saved && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 rounded-xl px-4 py-2.5 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" /><span>บันทึกเรียบร้อยแล้ว</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-2.5 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
          </button>
        </div>

        {/* Receipt Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">ตัวอย่างใบเสร็จ</p>
            <div className="border border-dashed border-gray-200 rounded-xl p-4">
              <p className="text-center font-medium text-gray-900 text-sm">{form.name || "ชื่อร้าน"}</p>
              {form.address && <p className="text-center text-gray-400 text-xs mt-0.5">{form.address}</p>}
              {form.phone && <p className="text-center text-gray-400 text-xs">โทร: {form.phone}</p>}
              {form.taxId && <p className="text-center text-gray-400 text-xs">เลขภาษี: {form.taxId}</p>}
              <div className="border-t border-dashed border-gray-200 my-3" />
              <p className="text-center text-gray-500 text-xs font-medium">ใบรับซื้อของเก่า</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>ทองแดง (2 กก.)</span>
                  <span>฿360.00</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>เหล็ก (5 กก.)</span>
                  <span>฿40.00</span>
                </div>
              </div>
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-xs font-medium text-gray-700">
                <span>รวมทั้งหมด</span>
                <span>฿400.00</span>
              </div>
              <div className="border-t border-dashed border-gray-200 mt-3 pt-2 text-center text-gray-400 text-xs">
                {form.receiptNote || "ขอบคุณที่ใช้บริการ"}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-blue-700 text-sm font-medium mb-1">💡 เปลี่ยนรหัสผ่าน</p>
            <p className="text-blue-600 text-xs">
              ไปที่เมนู <strong>จัดการพนักงาน</strong> และกดแก้ไขบัญชีของตัวเอง
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
