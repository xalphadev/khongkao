"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, Search, Plus, X, Phone, MapPin, FileText, User,
  ChevronRight, Wallet, ShoppingBag, Calendar,
  ArrowLeft, Tag, Edit2, Check, AlertCircle, Pencil, Save, RotateCcw,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface PriceGroup {
  id: string; name: string; color: string | null; description: string | null;
}

interface CustomerSummary {
  id: string; name: string; nickname: string | null;
  phone: string | null; isActive: boolean; createdAt: string;
  billCount: number; lastVisit: string | null;
  priceGroupId: string | null;
}

interface TransactionItem {
  productName: string; quantity: number; unit: string; subtotal: number;
}

interface Transaction {
  id: string; totalAmount: number; createdAt: string;
  customerName: string | null; note: string | null;
  staff: { name: string }; items: TransactionItem[];
}

interface CustomerDetail extends CustomerSummary {
  totalSpend: number;
  address: string | null; notes: string | null;
  transactions: Transaction[];
}

interface Category {
  id: string; name: string; sortOrder: number;
  products: ProductInfo[];
}

interface ProductInfo {
  id: string; name: string; unit: string; pricePerUnit: number; customPrice: boolean;
}

interface ResolvedPrice {
  productId: string; pricePerUnit: number; source: "override" | "group" | "default";
}

const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
const fmtDateShort = (d: string) => new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

const EMPTY_FORM = { name: "", nickname: "", phone: "", address: "", notes: "", priceGroupId: "" };

// ── Price Group Badge ─────────────────────────────────────────────────────────
function PriceGroupBadge({ group, small }: { group: PriceGroup | null | undefined; small?: boolean }) {
  if (!group) return <span className={`${small ? "text-[10px]" : "text-xs"} bg-gray-100 text-gray-400 rounded-md px-1.5 py-0.5 font-medium`}>ราคาปกติ</span>;
  return (
    <span className={`${small ? "text-[10px]" : "text-xs"} text-white rounded-md px-1.5 py-0.5 font-semibold`} style={{ background: group.color ?? "#16a34a" }}>
      กลุ่ม {group.name}
    </span>
  );
}

// ── Customer Form Modal ───────────────────────────────────────────────────────
function CustomerFormModal({ editing, priceGroups, onClose, onSaved }: {
  editing: CustomerDetail | null; priceGroups: PriceGroup[];
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState(editing
    ? { name: editing.name, nickname: editing.nickname ?? "", phone: editing.phone ?? "", address: editing.address ?? "", notes: editing.notes ?? "", priceGroupId: editing.priceGroupId ?? "" }
    : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("กรุณาใส่ชื่อลูกค้า"); return; }
    setSaving(true); setError("");
    try {
      const payload = { ...form, priceGroupId: form.priceGroupId || null };
      const res = editing
        ? await fetch(`/api/customers/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { onSaved(); onClose(); }
      else { const d = await res.json(); setError(d.error ?? "เกิดข้อผิดพลาด"); }
    } finally { setSaving(false); }
  };

  const Field = ({ label, id, placeholder, textarea }: { label: string; id: keyof typeof form; placeholder?: string; textarea?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {textarea ? (
        <textarea value={form[id]} onChange={set(id)} placeholder={placeholder} rows={3}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 resize-none bg-gray-50" />
      ) : (
        <input value={form[id]} onChange={set(id)} placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 bg-gray-50" />
      )}
    </div>
  );

  const selectedGroup = priceGroups.find((g) => g.id === form.priceGroupId);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <User className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-gray-800">{editing ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <Field label="ชื่อ *" id="name" placeholder="ชื่อ-นามสกุล" />
          <Field label="ชื่อเล่น / ชื่อที่เรียก" id="nickname" placeholder="ชื่อที่ป้าๆ เรียก" />
          <Field label="เบอร์โทร" id="phone" placeholder="0812345678" />
          <Field label="ที่อยู่" id="address" placeholder="ที่อยู่หรือย่านที่อยู่" />
          <Field label="หมายเหตุ" id="notes" placeholder="ข้อมูลเพิ่มเติม เช่น สินค้าที่มักนำมาขาย" textarea />

          {/* Price Group */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">กลุ่มราคา</label>
            <div className="relative">
              <select
                value={form.priceGroupId} onChange={set("priceGroupId")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 bg-gray-50 appearance-none pr-8"
              >
                <option value="">ราคาปกติ (ไม่มีกลุ่ม)</option>
                {priceGroups.map((g) => (
                  <option key={g.id} value={g.id}>กลุ่ม {g.name}{g.description ? ` — ${g.description}` : ""}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
            </div>
            {selectedGroup && (
              <div className="mt-2 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: selectedGroup.color ?? "#16a34a" }} />
                <p className="text-xs text-gray-600">ลูกค้านี้จะได้รับราคากลุ่ม <strong>{selectedGroup.name}</strong></p>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-6 pt-3 border-t border-gray-100 shrink-0">
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 8px 24px rgba(16,185,129,0.3)" }}>
            {saving ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Transaction Detail Card ───────────────────────────────────────────────────
function TxCard({ tx }: { tx: Transaction }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <button className="w-full flex items-center gap-3 px-4 py-3.5" onClick={() => setOpen((v) => !v)}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}>
          <ShoppingBag className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-gray-800 text-sm">฿{fmt(tx.totalAmount)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(tx.createdAt)} · {tx.staff.name}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs bg-emerald-50 text-emerald-600 rounded-lg px-2 py-0.5 font-medium">{tx.items.length} รายการ</span>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-50 px-4 pb-3 pt-2 space-y-1.5 bg-gray-50/50">
          {tx.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <p className="text-sm text-gray-700 truncate">{item.productName}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-xs text-gray-500">{item.quantity} {item.unit}</span>
                <span className="text-sm font-semibold text-gray-800">฿{fmt(item.subtotal)}</span>
              </div>
            </div>
          ))}
          {tx.note && <p className="text-xs text-gray-400 pt-1 border-t border-gray-100 mt-2">หมายเหตุ: {tx.note}</p>}
        </div>
      )}
    </div>
  );
}

// ── Individual Price Override Section ────────────────────────────────────────
function CustomerPriceOverrides({ customerId, priceGroups }: { customerId: string; priceGroups: PriceGroup[] }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [resolvedPrices, setResolvedPrices] = useState<ResolvedPrice[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [originalOverrides, setOriginalOverrides] = useState<Record<string, string>>({});
  const [priceGroupInfo, setPriceGroupInfo] = useState<{ name: string | null; color: string | null }>({ name: null, color: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const [catRes, pricesRes] = await Promise.all([
      fetch("/api/categories"),
      fetch(`/api/customers/${customerId}/prices`),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (pricesRes.ok) {
      const data = await pricesRes.json();
      setResolvedPrices(data.prices ?? []);
      setPriceGroupInfo({ name: data.priceGroupName, color: data.priceGroupColor });
      const ovMap: Record<string, string> = {};
      (data.prices as ResolvedPrice[]).forEach((p) => {
        if (p.source === "override") ovMap[p.productId] = String(p.pricePerUnit);
      });
      setOverrides(ovMap);
      setOriginalOverrides({ ...ovMap });
    }
    setLoading(false);
    setDirty(false);
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (productId: string, val: string) => {
    setOverrides((prev) => ({ ...prev, [productId]: val }));
    setDirty(true);
  };

  const handleClearOverride = (productId: string) => {
    setOverrides((prev) => { const n = { ...prev }; delete n[productId]; return n; });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const allProducts = categories.flatMap((c) => c.products.filter((p) => !p.customPrice));
    const ovList = allProducts.map((p) => {
      const val = overrides[p.id];
      const parsed = val !== undefined && val !== "" ? parseFloat(val) : null;
      return { productId: p.id, pricePerUnit: parsed };
    });
    await fetch(`/api/customers/${customerId}/prices`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overrides: ovList }),
    });
    await load();
  };

  const handleReset = () => {
    setOverrides({ ...originalOverrides });
    setDirty(false);
  };

  if (loading) return <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" /></div>;

  const overrideCount = Object.keys(overrides).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-800 text-base flex items-center gap-2">
            <Pencil className="w-4 h-4 text-purple-500" /> ราคาเฉพาะบุคคล
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            {priceGroupInfo.name
              ? `ลูกค้านี้อยู่กลุ่ม "${priceGroupInfo.name}" · override จะมีผลเหนือกว่าราคากลุ่ม`
              : "override จะมีผลเหนือกว่าราคาปกติ"}
            {overrideCount > 0 && ` · ${overrideCount} สินค้าถูก override`}
          </p>
        </div>
        {priceGroupInfo.name && (
          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: priceGroupInfo.color ?? "#16a34a" }} />
        )}
      </div>

      {/* Categories */}
      {categories.map((cat) => {
        const products = cat.products.filter((p) => !p.customPrice);
        if (!products.length) return null;
        const isExpanded = expandedCats.has(cat.id);
        const catOverrideCount = products.filter((p) => overrides[p.id] !== undefined).length;

        return (
          <div key={cat.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <button onClick={() => setExpandedCats((prev) => {
              const n = new Set(prev); n.has(cat.id) ? n.delete(cat.id) : n.add(cat.id); return n;
            })} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="font-semibold text-gray-700 text-sm flex-1 text-left">{cat.name}</p>
              {catOverrideCount > 0 && (
                <span className="text-[10px] bg-purple-50 text-purple-600 rounded-md px-1.5 py-0.5 font-semibold">{catOverrideCount} override</span>
              )}
              {isExpanded ? <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>
            {isExpanded && (
              <div className="divide-y divide-gray-50">
                {products.map((p) => {
                  const resolved = resolvedPrices.find((r) => r.productId === p.id);
                  const hasOverride = overrides[p.id] !== undefined && overrides[p.id] !== "";
                  const groupPrice = resolved?.source === "group" ? resolved.pricePerUnit : null;

                  return (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">
                            ปกติ ฿{p.pricePerUnit.toLocaleString()}
                          </span>
                          {groupPrice !== null && (
                            <span className="text-[10px] font-medium" style={{ color: priceGroupInfo.color ?? "#16a34a" }}>
                              กลุ่ม ฿{groupPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-300 pointer-events-none">฿</span>
                          <input
                            type="number" min="0" step="0.01"
                            value={overrides[p.id] ?? ""}
                            onChange={(e) => handleChange(p.id, e.target.value)}
                            placeholder={String(groupPrice ?? p.pricePerUnit)}
                            className="w-24 pl-5 pr-2 py-1.5 rounded-xl text-right text-sm tabular-nums focus:outline-none transition-all"
                            style={{
                              border: `2px solid ${hasOverride ? "#7c3aed" : "#e5e7eb"}`,
                              background: hasOverride ? "#f5f3ff" : "#f9fafb",
                              color: hasOverride ? "#5b21b6" : "#9ca3af",
                            }}
                          />
                        </div>
                        {hasOverride && (
                          <button onClick={() => handleClearOverride(p.id)}
                            className="w-6 h-6 rounded-lg bg-red-50 text-red-400 flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Save bar */}
      <div className="flex gap-2 sticky bottom-0 bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-gray-100 shadow-sm">
        <button onClick={handleReset} disabled={!dirty}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-semibold disabled:opacity-30">
          <RotateCcw className="w-3.5 h-3.5" /> คืนค่า
        </button>
        <button onClick={handleSave} disabled={saving || !dirty}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40"
          style={{ background: dirty ? "linear-gradient(135deg, #7c3aed, #2563eb)" : "#e5e7eb" }}>
          {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "กำลังบันทึก..." : "บันทึกราคาเฉพาะบุคคล"}
        </button>
      </div>
    </div>
  );
}

// ── Customer Detail View ──────────────────────────────────────────────────────
function CustomerDetailView({ customerId, priceGroups, onBack }: {
  customerId: string; priceGroups: PriceGroup[]; onBack: () => void;
}) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<"toggle" | null>(null);
  const [tab, setTab] = useState<"history" | "prices">("history");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/customers/${customerId}`);
    if (res.ok) setCustomer(await res.json());
    setLoading(false);
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async () => {
    if (!customer) return;
    await fetch(`/api/customers/${customer.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...customer, isActive: !customer.isActive }),
    });
    setConfirm(null); load();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );
  if (!customer) return <div className="text-center py-20 text-gray-400">ไม่พบข้อมูลลูกค้า</div>;

  const currentGroup = priceGroups.find((g) => g.id === customer.priceGroupId);

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
        <ArrowLeft className="w-4 h-4" /> กลับรายชื่อลูกค้า
      </button>

      {/* Customer Header */}
      <div className="rounded-3xl overflow-hidden shadow-md"
        style={{ background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)" }}>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-xl leading-tight">{customer.name}</p>
              {customer.nickname && <p className="text-white/80 text-sm mt-0.5">"{customer.nickname}"</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                <PriceGroupBadge group={currentGroup} />
                {customer.phone && (
                  <div className="flex items-center gap-1.5 text-white/80 text-sm">
                    <Phone className="w-3.5 h-3.5" /> {customer.phone}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Edit2 className="w-4 h-4 text-white" />
            </button>
          </div>
          {customer.notes && (
            <div className="mt-3 flex items-start gap-2 bg-white/10 rounded-xl px-3 py-2.5">
              <FileText className="w-4 h-4 text-white/60 mt-0.5 shrink-0" />
              <p className="text-white/80 text-sm">{customer.notes}</p>
            </div>
          )}
          {customer.address && (
            <div className="mt-2 flex items-start gap-2 bg-white/10 rounded-xl px-3 py-2">
              <MapPin className="w-4 h-4 text-white/60 mt-0.5 shrink-0" />
              <p className="text-white/80 text-sm">{customer.address}</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/20 border-t border-white/20">
          {[
            { label: "ยอดรวม", value: `฿${(customer.totalSpend / 1000).toFixed(1)}K` },
            { label: "จำนวนบิล", value: String(customer.billCount) },
            { label: "ล่าสุด", value: customer.lastVisit ? fmtDateShort(customer.lastVisit) : "ยังไม่มี" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-3 px-2">
              <p className="text-white font-black text-lg leading-tight">{s.value}</p>
              <p className="text-white/70 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Toggle active */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${customer.isActive ? "bg-emerald-400" : "bg-gray-300"}`} />
          <p className="text-sm font-medium text-gray-700">สถานะ: {customer.isActive ? "ลูกค้าประจำ" : "ปิดใช้งาน"}</p>
        </div>
        <button onClick={() => setConfirm("toggle")}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${customer.isActive
            ? "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500"
            : "bg-emerald-50 text-emerald-600"}`}>
          {customer.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
        {(["history", "prices"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"}`}>
            {t === "history" ? "ประวัติการขาย" : "ราคาเฉพาะบุคคล"}
          </button>
        ))}
      </div>

      {/* Tab: History */}
      {tab === "history" && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <p className="font-bold text-gray-800 text-base">ประวัติการขายของ</p>
            <span className="text-xs bg-emerald-50 text-emerald-600 rounded-lg px-2 py-0.5 font-medium ml-auto">{customer.transactions.length} บิล</span>
          </div>
          {customer.transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">ยังไม่มีประวัติ</p>
            </div>
          ) : (
            <div className="space-y-2.5">{customer.transactions.map((tx) => <TxCard key={tx.id} tx={tx} />)}</div>
          )}
        </div>
      )}

      {/* Tab: Individual Prices */}
      {tab === "prices" && <CustomerPriceOverrides customerId={customerId} priceGroups={priceGroups} />}

      {editing && (
        <CustomerFormModal editing={customer} priceGroups={priceGroups} onClose={() => setEditing(false)} onSaved={load} />
      )}
      {confirm === "toggle" && (
        <ConfirmModal
          variant={customer.isActive ? "danger" : "success"}
          title={customer.isActive ? "ปิดใช้งานลูกค้า?" : "เปิดใช้งานลูกค้า?"}
          description={`ต้องการ${customer.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}ลูกค้า "${customer.name}" ใช่ไหม?`}
          confirmLabel={customer.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
          onConfirm={handleToggle}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ── Customer List Card ────────────────────────────────────────────────────────
function CustomerCard({ c, priceGroups, onClick }: { c: CustomerSummary; priceGroups: PriceGroup[]; onClick: () => void }) {
  const group = priceGroups.find((g) => g.id === c.priceGroupId);
  return (
    <button onClick={onClick}
      className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3.5 border border-gray-100 shadow-sm active:scale-[0.98] transition-all text-left">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}>
        <User className="w-6 h-6 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-gray-800 text-base truncate">{c.name}</p>
          {c.nickname && <span className="text-xs text-gray-400 shrink-0">"{c.nickname}"</span>}
          {!c.isActive && <span className="text-[10px] bg-gray-100 text-gray-400 rounded-md px-1.5 py-0.5 shrink-0">ปิด</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <PriceGroupBadge group={group} small />
          {c.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
          {c.lastVisit && <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDateShort(c.lastVisit)}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 rounded-lg px-2 py-0.5">{c.billCount} บิล</span>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </button>
  );
}

interface CustomerMeta {
  total: number; page: number; totalPages: number; hasMore: boolean;
  activeCount: number; recentCount: number; newCount: number;
}

const PAGE_LIMIT = 20;

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [meta, setMeta] = useState<CustomerMeta | null>(null);
  const [priceGroups, setPriceGroups] = useState<PriceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [filterGroupId, setFilterGroupId] = useState(""); // "" = all, "none" = no group, else groupId
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(q);
      setCurrentPage(1);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  // Reset page when filter changes
  useEffect(() => { setCurrentPage(1); }, [showInactive, filterGroupId]);

  const fetchPage = useCallback(async (page: number, append: boolean) => {
    if (page === 1) setLoading(true); else setLoadingMore(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
    if (debouncedQ) params.set("q", debouncedQ);
    if (showInactive) params.set("includeInactive", "true");
    if (filterGroupId) params.set("groupId", filterGroupId);
    const [cRes, gRes] = await Promise.all([
      fetch(`/api/customers?${params}`),
      page === 1 ? fetch("/api/price-groups") : Promise.resolve(null),
    ]);
    if (cRes.ok) {
      const data = await cRes.json();
      setCustomers((prev) => append ? [...prev, ...data.customers] : data.customers);
      setMeta(data.meta);
    }
    if (gRes && gRes.ok) setPriceGroups(await gRes.json());
    if (page === 1) setLoading(false); else setLoadingMore(false);
  }, [debouncedQ, showInactive, filterGroupId]);

  // Initial / filter change: always page 1
  useEffect(() => {
    setCurrentPage(1);
    fetchPage(1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, showInactive, filterGroupId]);

  // Reload list without changing page (e.g., after add/edit)
  const reload = useCallback(() => {
    setCurrentPage(1);
    fetchPage(1, false);
  }, [fetchPage]);

  // IntersectionObserver — load next page when sentinel is visible
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && meta?.hasMore && !loadingMore && !loading) {
          const next = currentPage + 1;
          setCurrentPage(next);
          fetchPage(next, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [meta?.hasMore, loadingMore, loading, currentPage, fetchPage]);

  if (selectedId) {
    return <CustomerDetailView customerId={selectedId} priceGroups={priceGroups} onBack={() => { setSelectedId(null); reload(); }} />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl overflow-hidden shadow-md"
        style={{ background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)" }}>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">ข้อมูลลูกค้าประจำ</p>
              <p className="text-white font-black text-2xl mt-0.5">ลูกค้า</p>
            </div>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all">
              <Plus className="w-4 h-4" /> เพิ่มลูกค้า
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/20 border-t border-white/20">
          {[
            { label: "ลูกค้าทั้งหมด", value: String(meta?.activeCount ?? "…") },
            { label: "มาใน 30 วัน", value: String(meta?.recentCount ?? "…") },
            { label: "รายใหม่", value: meta ? "+" + meta.newCount : "…" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-3">
              <p className="text-white font-black text-xl leading-tight">{s.value}</p>
              <p className="text-white/70 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2.5">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ, ชื่อเล่น, เบอร์โทร..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 bg-white shadow-sm" />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>
        <button onClick={() => setShowInactive((v) => !v)}
          className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all ${showInactive ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-400 shadow-sm"}`}>
          ดูทั้งหมด
        </button>
      </div>

      {/* Group filter chips */}
      {priceGroups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-0 scrollbar-none"
          style={{ scrollbarWidth: "none" }}>
          {/* "ทั้งหมด" chip */}
          <button onClick={() => setFilterGroupId("")}
            className={`flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              filterGroupId === ""
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-500 border-gray-200"
            }`}>
            ทั้งหมด
            {filterGroupId === "" && meta && (
              <span className="bg-white/20 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none">{meta.total}</span>
            )}
          </button>
          {/* "ราคาปกติ" chip */}
          <button onClick={() => setFilterGroupId("none")}
            className={`flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              filterGroupId === "none"
                ? "bg-gray-500 text-white border-gray-500"
                : "bg-white text-gray-400 border-gray-200"
            }`}>
            ราคาปกติ
            {filterGroupId === "none" && meta && (
              <span className="bg-white/20 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none">{meta.total}</span>
            )}
          </button>
          {/* Per-group chips */}
          {priceGroups.map((g) => {
            const active = filterGroupId === g.id;
            return (
              <button key={g.id} onClick={() => setFilterGroupId(active ? "" : g.id)}
                className={`flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  active ? "text-white border-transparent" : "bg-white border-gray-200"
                }`}
                style={active
                  ? { background: g.color ?? "#16a34a" }
                  : { color: g.color ?? "#16a34a" }
                }>
                กลุ่ม {g.name}
                {active && meta && (
                  <span className="bg-white/25 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none">{meta.total}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Search result info */}
      {(debouncedQ || filterGroupId) && meta && !loading && (
        <p className="text-xs text-gray-400 px-1">
          พบ <strong className="text-gray-600">{meta.total}</strong> รายการ
          {debouncedQ && <> สำหรับ "<span className="text-gray-600">{debouncedQ}</span>"</>}
          {filterGroupId && filterGroupId !== "none" && (
            <> · กลุ่ม <span style={{ color: priceGroups.find(g => g.id === filterGroupId)?.color ?? "#16a34a" }} className="font-semibold">
              {priceGroups.find(g => g.id === filterGroupId)?.name}
            </span></>
          )}
          {filterGroupId === "none" && <> · ราคาปกติ</>}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-14">
          <div className="w-8 h-8 border-[3px] border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-50 flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-semibold">
            {debouncedQ ? `ไม่พบ "${debouncedQ}"` : filterGroupId ? "ไม่มีลูกค้าในกลุ่มนี้" : "ยังไม่มีลูกค้า"}
          </p>
          {!debouncedQ && !filterGroupId && <p className="text-gray-400 text-sm mt-1">กดปุ่ม "เพิ่มลูกค้า" เพื่อเพิ่มรายชื่อ</p>}
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {customers.map((c) => <CustomerCard key={c.id} c={c} priceGroups={priceGroups} onClick={() => setSelectedId(c.id)} />)}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="py-2 flex justify-center">
            {loadingMore && (
              <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            )}
            {!loadingMore && !meta?.hasMore && customers.length > 0 && (
              <p className="text-xs text-gray-300">แสดงทั้งหมด {meta?.total} รายการ</p>
            )}
          </div>
        </>
      )}

      {showForm && <CustomerFormModal editing={null} priceGroups={priceGroups} onClose={() => setShowForm(false)} onSaved={reload} />}
    </div>
  );
}
