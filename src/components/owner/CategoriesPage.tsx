"use client";

import { useState, useEffect } from "react";
import { Wrench, Cpu, Newspaper, Recycle, GlassWater, Package, Plus, X } from "lucide-react";

interface Category {
  id: string; name: string; description: string | null;
  isActive: boolean; products: { id: string }[];
}

type CatIconName = "โลหะ" | "อิเล็กทรอนิกส์" | "กระดาษ" | "พลาสติก" | "แก้ว";
const CAT_ICON_MAP: Record<CatIconName, React.ComponentType<{ className?: string }>> = {
  โลหะ: Wrench, อิเล็กทรอนิกส์: Cpu, กระดาษ: Newspaper, พลาสติก: Recycle, แก้ว: GlassWater,
};
function CatIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CAT_ICON_MAP[name as CatIconName] ?? Package;
  return <Icon className={className ?? "w-6 h-6"} />;
}

const CAT_COLORS: Record<string, string> = {
  โลหะ: "bg-slate-100 text-slate-600",
  อิเล็กทรอนิกส์: "bg-blue-100 text-blue-600",
  กระดาษ: "bg-yellow-100 text-yellow-700",
  พลาสติก: "bg-purple-100 text-purple-600",
  แก้ว: "bg-cyan-100 text-cyan-600",
};

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{children}</label>
);

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setCategories(await fetch("/api/categories").then((r) => r.json()));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: "", description: "" }); setError(""); setShowModal(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, description: c.description ?? "" }); setError(""); setShowModal(true); };

  const handleSave = async () => {
    setError("");
    if (!form.name) { setError("กรุณาระบุชื่อหมวดหมู่"); return; }
    setSaving(true);
    const res = editing
      ? await fetch(`/api/categories/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setShowModal(false); load(); }
    else { const d = await res.json(); setError(d.error ?? "เกิดข้อผิดพลาด"); }
    setSaving(false);
  };

  const toggleActive = async (c: Category) => {
    await fetch(`/api/categories/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !c.isActive }) });
    load();
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-gray-500 text-sm">หมวดหมู่ทั้งหมด {categories.length} หมวด</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-sm shadow-green-600/25">
          <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => {
            const iconBg = CAT_COLORS[c.name] ?? "bg-gray-100 text-gray-500";
            return (
              <div key={c.id} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all ${!c.isActive ? "opacity-50" : "hover:shadow-md"}`}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
                    <CatIcon name={c.name} className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900">{c.name}</h3>
                    {c.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{c.description}</p>}
                    <p className="text-gray-400 text-xs mt-1">{c.products.length} สินค้า</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2.5 border-t border-gray-50">
                  <button onClick={() => toggleActive(c)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors ${c.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {c.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </button>
                  <button onClick={() => openEdit(c)}
                    className="flex-1 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    แก้ไข
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">{editing ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <FieldLabel>ชื่อหมวดหมู่</FieldLabel>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none"
                  placeholder="เช่น โลหะ, กระดาษ" />
              </div>
              <div>
                <FieldLabel>คำอธิบาย (ถ้ามี)</FieldLabel>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none"
                  placeholder="เช่น เหล็ก, ทองแดง, อลูมิเนียม" />
              </div>
              {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-2 text-sm">{error}</div>}
            </div>
            <div className="px-6 pb-5 flex gap-2.5">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-xl text-sm font-medium">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
