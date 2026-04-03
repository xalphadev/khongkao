"use client";

import { useState, useEffect, useRef } from "react";
import {
  ClipboardList, User, ChevronDown, Pencil, X, Check, ChevronLeft, ChevronRight, Search, Calendar,
  Plus, ArrowLeft, Package, Scale, Hash, Banknote,
} from "lucide-react";
import StaffTabBar from "./StaffTabBar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DatePickerModal from "@/components/ui/DatePickerModal";
import { getIconComponent, getCategoryGradient } from "@/components/owner/CategoriesPage";

interface TransactionItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  productId: string;
}

interface CatProduct {
  id: string; name: string; unit: string; pricePerUnit: number; customPrice: boolean; categoryId: string;
}
interface CatCategory {
  id: string; name: string; icon: string | null; color: string | null; products: CatProduct[];
}

interface Transaction {
  id: string;
  totalAmount: number;
  createdAt: string;
  customerName: string | null;
  note: string | null;
  items: TransactionItem[];
}

function formatMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatTime(s: string) {
  return new Date(s).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}
function localDateString(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatThaiDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("th-TH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return localDateString(d);
}
function isToday(dateStr: string) {
  return dateStr === localDateString();
}

// ── Edit Modal ────────────────────────────────────────────────
type AddStep = null | "category" | "product" | "quantity";

function EditTransactionModal({
  transaction,
  onSave,
  onClose,
}: {
  transaction: Transaction;
  onSave: (updated: Transaction) => void;
  onClose: () => void;
}) {
  const [customerName, setCustomerName] = useState(transaction.customerName ?? "");
  const [items, setItems] = useState<TransactionItem[]>(transaction.items.map((i) => ({ ...i })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [removeConfirmIdx, setRemoveConfirmIdx] = useState<number | null>(null);
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  // ── Add product sub-flow ─────────────────────────────────────
  const [categories, setCategories] = useState<CatCategory[]>([]);
  const [addStep, setAddStep] = useState<AddStep>(null);
  const [addCategory, setAddCategory] = useState<CatCategory | null>(null);
  const [addProduct, setAddProduct] = useState<CatProduct | null>(null);
  const [addQty, setAddQty] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const addQtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    if (addStep === "quantity") setTimeout(() => addQtyRef.current?.focus(), 100);
  }, [addStep]);

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  // Group items by productId
  const itemGroups = (() => {
    const order: string[] = [];
    const map: Record<string, { item: TransactionItem; idx: number }[]> = {};
    items.forEach((item, idx) => {
      if (!order.includes(item.productId)) order.push(item.productId);
      if (!map[item.productId]) map[item.productId] = [];
      map[item.productId].push({ item, idx });
    });
    return order.map(pid => ({
      productId: pid,
      productName: map[pid][0].item.productName,
      unit: map[pid][0].item.unit,
      unitPrice: map[pid][0].item.unitPrice,
      rounds: map[pid],
      totalQty: map[pid].reduce((s, r) => s + r.item.quantity, 0),
      totalSubtotal: map[pid].reduce((s, r) => s + r.item.quantity * r.item.unitPrice, 0),
    }));
  })();

  const updateQty = (idx: number, val: string) => {
    const qty = parseFloat(val) || 0;
    setItems(items.map((item, i) =>
      i === idx ? { ...item, quantity: qty, subtotal: qty * item.unitPrice } : item
    ));
  };
  const updatePrice = (idx: number, val: string) => {
    const price = parseFloat(val) || 0;
    setItems(items.map((item, i) =>
      i === idx ? { ...item, unitPrice: price, subtotal: item.quantity * price } : item
    ));
  };
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const handleAddRound = (group: typeof itemGroups[0]) => {
    setAddProduct({
      id: group.productId, name: group.productName, unit: group.unit,
      pricePerUnit: group.unitPrice, customPrice: false, categoryId: "",
    });
    setAddPrice(String(group.unitPrice));
    setAddQty("");
    setAddStep("quantity");
  };

  const handleConfirmAdd = () => {
    if (!addProduct || !addQty || parseFloat(addQty) <= 0) return;
    if (addProduct.customPrice && (!addPrice || parseFloat(addPrice) <= 0)) return;
    const qty = parseFloat(addQty);
    const price = addProduct.customPrice ? parseFloat(addPrice) : (addPrice ? parseFloat(addPrice) : addProduct.pricePerUnit);
    const newItem: TransactionItem = {
      id: `new-${Date.now()}`,
      productId: addProduct.id,
      productName: addProduct.name,
      quantity: qty, unit: addProduct.unit, unitPrice: price,
      subtotal: qty * price,
    };
    setItems(prev => [...prev, newItem]);
    setExpandedProductIds(prev => new Set([...prev, addProduct!.id]));
    setAddStep(null); setAddProduct(null); setAddCategory(null); setAddQty(""); setAddPrice("");
  };

  const handleAddBack = () => {
    if (addStep === "quantity") { setAddProduct(null); setAddQty(""); setAddPrice(""); setAddStep(addCategory ? "product" : null); }
    else if (addStep === "product") { setAddCategory(null); setAddStep("category"); }
    else if (addStep === "category") setAddStep(null);
  };

  const handleSave = async () => {
    setError("");
    const valid = items.filter((i) => i.quantity > 0);
    if (valid.length === 0) { setError("ต้องมีสินค้าอย่างน้อย 1 รายการ"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: customerName || null, items: valid }),
      });
      if (res.ok) {
        const updated = await res.json();
        onSave({ ...transaction, ...updated });
      } else {
        const d = await res.json();
        setError(d.error ?? "เกิดข้อผิดพลาด");
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl flex flex-col" style={{ maxHeight: "92vh" }}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0 border-b border-gray-100">
          {addStep ? (
            <button onClick={handleAddBack} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8" />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">
              {addStep === "category" && "เลือกหมวดหมู่"}
              {addStep === "product" && `เลือกสินค้า — ${addCategory?.name}`}
              {addStep === "quantity" && `ใส่จำนวน — ${addProduct?.name}`}
              {!addStep && "แก้ไขบิล"}
            </h3>
            <p className="text-gray-400 text-xs">
              {!addStep && `#${transaction.id.slice(-8).toUpperCase()}`}
              {addStep === "quantity" && `${addProduct?.unit === "KG" ? "กิโลกรัม" : "ชิ้น"}`}
            </p>
          </div>
          {!addStep && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Main view: items list ── */}
        {!addStep && (
          <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-3 pt-3">
            {/* Customer name */}
            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3 border-2 border-transparent focus-within:border-blue-400 transition-all">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                placeholder="ชื่อลูกค้า (ไม่บังคับ)" maxLength={40} />
              {customerName && <button onClick={() => setCustomerName("")} className="text-gray-300 shrink-0"><X className="w-3.5 h-3.5" /></button>}
            </div>

            {/* Grouped items */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-gray-400 text-[11px] font-medium flex-1">{itemGroups.length} สินค้า · {items.length} รอบ</span>
                <span className="text-gray-400 text-[11px] font-medium pr-1">ยอดรวม</span>
              </div>
              {itemGroups.map((group, gi) => {
                const isExpanded = expandedProductIds.has(group.productId);
                return (
                  <div key={group.productId} className={gi > 0 ? "border-t border-gray-100" : ""}>
                    {/* Group row */}
                    <div className="flex items-center gap-2 px-3 py-3">
                      <button
                        onClick={() => setExpandedProductIds(prev => { const n = new Set(prev); isExpanded ? n.delete(group.productId) : n.add(group.productId); return n; })}
                        className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0"
                      >{gi + 1}</button>
                      <button
                        onClick={() => setExpandedProductIds(prev => { const n = new Set(prev); isExpanded ? n.delete(group.productId) : n.add(group.productId); return n; })}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-gray-900 font-medium text-sm leading-tight truncate">{group.productName}</p>
                        <p className="text-gray-400 text-[11px]">
                          <span className="bg-blue-50 text-blue-500 rounded px-1 py-0.5 text-[10px] font-medium mr-1">{group.rounds.length} รอบ</span>
                          {group.totalQty} {group.unit === "KG" ? "กก." : "ชิ้น"}
                        </p>
                      </button>
                      <p className="text-green-600 font-semibold text-sm tabular-nums shrink-0">฿{formatMoney(group.totalSubtotal)}</p>
                      <button onClick={() => handleAddRound(group)}
                        className="flex items-center gap-0.5 text-[11px] text-green-600 font-medium bg-green-50 border border-green-100 px-2 py-1 rounded-lg shrink-0">
                        <Plus className="w-3 h-3" /> รอบ
                      </button>
                      <span className={`text-gray-300 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                    {/* Round rows */}
                    {isExpanded && (
                      <div className="bg-gray-50/60 border-t border-gray-100">
                        {group.rounds.map(({ item, idx }, ri) => (
                          <div key={idx} className={`flex items-center gap-1 px-3 py-2 ${ri > 0 ? "border-t border-gray-100" : ""}`}>
                            <span className="text-gray-300 text-[10px] w-10 pl-2 shrink-0">รอบ {ri + 1}</span>
                            <input type="number" value={item.quantity || ""} onChange={(e) => updateQty(idx, e.target.value)}
                              className="w-14 border border-gray-200 rounded-lg px-1 py-1 text-xs text-center focus:border-blue-400 focus:outline-none bg-white tabular-nums"
                              min="0" step={item.unit === "KG" ? "0.1" : "1"} inputMode="decimal" />
                            <span className="text-gray-300 text-xs">×</span>
                            <input type="number" value={item.unitPrice || ""} onChange={(e) => updatePrice(idx, e.target.value)}
                              className="w-14 border border-gray-200 rounded-lg px-1 py-1 text-xs text-center focus:border-blue-400 focus:outline-none bg-white tabular-nums"
                              min="0" step="0.01" inputMode="decimal" />
                            <p className="text-green-600 text-xs font-medium tabular-nums flex-1 text-right">฿{formatMoney(item.quantity * item.unitPrice)}</p>
                            <button onClick={() => setRemoveConfirmIdx(idx)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-50 text-red-400 ml-1 shrink-0">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Add product button */}
              <div className="border-t border-dashed border-gray-200">
                <button onClick={() => setAddStep("category")}
                  className="w-full flex items-center justify-center gap-2 py-3 text-green-600 text-sm font-medium active:bg-green-50 transition-colors">
                  <Plus className="w-4 h-4" /> เพิ่มสินค้า
                </button>
              </div>
            </div>

            <div className="bg-green-50 rounded-2xl px-4 py-3 flex items-center justify-between">
              <p className="text-green-700 text-sm font-medium">ยอดรวมทั้งหมด</p>
              <p className="text-green-700 font-bold text-lg tabular-nums">฿{formatMoney(total)}</p>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </div>
        )}

        {/* ── Add step: Category ── */}
        {addStep === "category" && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => {
                const grad = getCategoryGradient(cat.color ?? "#16a34a");
                const CIcon = getIconComponent(cat.icon ?? "Package");
                return (
                  <button key={cat.id} onClick={() => { setAddCategory(cat); setAddStep("product"); }}
                    className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.97] transition-all flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}>
                      <CIcon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-800 font-medium text-sm text-center leading-tight">{cat.name}</p>
                    <p className="text-gray-400 text-xs">{cat.products.length} สินค้า</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Add step: Product ── */}
        {addStep === "product" && addCategory && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
            {addCategory.products.map(product => (
              <button key={product.id}
                onClick={() => { setAddProduct(product); setAddPrice(String(product.pricePerUnit)); setAddQty(""); setAddStep("quantity"); }}
                className="w-full bg-white rounded-2xl px-4 py-4 shadow-sm active:scale-[0.98] transition-all flex items-center gap-4">
                <div className="flex-1 text-left">
                  <p className="text-gray-800 font-medium">{product.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{product.unit === "KG" ? "วัดเป็นกิโลกรัม" : "วัดเป็นชิ้น"}</p>
                </div>
                <div className="text-right shrink-0">
                  {product.customPrice
                    ? <p className="text-purple-600 font-medium text-sm">กรอกราคาเอง</p>
                    : <><p className="text-green-600 font-medium text-lg tabular-nums">฿{product.pricePerUnit.toLocaleString()}</p>
                       <p className="text-gray-400 text-xs">/{product.unit === "KG" ? "กก." : "ชิ้น"}</p></>
                  }
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Add step: Quantity ── */}
        {addStep === "quantity" && addProduct && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <p className="font-medium text-gray-900">{addProduct.name}</p>
              <p className="text-gray-400 text-sm mt-0.5">{addProduct.unit === "KG" ? "วัดเป็นกิโลกรัม" : "วัดเป็นชิ้น"}</p>
            </div>
            <div className="bg-white rounded-2xl px-5 py-6 shadow-sm space-y-4">
              {/* Price input (for custom price or allow override) */}
              <div>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-3">
                  <Banknote className="w-4 h-4" />
                  <span>ราคารับซื้อ (บาท / {addProduct.unit === "KG" ? "กก." : "ชิ้น"})</span>
                </div>
                <input type="number" value={addPrice} onChange={(e) => setAddPrice(e.target.value)}
                  className="w-full bg-white rounded-2xl px-4 py-4 text-4xl font-medium text-center focus:outline-none tabular-nums"
                  style={{ border: `3px solid ${addProduct.customPrice ? "#a855f7" : "#60a5fa"}` }}
                  placeholder="0" min="0" step="0.01" inputMode="decimal" />
              </div>
              {/* Quantity input */}
              <div>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-3">
                  {addProduct.unit === "KG" ? <Scale className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                  <span>{addProduct.unit === "KG" ? "ใส่น้ำหนัก (กิโลกรัม)" : "ใส่จำนวน (ชิ้น)"}</span>
                </div>
                <input ref={addQtyRef} type="number" value={addQty} onChange={(e) => setAddQty(e.target.value)}
                  className="w-full bg-white rounded-2xl px-4 py-5 text-6xl font-medium text-center focus:outline-none tabular-nums"
                  style={{ border: "3px solid #4ade80" }}
                  placeholder="0" min="0" step={addProduct.unit === "KG" ? "0.1" : "1"} inputMode="decimal" />
              </div>
              {/* Preview total */}
              {addQty && parseFloat(addQty) > 0 && addPrice && parseFloat(addPrice) > 0 && (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-gray-400 text-sm">ยอดที่ต้องจ่าย</p>
                  <p className="text-green-600 font-medium text-xl tabular-nums">
                    ฿{formatMoney(parseFloat(addQty) * parseFloat(addPrice))}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="px-5 pb-6 pt-3 shrink-0 border-t border-gray-50">
          {!addStep && (
            <div className="space-y-2.5">
              <button onClick={handleSave} disabled={saving || items.filter(i => i.quantity > 0).length === 0}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white font-semibold text-base active:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/25">
                <Check className="w-5 h-5" />
                {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
              <button onClick={onClose} className="w-full py-3 rounded-2xl text-gray-400 text-sm font-medium">ยกเลิก</button>
            </div>
          )}
          {addStep === "quantity" && (
            <button onClick={handleConfirmAdd}
              disabled={!addQty || parseFloat(addQty) <= 0 || !addPrice || parseFloat(addPrice) <= 0}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-600 text-white font-semibold text-base active:bg-green-700 disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-lg shadow-green-600/25">
              <Plus className="w-5 h-5" /> เพิ่มรายการนี้
            </button>
          )}
        </div>
      </div>

      {removeConfirmIdx !== null && (
        <ConfirmModal
          title="ลบรายการนี้?"
          description={`"${items[removeConfirmIdx]?.productName}" รอบนี้จะถูกลบออกจากบิล`}
          variant="danger" confirmLabel="ลบรายการ"
          onConfirm={() => { removeItem(removeConfirmIdx); setRemoveConfirmIdx(null); }}
          onCancel={() => setRemoveConfirmIdx(null)}
        />
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function StaffHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => localDateString());
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => { load(); }, [date]);

  const load = () => {
    setLoading(true);
    setExpandedId(null);
    fetch(`/api/transactions?date=${date}`)
      .then((r) => r.json())
      .then(setTransactions)
      .finally(() => setLoading(false));
  };

  const handleSaved = (updated: Transaction) => {
    setTransactions((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setEditingTx(null);
  };

  const filtered = transactions.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.customerName?.toLowerCase().includes(q) ||
      t.items.some((i) => i.productName.toLowerCase().includes(q))
    );
  });

  const total = filtered.reduce((s, t) => s + t.totalAmount, 0);

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      {/* ── HEADER ── */}
      <div className="relative bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-500 pt-12 pb-6 px-4 overflow-hidden">
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/[0.06]" />

        <div className="relative mb-4">
          <h1 className="text-white font-semibold text-xl">ประวัติรายการ</h1>
        </div>

        {/* Date nav */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setDate(addDays(date, -1))}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/20 text-white active:bg-white/30 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            className="flex-1 bg-white/20 rounded-xl px-3 py-2.5 flex items-center justify-center gap-2 active:bg-white/30 transition-colors"
            onClick={() => setShowDatePicker(true)}
          >
            <Calendar className="w-4 h-4 text-white/80 shrink-0" />
            <p className="text-white text-sm font-semibold leading-tight">
              {isToday(date) ? "วันนี้" : formatThaiDate(date)}
            </p>
          </button>

          <button
            onClick={() => setDate(addDays(date, 1))}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/20 text-white active:bg-white/30 transition-colors shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-2 gap-3 mb-10">
          <div className="bg-white/15 rounded-2xl px-4 py-3.5">
            <p className="text-blue-200 text-xs mb-0.5">ยอดรวม</p>
            <p className="text-white font-medium text-xl tabular-nums">฿{formatMoney(total)}</p>
          </div>
          <div className="bg-white/15 rounded-2xl px-4 py-3.5">
            <p className="text-blue-200 text-xs mb-0.5">จำนวนรายการ</p>
            <p className="text-white font-medium text-xl">{filtered.length} รายการ</p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 390 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0 40 C97.5 0 292.5 0 390 40 L390 40 L0 40 Z" fill="#f4f6f9" />
          </svg>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อลูกค้า หรือชื่อสินค้า..."
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-300 shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── LIST ── */}
      <div className="flex-1 px-4 pt-2 pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm">กำลังโหลด...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-14 flex flex-col items-center gap-2 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-1">
              <ClipboardList className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium text-sm">
              {search ? "ไม่พบรายการที่ค้นหา" : "ไม่มีรายการในวันนี้"}
            </p>
            <p className="text-gray-400 text-xs">
              {search ? `"${search}"` : "ลองเลือกวันอื่น หรือกลับไปบันทึกรายการ"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((t, idx) => (
              <div key={t.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-medium shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    {t.customerName && (
                      <div className="flex items-center gap-1 mb-0.5">
                        <User className="w-3 h-3 text-gray-400 shrink-0" />
                        <p className="text-gray-900 text-sm font-medium truncate">{t.customerName}</p>
                      </div>
                    )}
                    <p className={`truncate ${t.customerName ? "text-gray-400 text-xs" : "text-gray-800 text-sm font-medium"}`}>
                      {t.items.map((i) => i.productName).join(", ")}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {formatTime(t.createdAt)} · {t.items.length} รายการ
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-green-600 font-medium text-sm tabular-nums">
                      ฿{formatMoney(t.totalAmount)}
                    </p>
                    <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${expandedId === t.id ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {expandedId === t.id && (
                  <div className="border-t border-gray-50 bg-gray-50 px-4 py-3">
                    <p className="text-gray-300 text-xs font-mono mb-2.5">#{t.id.slice(-8).toUpperCase()}</p>
                    <div className="space-y-2">
                      {t.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-700 text-sm font-medium">{item.productName}</p>
                            <p className="text-gray-400 text-xs">
                              {item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"} × ฿{item.unitPrice.toLocaleString()}
                            </p>
                          </div>
                          <p className="text-green-600 text-sm font-medium tabular-nums">
                            ฿{formatMoney(item.subtotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-200 flex justify-between items-center">
                      <p className="text-gray-500 text-sm font-medium">รวม</p>
                      <p className="text-green-600 font-medium tabular-nums">฿{formatMoney(t.totalAmount)}</p>
                    </div>
                    <button
                      onClick={() => setEditingTx(t)}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-blue-200 text-blue-600 text-sm font-medium active:bg-blue-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      แก้ไขบิลนี้
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <StaffTabBar />

      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          onSave={handleSaved}
          onClose={() => setEditingTx(null)}
        />
      )}

      {showDatePicker && (
        <DatePickerModal
          value={date}
          max={localDateString()}
          onSelect={(d) => setDate(d)}
          onClose={() => setShowDatePicker(false)}
          accentFrom="#4338ca"
          accentTo="#2563eb"
        />
      )}
    </div>
  );
}
