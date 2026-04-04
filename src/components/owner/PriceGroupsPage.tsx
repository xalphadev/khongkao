"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Tag, Plus, X, Check, Pencil, Trash2, AlertCircle,
  ChevronDown, ChevronRight, Users, Save, RotateCcw,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface PriceGroup {
  id: string; name: string; description: string | null;
  color: string | null; isActive: boolean; sortOrder: number;
  customerCount: number; itemCount: number;
}

interface Category {
  id: string; name: string; icon: string | null; color: string | null; sortOrder: number;
  products: Product[];
}

interface Product {
  id: string; name: string; unit: string; pricePerUnit: number;
  customPrice: boolean; categoryId: string;
}

interface PriceGroupItem {
  productId: string; pricePerUnit: number;
}

const GROUP_COLORS = [
  "#16a34a", "#2563eb", "#7c3aed", "#dc2626",
  "#ea580c", "#d97706", "#0891b2", "#db2777",
];

const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// ── Group Form Modal ──────────────────────────────────────────────────────────
function GroupFormModal({ editing, onClose, onSaved }: {
  editing: PriceGroup | null; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [color, setColor] = useState(editing?.color ?? GROUP_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("กรุณาใส่ชื่อกลุ่ม"); return; }
    setSaving(true); setError("");
    try {
      const res = editing
        ? await fetch(`/api/price-groups/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, color }) })
        : await fetch("/api/price-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, color }) });
      if (res.ok) { onSaved(); onClose(); }
      else { const d = await res.json(); setError(d.error ?? "เกิดข้อผิดพลาด"); }
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color }}>
              <Tag className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-gray-800">{editing ? "แก้ไขกลุ่มราคา" : "เพิ่มกลุ่มราคาใหม่"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">ชื่อกลุ่ม *</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น กลุ่ม A, VIP, ราคาพิเศษ"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">คำอธิบาย</label>
            <input
              value={description} onChange={(e) => setDescription(e.target.value)} placeholder="อธิบายกลุ่มนี้..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">สี</label>
            <div className="flex gap-2 flex-wrap">
              {GROUP_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center"
                  style={{ background: c, borderColor: color === c ? "#1f2937" : "transparent" }}>
                  {color === c && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: color, boxShadow: `0 8px 24px ${color}55` }}>
            {saving ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Price Matrix — View mode (label per group) ───────────────────────────────
function PriceMatrixView({ groups, categories, matrix, onEditGroup }: {
  groups: PriceGroup[]; categories: Category[];
  matrix: Record<string, Record<string, string>>;
  onEditGroup: (groupId: string) => void;
}) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(categories.map((c) => c.id)));

  const toggleCat = (catId: string) => setExpandedCats((prev) => {
    const n = new Set(prev); n.has(catId) ? n.delete(catId) : n.add(catId); return n;
  });

  return (
    <div className="space-y-4">
      {/* Group selector cards — horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {groups.map((g) => {
          const overrides = Object.keys(matrix[g.id] ?? {}).length;
          const allCount = categories.flatMap((c) => c.products.filter((p) => !p.customPrice)).length;
          return (
            <button key={g.id} onClick={() => onEditGroup(g.id)}
              className="flex-none w-44 snap-start bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col gap-2 active:scale-[0.97] transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${g.color ?? "#16a34a"}, ${g.color ?? "#16a34a"}aa)` }}>
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <div className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Pencil className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
              <div>
                <p className="font-black text-gray-800 text-base">กลุ่ม {g.name}</p>
                {g.description && <p className="text-gray-400 text-[10px] leading-tight mt-0.5 line-clamp-2">{g.description}</p>}
              </div>
              {/* Override stats + progress */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {overrides > 0
                    ? <span className="text-[10px] font-bold text-white rounded-md px-1.5 py-0.5" style={{ background: g.color ?? "#16a34a" }}>
                        {overrides}/{allCount} สินค้า
                      </span>
                    : <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
                        <AlertCircle className="w-2.5 h-2.5" /> ยังไม่ตั้งราคา
                      </span>
                  }
                </div>
                {allCount > 0 && (
                  <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.round((overrides / allCount) * 100)}%`, background: "rgba(255,255,255,0.8)" }} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-white rounded-lg px-2.5 py-1.5 w-fit"
                style={{ background: g.color ?? "#16a34a" }}>
                แก้ไขราคา <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
        {/* trailing space */}
        <div className="flex-none w-1" />
      </div>

      {/* Read-only price view per category */}
      {categories.map((cat) => {
        const products = cat.products.filter((p) => !p.customPrice);
        if (!products.length) return null;
        const isExpanded = expandedCats.has(cat.id);

        return (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <button onClick={() => toggleCat(cat.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50/80 border-b border-gray-100 active:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: cat.color ?? "#16a34a" }}>
                <Tag className="w-4 h-4 text-white" />
              </div>
              <p className="font-bold text-gray-800 text-sm flex-1 text-left">{cat.name}</p>
              <span className="text-xs text-gray-400 mr-1">{products.length} สินค้า</span>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>

            {isExpanded && (
              <div className="divide-y divide-gray-50">
                {products.map((p) => (
                  <div key={p.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{p.name}</p>
                        <p className="text-gray-400 text-[11px]">{p.unit === "KG" ? "กก." : "ชิ้น"}</p>
                      </div>
                      <span className="text-gray-400 text-xs bg-gray-100 rounded-lg px-2 py-1 tabular-nums font-medium">
                        ปกติ ฿{fmt(p.pricePerUnit)}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {groups.map((g) => {
                        const price = matrix[g.id]?.[p.id];
                        return (
                          <div key={g.id} className="flex-1 min-w-[72px] rounded-xl px-2 py-1.5 text-center"
                            style={{ background: `${g.color ?? "#16a34a"}12`, border: `1.5px solid ${g.color ?? "#16a34a"}30` }}>
                            <p className="text-[9px] font-bold mb-0.5" style={{ color: g.color ?? "#16a34a" }}>กลุ่ม {g.name}</p>
                            <p className="text-sm font-bold tabular-nums text-gray-800">
                              ฿{price ? fmt(parseFloat(price)) : fmt(p.pricePerUnit)}
                            </p>
                            {!price && <p className="text-[9px] text-gray-400">(ใช้ราคาปกติ)</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Price Matrix — Edit mode (inputs for one group) ───────────────────────────
function PriceGroupEditor({ group, categories, initialValues, onSaved, onBack }: {
  group: PriceGroup; categories: Category[];
  initialValues: Record<string, string>;   // productId → pricePerUnit string, only overridden products
  onSaved: (groupId: string, newValues: Record<string, string>) => void;
  onBack: () => void;
}) {
  // values: productId → string (non-empty = overridden, absent/empty = use default)
  const [values, setValues] = useState<Record<string, string>>({ ...initialValues });
  const [saving, setSaving] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(categories.map((c) => c.id)));
  const [filter, setFilter] = useState<"all" | "overridden" | "default">("all");

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  const allProducts = categories.flatMap((c) => c.products.filter((p) => !p.customPrice));
  const overriddenCount = allProducts.filter((p) => (values[p.id] ?? "") !== "").length;
  const defaultCount = allProducts.length - overriddenCount;

  const toggleCat = (catId: string) => setExpandedCats((prev) => {
    const n = new Set(prev); n.has(catId) ? n.delete(catId) : n.add(catId); return n;
  });

  const clearAll = () => setValues({});
  const setVal = (productId: string, val: string) => setValues((prev) => ({ ...prev, [productId]: val }));
  const clearVal = (productId: string) => setValues((prev) => { const n = { ...prev }; delete n[productId]; return n; });

  const handleSave = async () => {
    setSaving(true);
    const items = allProducts.map((p) => {
      const val = values[p.id];
      return { productId: p.id, pricePerUnit: val !== undefined && val !== "" ? parseFloat(val) : null };
    });
    await fetch(`/api/price-groups/${group.id}/items`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }),
    });
    setSaving(false);
    onSaved(group.id, { ...values });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: `linear-gradient(135deg, ${group.color ?? "#16a34a"}, ${group.color ?? "#16a34a"}88)` }}>
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <ChevronRight className="w-5 h-5 text-white rotate-180" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-medium">กำลังแก้ไข</p>
            <p className="text-white font-black text-xl leading-tight">กลุ่ม {group.name}</p>
          </div>
          {isDirty && <span className="text-[10px] bg-white/25 text-white rounded-lg px-2 py-1 font-bold shrink-0">มีการแก้ไข</span>}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 divide-x divide-white/20 border-t border-white/20">
          <div className="flex flex-col items-center py-2.5 px-3">
            <p className="text-white font-black text-xl leading-tight">{overriddenCount}</p>
            <p className="text-white/70 text-[10px] mt-0.5">สินค้ากำหนดราคาเอง</p>
          </div>
          <div className="flex flex-col items-center py-2.5 px-3">
            <p className="text-white font-black text-xl leading-tight">{defaultCount}</p>
            <p className="text-white/70 text-[10px] mt-0.5">สินค้าใช้ราคาปกติ</p>
          </div>
        </div>
      </div>

      {/* Info + quick actions */}
      <div className="bg-blue-50 rounded-2xl px-4 py-3 border border-blue-100 space-y-2">
        <p className="text-blue-700 text-xs font-semibold">วิธีกำหนดราคา</p>
        <ul className="text-blue-600 text-xs space-y-1">
          <li>• <strong>ใส่ราคา</strong> = สินค้านี้ใช้ราคากลุ่ม (ต่างจากปกติ)</li>
          <li>• <strong>ช่องว่าง / กด ✕</strong> = ใช้ราคาปกติ ไม่ต้องกำหนด</li>
          <li>• ไม่ต้องกำหนดทุกสินค้า — กำหนดเฉพาะที่ต้องการ</li>
        </ul>
        {overriddenCount > 0 && (
          <button onClick={clearAll}
            className="flex items-center gap-1.5 text-red-500 text-xs font-semibold bg-red-50 rounded-xl px-3 py-1.5 border border-red-100">
            <RotateCcw className="w-3 h-3" /> ล้างทั้งหมด → ใช้ราคาปกติทุกสินค้า
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
        {([
          { key: "all",       label: `ทั้งหมด (${allProducts.length})` },
          { key: "overridden", label: `กำหนดเอง (${overriddenCount})` },
          { key: "default",   label: `ราคาปกติ (${defaultCount})` },
        ] as const).map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${filter === f.key ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Product categories */}
      {categories.map((cat) => {
        const allCatProducts = cat.products.filter((p) => !p.customPrice);
        const products = allCatProducts.filter((p) => {
          const hasOverride = (values[p.id] ?? "") !== "";
          if (filter === "overridden") return hasOverride;
          if (filter === "default") return !hasOverride;
          return true;
        });
        if (!products.length) return null;
        const isExpanded = expandedCats.has(cat.id);
        const catOverrideCount = allCatProducts.filter((p) => (values[p.id] ?? "") !== "").length;

        return (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <button onClick={() => toggleCat(cat.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50/80 border-b border-gray-100 active:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: cat.color ?? "#16a34a" }}>
                <Tag className="w-4 h-4 text-white" />
              </div>
              <p className="font-bold text-gray-800 text-sm flex-1 text-left">{cat.name}</p>
              <div className="flex items-center gap-1.5 mr-1">
                {catOverrideCount > 0 && (
                  <span className="text-[10px] text-white rounded-md px-1.5 py-0.5 font-bold" style={{ background: group.color ?? "#16a34a" }}>
                    {catOverrideCount} กำหนดเอง
                  </span>
                )}
                <span className="text-xs text-gray-400">{products.length} รายการ</span>
              </div>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>

            {isExpanded && (
              <div className="divide-y divide-gray-50">
                {products.map((p) => {
                  const val = values[p.id] ?? "";
                  const hasOverride = val !== "";
                  const sessionChanged = val !== (initialValues[p.id] ?? "");

                  return (
                    <div key={p.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${hasOverride ? "" : "opacity-60"}`}>
                      {/* Status dot */}
                      <div className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                        style={{ background: hasOverride ? (group.color ?? "#16a34a") : "#d1d5db" }} />

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-800 text-sm">{p.name}</p>
                          {sessionChanged && (
                            <span className="text-[9px] bg-amber-100 text-amber-600 rounded px-1 font-bold">แก้แล้ว</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-[11px]">
                          {p.unit === "KG" ? "กก." : "ชิ้น"}
                          {hasOverride
                            ? <span className="ml-1" style={{ color: group.color ?? "#16a34a" }}>• ราคากลุ่มนี้</span>
                            : <span className="ml-1 text-gray-400">• ใช้ราคาปกติ ฿{fmt(p.pricePerUnit)}</span>
                          }
                        </p>
                      </div>

                      {/* Input */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasOverride && (
                          <button onClick={() => clearVal(p.id)}
                            className="w-6 h-6 rounded-lg bg-red-50 text-red-400 flex items-center justify-center active:scale-95">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none font-medium"
                            style={{ color: hasOverride ? (group.color ?? "#16a34a") : "#d1d5db" }}>฿</span>
                          <input
                            type="number" min="0" step="0.01"
                            value={val}
                            onChange={(e) => setVal(p.id, e.target.value)}
                            placeholder={fmt(p.pricePerUnit)}
                            inputMode="decimal"
                            className="w-28 pl-7 pr-2 py-2.5 rounded-xl text-right text-base tabular-nums focus:outline-none transition-all"
                            style={{
                              border: `2px solid ${hasOverride ? (group.color ?? "#16a34a") : "#e5e7eb"}`,
                              color: hasOverride ? "#1f2937" : "#9ca3af",
                              background: hasOverride ? `${group.color ?? "#16a34a"}10` : "#f9fafb",
                              fontWeight: hasOverride ? 700 : 400,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-3 flex gap-2.5">
          <button onClick={onBack}
            className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl bg-gray-100 text-gray-600 text-sm font-semibold active:scale-97 transition-all">
            <X className="w-4 h-4" /> ยกเลิก
          </button>
          <button onClick={handleSave} disabled={saving || !isDirty}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-base disabled:opacity-40 transition-all active:scale-[0.98] shadow-lg"
            style={{ background: isDirty ? (group.color ?? "#16a34a") : "#e5e7eb", boxShadow: isDirty ? `0 8px 20px ${group.color ?? "#16a34a"}40` : "none" }}>
            {saving ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "กำลังบันทึก..." : `บันทึกกลุ่ม ${group.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Price Matrix orchestrator ─────────────────────────────────────────────────
function PriceMatrix({ groups, categories }: {
  groups: PriceGroup[]; categories: Category[];
}) {
  const [matrix, setMatrix] = useState<Record<string, Record<string, string>>>({});
  const [loaded, setLoaded] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const loadAllGroupItems = useCallback(async () => {
    if (!groups.length) return;
    const results = await Promise.all(
      groups.map((g) => fetch(`/api/price-groups/${g.id}/items`).then((r) => r.json()))
    );
    const m: Record<string, Record<string, string>> = {};
    groups.forEach((g, i) => {
      m[g.id] = {};
      (results[i] as PriceGroupItem[]).forEach((item) => {
        m[g.id][item.productId] = String(item.pricePerUnit);
      });
    });
    setMatrix(m);
    setLoaded(true);
  }, [groups]);

  useEffect(() => { loadAllGroupItems(); }, [loadAllGroupItems]);

  const handleSaved = (groupId: string, newValues: Record<string, string>) => {
    setMatrix((prev) => ({ ...prev, [groupId]: newValues }));
    setEditingGroupId(null);
  };

  const allProducts = categories.flatMap((c) => c.products.filter((p) => !p.customPrice));
  if (!allProducts.length) return <div className="text-center py-10 text-gray-400">ไม่มีสินค้า</div>;

  if (!loaded) return (
    <div className="flex justify-center py-10">
      <div className="w-8 h-8 border-[3px] border-purple-200 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );

  const editingGroup = editingGroupId ? groups.find((g) => g.id === editingGroupId) : null;

  if (editingGroup) {
    return (
      <PriceGroupEditor
        group={editingGroup}
        categories={categories}
        initialValues={matrix[editingGroup.id] ?? {}}
        onSaved={handleSaved}
        onBack={() => setEditingGroupId(null)}
      />
    );
  }

  return (
    <PriceMatrixView
      groups={groups}
      categories={categories}
      matrix={matrix}
      onEditGroup={setEditingGroupId}
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PriceGroupsPage() {
  const [groups, setGroups] = useState<PriceGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"groups" | "matrix">("groups");
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PriceGroup | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PriceGroup | null>(null);

  const loadGroups = useCallback(async () => {
    const res = await fetch("/api/price-groups");
    if (res.ok) setGroups(await res.json());
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const [gRes, cRes] = await Promise.all([
      fetch("/api/price-groups"),
      fetch("/api/categories"),
    ]);
    if (gRes.ok) setGroups(await gRes.json());
    if (cRes.ok) setCategories(await cRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await fetch(`/api/price-groups/${confirmDelete.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    loadGroups();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-[3px] border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  const totalProducts = categories.flatMap((c) => c.products.filter((p) => !p.customPrice)).length;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="rounded-3xl overflow-hidden shadow-md"
        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)" }}>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">ระบบราคาลูกค้า</p>
              <p className="text-white font-black text-2xl mt-0.5">กลุ่มราคา</p>
            </div>
            <button onClick={() => { setEditingGroup(null); setShowForm(true); }}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all">
              <Plus className="w-4 h-4" /> เพิ่มกลุ่ม
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/20 border-t border-white/20">
          {[
            { label: "กลุ่มราคา", value: String(groups.length) },
            { label: "ลูกค้าในกลุ่ม", value: String(groups.reduce((s, g) => s + g.customerCount, 0)) },
            { label: "สินค้ามีราคากลุ่ม", value: String(Math.max(...groups.map((g) => g.itemCount), 0)) },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-3">
              <p className="text-white font-black text-xl leading-tight">{s.value}</p>
              <p className="text-white/70 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
        {(["groups", "matrix"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"}`}>
            {t === "groups" ? "กลุ่มราคา" : "ตารางราคา"}
          </button>
        ))}
      </div>

      {/* ── Tab: Groups ── */}
      {tab === "groups" && (
        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-50 flex items-center justify-center">
                <Tag className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-semibold">ยังไม่มีกลุ่มราคา</p>
              <p className="text-gray-400 text-sm mt-1">กดปุ่ม "เพิ่มกลุ่ม" เพื่อสร้างกลุ่มราคาแรก</p>
            </div>
          ) : groups.map((g) => (
            <div key={g.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3.5 border border-gray-100">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${g.color ?? "#16a34a"}, ${g.color ?? "#16a34a"}cc)` }}>
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-800 text-base">{g.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md text-white font-semibold" style={{ background: g.color ?? "#16a34a" }}>
                    กลุ่ม
                  </span>
                </div>
                {g.description && <p className="text-gray-400 text-xs mt-0.5 truncate">{g.description}</p>}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {g.customerCount} ลูกค้า
                  </span>
                  {totalProducts > 0 && (() => {
                    const pct = Math.round((g.itemCount / totalProducts) * 100);
                    if (g.itemCount === 0) {
                      return (
                        <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 rounded-md px-1.5 py-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> ยังไม่ได้ตั้งราคา
                        </span>
                      );
                    }
                    if (g.itemCount < totalProducts) {
                      return (
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 rounded-md px-1.5 py-0.5">
                          {g.itemCount}/{totalProducts} สินค้า ({pct}%)
                        </span>
                      );
                    }
                    return (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md px-1.5 py-0.5">
                        ✓ ครบ {totalProducts} สินค้า
                      </span>
                    );
                  })()}
                </div>
                {totalProducts > 0 && g.itemCount > 0 && (
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.round((g.itemCount / totalProducts) * 100)}%`, background: g.color ?? "#16a34a" }} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setEditingGroup(g); setShowForm(true); }}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setConfirmDelete(g)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Info card */}
          {groups.length > 0 && (
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <p className="text-blue-700 text-sm font-semibold mb-1">ลำดับการใช้ราคา</p>
              <ol className="text-blue-600 text-xs space-y-1 list-decimal list-inside">
                <li>ราคาเฉพาะบุคคล (override ในหน้าข้อมูลลูกค้า)</li>
                <li>ราคากลุ่ม (กำหนดในตารางราคา)</li>
                <li>ราคาปกติ (ค่าเริ่มต้นของสินค้า)</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Matrix ── */}
      {tab === "matrix" && (
        groups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <Tag className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="text-gray-500 font-semibold">ยังไม่มีกลุ่มราคา</p>
            <p className="text-gray-400 text-sm mt-1">สร้างกลุ่มราคาก่อนใน tab "กลุ่มราคา"</p>
          </div>
        ) : (
          <>
            {/* Alert: groups with no prices configured */}
            {groups.some((g) => g.itemCount === 0) && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-700 text-sm font-semibold">มีกลุ่มที่ยังไม่ได้ตั้งราคา</p>
                  <p className="text-amber-600 text-xs mt-0.5">
                    {groups.filter((g) => g.itemCount === 0).map((g) => `กลุ่ม ${g.name}`).join(", ")}
                    {" "}— ลูกค้าในกลุ่มนี้จะได้รับราคาปกติจนกว่าจะตั้งราคา
                  </p>
                </div>
              </div>
            )}
            <PriceMatrix groups={groups} categories={categories} />
          </>
        )
      )}

      {showForm && (
        <GroupFormModal
          editing={editingGroup}
          onClose={() => { setShowForm(false); setEditingGroup(null); }}
          onSaved={loadGroups}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          variant="danger"
          title={`ลบกลุ่ม "${confirmDelete.name}"?`}
          description={`ลูกค้า ${confirmDelete.customerCount} คนในกลุ่มนี้จะกลับไปใช้ราคาปกติ`}
          confirmLabel="ลบกลุ่ม"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
