"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Pencil, Check, History, Search, ChevronDown } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

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
    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
      <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between shrink-0">
        <h2 className="text-base font-medium text-gray-900">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200"><X className="w-4 h-4" /></button>
      </div>
      <div className="px-6 py-5 space-y-4 flex-1 overflow-y-auto">{children}</div>
      {error && <div className="mx-6 mb-3 bg-red-50 text-red-600 rounded-xl px-4 py-2.5 text-sm shrink-0">{error}</div>}
      <div className="px-6 pb-5 flex gap-2.5 shrink-0 border-t border-gray-50 pt-4">
        <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">ยกเลิก</button>
        <button onClick={onSave} disabled={saving} className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
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
  <input {...props} className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-emerald-400 focus:outline-none transition-all ${props.className ?? ""}`} />
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
  const [toggleConfirm, setToggleConfirm] = useState<Product | null>(null);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

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
    setToggleConfirm(null);
    loadData();
  };

  const startInlineEdit = (p: Product) => {
    setInlineEditId(p.id);
    setInlinePrice(String(p.pricePerUnit));
    setTimeout(() => { inlineRef.current?.focus(); inlineRef.current?.select(); }, 50);
  };

  const cancelInlineEdit = () => setInlineEditId(null);

  const saveInlinePrice = async (p: Product) => {
    const price = parseFloat(inlinePrice);
    if (isNaN(price) || price < 0) { setInlineEditId(null); return; }
    setInlineEditId(null);
    await fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pricePerUnit: price }),
    });
    loadData();
    if (historyProductId === p.id) loadHistory(p.id);
  };

  const loadHistory = async (productId: string) => {
    setLoadingHistory(true);
    setHistoryProductId(productId);
    const res = await fetch(`/api/products/${productId}/price-history`);
    if (res.ok) setPriceHistory(await res.json());
    setLoadingHistory(false);
  };

  const closeHistory = () => { setHistoryProductId(null); setPriceHistory([]); };

  const filtered = products.filter((p) => {
    if (filterCat && p.categoryId !== filterCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Find product for history dialog title
  const historyProduct = products.find(p => p.id === historyProductId);

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-2">
        <p className="text-gray-400 text-xs font-medium">สินค้าทั้งหมด {filtered.length} รายการ</p>
        <button onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-sm shadow-emerald-500/30">
          <Plus className="w-4 h-4" /> เพิ่มสินค้า
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="ค้นหาสินค้า..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:border-emerald-400 focus:outline-none shadow-sm" />
        </div>
        {/* Custom category dropdown */}
        <div className="relative">
          <button
            onClick={() => setCatDropdownOpen(v => !v)}
            className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white shadow-sm whitespace-nowrap min-w-[100px] justify-between"
          >
            <span className="text-gray-700 font-medium">
              {filterCat ? (categories.find(c => c.id === filterCat)?.name ?? "ทุกหมวด") : "ทุกหมวด"}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${catDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {catDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setCatDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-20 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[140px]"
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                {[{ id: "", name: "ทุกหมวด" }, ...categories].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setFilterCat(c.id); setCatDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                      filterCat === c.id
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    }`}
                  >
                    {filterCat === c.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                    {c.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl py-14 text-center text-gray-400 shadow-sm border border-gray-100">
          <p className="text-sm">ไม่พบสินค้า</p>
        </div>
      ) : (
        <>
          {/* Card list (mobile + desktop) */}
          <div className="space-y-2">
            {filtered.map((p) => (
              <div key={p.id}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all ${!p.isActive ? "opacity-50" : ""}`}
                style={{ border: "1px solid #f0fdf4" }}>
                <div className="flex items-stretch">
                  {/* Left accent */}
                  <div className={`w-1 shrink-0 rounded-l-2xl ${p.isActive ? "bg-emerald-400" : "bg-gray-300"}`} />
                  <div className="flex-1 min-w-0 px-4 py-3.5">
                    {/* Top row: name + price */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-gray-900 text-base leading-tight">{p.name}</p>
                          {p.customPrice && (
                            <span className="text-[11px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-md font-semibold">กำหนดเอง</span>
                          )}
                          {!p.isActive && (
                            <span className="text-[11px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md font-semibold">ปิด</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs mt-0.5">{p.category.name} · {p.unit === "KG" ? "กก." : "ชิ้น"}</p>
                      </div>

                      {/* Price */}
                      {!p.customPrice && (
                        <div className="shrink-0">
                          {inlineEditId === p.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                ref={inlineRef}
                                type="number"
                                value={inlinePrice}
                                onChange={(e) => setInlinePrice(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveInlinePrice(p);
                                  if (e.key === "Escape") cancelInlineEdit();
                                }}
                                className="w-20 border-2 border-emerald-400 rounded-xl px-2 py-1.5 text-base font-bold text-center focus:outline-none tabular-nums"
                                min="0" step="0.5" inputMode="decimal"
                              />
                              <button
                                onClick={() => saveInlinePrice(p)}
                                className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center active:bg-emerald-700 shrink-0">
                                <Check className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={cancelInlineEdit}
                                className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center active:bg-gray-200 shrink-0">
                                <X className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => startInlineEdit(p)}
                              className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 active:bg-emerald-100 transition-colors">
                              <span className="text-emerald-700 font-bold text-base tabular-nums">฿{formatMoney(p.pricePerUnit)}</span>
                              <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                          )}
                        </div>
                      )}
                      {p.customPrice && (
                        <span className="text-purple-400 text-sm font-medium shrink-0">ราคาเอง</span>
                      )}
                    </div>

                    {/* Bottom row: actions */}
                    {inlineEditId !== p.id && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                        <button onClick={() => setToggleConfirm(p)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${p.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-gray-100 text-gray-500"}`}>
                          {p.isActive ? "เปิดรับซื้อ" : "ปิดรับซื้อ"}
                        </button>
                        <button onClick={() => openEdit(p)}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-100 transition-colors">
                          แก้ไข
                        </button>
                        {!p.customPrice && (
                          <button onClick={() => loadHistory(p.id)}
                            className="w-10 py-2 rounded-xl text-xs font-medium bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center transition-colors active:bg-amber-100">
                            <History className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {toggleConfirm && (
        <ConfirmModal
          title={toggleConfirm.isActive ? "ปิดรับซื้อสินค้านี้?" : "เปิดรับซื้อสินค้านี้?"}
          description={toggleConfirm.isActive
            ? `"${toggleConfirm.name}" จะไม่แสดงให้ป้าๆ เลือก`
            : `"${toggleConfirm.name}" จะกลับมาแสดงในหน้ารับซื้อ`}
          variant={toggleConfirm.isActive ? "danger" : "success"}
          confirmLabel={toggleConfirm.isActive ? "ปิดรับซื้อ" : "เปิดรับซื้อ"}
          onConfirm={() => toggleActive(toggleConfirm)}
          onCancel={() => setToggleConfirm(null)}
        />
      )}

      {/* ── Price history dialog ── */}
      {historyProductId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm sm:p-4"
          onClick={closeHistory}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-50">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <History className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">ประวัติการปรับราคา</p>
                <p className="font-bold text-gray-900 text-base leading-tight truncate">{historyProduct?.name}</p>
              </div>
              <button onClick={closeHistory}
                className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 active:bg-gray-200">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            {/* Body */}
            <div className="px-5 py-4 max-h-80 overflow-y-auto">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
                </div>
              ) : priceHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">ยังไม่มีการปรับราคา</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {priceHistory.map((h) => (
                    <div key={h.id} className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                      <span className="text-amber-700 text-xs font-medium">
                        {new Date(h.changedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="line-through text-gray-400 tabular-nums text-xs">฿{formatMoney(h.oldPrice)}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-emerald-600 font-bold tabular-nums">฿{formatMoney(h.newPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 pb-5" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
              <button onClick={closeHistory}
                className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-semibold active:bg-gray-200">
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"} onClose={() => setShowModal(false)} onSave={handleSave} saving={saving} error={error}>
          <div>
            <FieldLabel>หมวดหมู่</FieldLabel>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-emerald-400 focus:outline-none">
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
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-emerald-400 focus:outline-none">
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
