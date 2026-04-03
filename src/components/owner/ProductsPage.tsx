"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Pencil, Check, History, ChevronDown, ChevronUp } from "lucide-react";

interface Category { id: string; name: string; }
interface Product {
  id: string; name: string; unit: string; pricePerUnit: number;
  customPrice: boolean; isActive: boolean; categoryId: string; category: Category;
}
interface PriceHistoryEntry {
  id: string; oldPrice: number; newPrice: number; changedAt: string;
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
  const [form, setForm] = useState({ categoryId: "", name: "", unit: "KG", pricePerUnit: "", customPrice: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlinePrice, setInlinePrice] = useState("");
  const inlineRef = useRef<HTMLInputElement>(null);
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [pr, cr] = await Promise.all([fetch("/api/products?includeInactive=true"), fetch("/api/categories")]);
    setProducts(await pr.json());
    setCategories(await cr.json());
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ categoryId: categories[0]?.id ?? "", name: "", unit: "KG", pricePerUnit: "", customPrice: false });
    setError(""); setShowModal(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ categoryId: p.categoryId, name: p.name, unit: p.unit, pricePerUnit: String(p.pricePerUnit), customPrice: p.customPrice });
    setError(""); setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    if (!form.name || !form.categoryId) { setError("กรุณากรอกข้อมูลให้ครบ"); return; }
    if (!form.customPrice && !form.pricePerUnit) { setError("กรุณากรอกราคารับซื้อ"); return; }
    setSaving(true);
    const body = { ...form, pricePerUnit: form.customPrice ? 0 : parseFloat(form.pricePerUnit) };
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

  const startInlineEdit = (p: Product) => {
    setInlineEditId(p.id);
    setInlinePrice(String(p.pricePerUnit));
    setTimeout(() => { inlineRef.current?.focus(); inlineRef.current?.select(); }, 50);
  };

  const saveInlinePrice = async (p: Product) => {
    const price = parseFloat(inlinePrice);
    setInlineEditId(null);
    if (!isNaN(price) && price >= 0) {
      await fetch(`/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricePerUnit: price }),
      });
      loadData();
      if (historyProductId === p.id) loadHistory(p.id);
    }
  };

  const loadHistory = async (productId: string) => {
    setLoadingHistory(true);
    const res = await fetch(`/api/products/${productId}/price-history`);
    if (res.ok) setPriceHistory(await res.json());
    setLoadingHistory(false);
  };

  const toggleHistory = (productId: string) => {
    if (historyProductId === productId) {
      setHistoryProductId(null);
    } else {
      setHistoryProductId(productId);
      loadHistory(productId);
    }
  };

  const filtered = products.filter((p) => {
    if (filterCat && p.categoryId !== filterCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-gray-500 text-sm">สินค้าทั้งหมด {filtered.length} รายการ</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-sm shadow-green-600/25">
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-base">{p.name}</p>
                      {p.customPrice && (
                        <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-lg font-medium">กำหนดเอง</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-0.5">{p.category.name} · {p.unit === "KG" ? "กก." : "ชิ้น"}</p>
                  </div>
                  {/* Inline price edit */}
                  {!p.customPrice && (
                    <div className="shrink-0">
                      {inlineEditId === p.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 text-sm">฿</span>
                          <input
                            ref={inlineRef}
                            type="number"
                            value={inlinePrice}
                            onChange={(e) => setInlinePrice(e.target.value)}
                            onBlur={() => saveInlinePrice(p)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveInlinePrice(p); if (e.key === "Escape") setInlineEditId(null); }}
                            className="w-20 border-2 border-green-400 rounded-xl px-2 py-1.5 text-base font-bold text-center focus:outline-none"
                            min="0"
                            step="0.5"
                            inputMode="decimal"
                          />
                          <button
                            onMouseDown={(e) => { e.preventDefault(); saveInlinePrice(p); }}
                            onTouchStart={(e) => { e.preventDefault(); saveInlinePrice(p); }}
                            className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startInlineEdit(p)}
                          className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-2 active:bg-green-100 transition-colors"
                        >
                          <span className="text-green-700 font-bold text-lg tabular-nums">฿{formatMoney(p.pricePerUnit)}</span>
                          <Pencil className="w-3.5 h-3.5 text-green-500" />
                        </button>
                      )}
                    </div>
                  )}
                  {p.customPrice && (
                    <span className="text-purple-500 text-sm shrink-0">ราคาเอง</span>
                  )}
                </div>
                <div className="flex gap-2 pt-2.5 border-t border-gray-50">
                  <button onClick={() => toggleActive(p)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.isActive ? "เปิดรับซื้อ" : "ปิดรับซื้อ"}
                  </button>
                  <button onClick={() => openEdit(p)}
                    className="flex-1 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 transition-colors">
                    แก้ไข
                  </button>
                  {!p.customPrice && (
                    <button onClick={() => toggleHistory(p.id)}
                      className={`w-9 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-center ${historyProductId === p.id ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400"}`}>
                      <History className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Price history panel */}
                {historyProductId === p.id && (
                  <div className="mt-2 bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <p className="text-amber-700 text-xs font-semibold mb-2 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />ประวัติการปรับราคา
                    </p>
                    {loadingHistory ? (
                      <p className="text-amber-400 text-xs">กำลังโหลด...</p>
                    ) : priceHistory.length === 0 ? (
                      <p className="text-amber-400 text-xs">ยังไม่มีการปรับราคา</p>
                    ) : (
                      <div className="space-y-1.5">
                        {priceHistory.map((h) => (
                          <div key={h.id} className="flex items-center justify-between text-xs">
                            <span className="text-amber-600">
                              {new Date(h.changedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <span className="line-through text-gray-400">฿{formatMoney(h.oldPrice)}</span>
                              <span>→</span>
                              <span className="text-green-600 font-semibold">฿{formatMoney(h.newPrice)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
                      <td className="px-5 py-3.5 text-right font-medium tabular-nums">
                        {p.customPrice ? (
                          <span className="text-purple-500 text-xs bg-purple-50 px-2 py-0.5 rounded-lg">กำหนดเอง</span>
                        ) : inlineEditId === p.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-gray-400 text-sm">฿</span>
                            <input
                              ref={inlineRef}
                              type="number"
                              value={inlinePrice}
                              onChange={(e) => setInlinePrice(e.target.value)}
                              onBlur={() => saveInlinePrice(p)}
                              onKeyDown={(e) => { if (e.key === "Enter") saveInlinePrice(p); if (e.key === "Escape") setInlineEditId(null); }}
                              className="w-24 border-2 border-green-400 rounded-xl px-2 py-1 text-sm font-bold text-center focus:outline-none"
                              min="0" step="0.5" inputMode="decimal"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => startInlineEdit(p)}
                            className="flex items-center gap-1.5 ml-auto text-green-600 hover:bg-green-50 rounded-lg px-2 py-1 transition-colors"
                          >
                            <span>฿{formatMoney(p.pricePerUnit)}</span>
                            <Pencil className="w-3 h-3 text-green-400" />
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => toggleActive(p)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${p.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                          {p.isActive ? "เปิด" : "ปิด"}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700 text-xs font-medium transition-colors">
                            แก้ไข
                          </button>
                          {!p.customPrice && (
                            <button onClick={() => toggleHistory(p.id)}
                              className={`text-xs font-medium transition-colors flex items-center gap-1 ${historyProductId === p.id ? "text-amber-600" : "text-gray-400 hover:text-amber-500"}`}>
                              <History className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
          {/* Toggle: ราคาเอง */}
          <button
            type="button"
            onClick={() => setForm({ ...form, customPrice: !form.customPrice, pricePerUnit: !form.customPrice ? "" : form.pricePerUnit })}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${form.customPrice ? "border-purple-400 bg-purple-50" : "border-gray-200 bg-gray-50"}`}
          >
            <div className="text-left">
              <p className={`text-sm font-medium ${form.customPrice ? "text-purple-700" : "text-gray-700"}`}>ให้ป้ากรอกราคาเอง</p>
              <p className="text-xs text-gray-400 mt-0.5">ราคาจะถูกกรอกตอนรับซื้อ เช่น ค่าอื่นๆ</p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-all relative ${form.customPrice ? "bg-purple-500" : "bg-gray-300"}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.customPrice ? "left-5" : "left-0.5"}`} />
            </div>
          </button>

          {!form.customPrice && (
            <div>
              <FieldLabel>ราคารับซื้อ (บาท / {form.unit === "KG" ? "กก." : "ชิ้น"})</FieldLabel>
              <FieldInput type="number" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} placeholder="0" min="0" step="0.01" />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
