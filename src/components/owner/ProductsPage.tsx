"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";

interface Category { id: string; name: string; }
interface Product {
  id: string; name: string; unit: string; pricePerUnit: number;
  isActive: boolean; categoryId: string; category: Category;
}

function formatMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const Modal = ({
  title, onClose, onSave, saving, error, children
}: {
  title: string; onClose: () => void; onSave: () => void;
  saving: boolean; error: string; children: React.ReactNode;
}) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
        <h2 className="text-base font-medium text-gray-900">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200"><X className="w-4 h-4" /></button>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
      {error && <div className="mx-6 mb-3 bg-red-50 text-red-600 rounded-xl px-4 py-2.5 text-sm">{error}</div>}
      <div className="px-6 pb-5 flex gap-2.5">
        <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">ยกเลิก</button>
        <button onClick={onSave} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{children}</label>
);
const FieldInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none transition-all ${props.className ?? ""}`} />
);

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [filterCat, setFilterCat] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ categoryId: "", name: "", unit: "KG", pricePerUnit: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [pr, cr] = await Promise.all([fetch("/api/products?includeInactive=true"), fetch("/api/categories")]);
    setProducts(await pr.json());
    setCategories(await cr.json());
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ categoryId: categories[0]?.id ?? "", name: "", unit: "KG", pricePerUnit: "" });
    setError(""); setShowModal(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ categoryId: p.categoryId, name: p.name, unit: p.unit, pricePerUnit: String(p.pricePerUnit) });
    setError(""); setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    if (!form.name || !form.categoryId || !form.pricePerUnit) { setError("กรุณากรอกข้อมูลให้ครบ"); return; }
    setSaving(true);
    const body = { ...form, pricePerUnit: parseFloat(form.pricePerUnit) };
    const res = editing
      ? await fetch(`/api/products/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setShowModal(false); loadData(); }
    else { const d = await res.json(); setError(d.error ?? "เกิดข้อผิดพลาด"); }
    setSaving(false);
  };

  const toggleActive = async (p: Product) => {
    await fetch(`/api/products/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !p.isActive }) });
    loadData();
  };

  const filtered = products.filter((p) => {
    if (filterCat && p.categoryId !== filterCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">จัดการสินค้า</h1>
          <p className="text-gray-400 text-sm mt-0.5">กำหนดราคารับซื้อและจัดการรายการสินค้า</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> เพิ่มสินค้า
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="ค้นหาสินค้า..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:border-green-500 focus:outline-none shadow-sm" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-green-500 focus:outline-none shadow-sm">
          <option value="">ทุกหมวด</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl py-14 text-center text-gray-400 shadow-sm border border-gray-100">
          <p className="text-sm">ไม่พบสินค้า</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="sm:hidden space-y-2.5">
            {filtered.map((p) => (
              <div key={p.id} className={`bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100 transition-all ${!p.isActive ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{p.category.name} · {p.unit === "KG" ? "กก." : "ชิ้น"}</p>
                  </div>
                  <p className="text-green-600 font-medium tabular-nums text-lg shrink-0">฿{formatMoney(p.pricePerUnit)}</p>
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {p.isActive ? "เปิดรับซื้อ" : "ปิดรับซื้อ"}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 transition-colors"
                  >
                    แก้ไข
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-xs">
                    <th className="text-left px-5 py-3 font-medium">สินค้า</th>
                    <th className="text-left px-5 py-3 font-medium">หมวดหมู่</th>
                    <th className="text-center px-5 py-3 font-medium">หน่วย</th>
                    <th className="text-right px-5 py-3 font-medium">ราคารับซื้อ</th>
                    <th className="text-center px-5 py-3 font-medium">สถานะ</th>
                    <th className="text-center px-5 py-3 font-medium">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((p) => (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.isActive ? "opacity-40" : ""}`}>
                      <td className="px-5 py-3.5 font-medium text-gray-800">{p.name}</td>
                      <td className="px-5 py-3.5 text-gray-500">{p.category.name}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-xs">
                          {p.unit === "KG" ? "กก." : "ชิ้น"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-green-600 tabular-nums">
                        ฿{formatMoney(p.pricePerUnit)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => toggleActive(p)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${p.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                          {p.isActive ? "เปิด" : "ปิด"}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700 text-xs font-medium transition-colors">
                          แก้ไข
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <Modal title={editing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"} onClose={() => setShowModal(false)} onSave={handleSave} saving={saving} error={error}>
          <div>
            <FieldLabel>หมวดหมู่</FieldLabel>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>ชื่อสินค้า</FieldLabel>
            <FieldInput type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น ทองแดง, โทรทัศน์" />
          </div>
          <div>
            <FieldLabel>หน่วย</FieldLabel>
            <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none">
              <option value="KG">กิโลกรัม (กก.)</option>
              <option value="PIECE">ชิ้น (ชิ้น)</option>
            </select>
          </div>
          <div>
            <FieldLabel>ราคารับซื้อ (บาท / {form.unit === "KG" ? "กก." : "ชิ้น"})</FieldLabel>
            <FieldInput type="number" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} placeholder="0" min="0" step="0.01" />
          </div>
        </Modal>
      )}
    </div>
  );
}
