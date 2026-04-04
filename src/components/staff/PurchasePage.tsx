"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ShoppingCart, Clock, Plus, X, Check,
  Package, Search,
  Scale, Hash, Banknote, User, CheckCircle2, ChevronRight, Pencil, Trash2,
} from "lucide-react";
import ReceiptModal from "./ReceiptModal";
import { getIconComponent, getCategoryGradient } from "@/components/owner/CategoriesPage";
import NumberPadDialog, { NumberPadHistoryItem } from "@/components/ui/NumberPadDialog";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  customPrice: boolean;
  categoryId: string;
}

interface CustomerPriceInfo {
  priceGroupId: string | null;
  priceGroupName: string | null;
  priceGroupColor: string | null;
  prices: { productId: string; pricePerUnit: number; source: "override" | "group" | "default" }[];
}

interface PriceGroup {
  id: string; name: string; color: string | null;
}

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unit: string;
  customPrice?: boolean;
}

interface HeldBill {
  id: string;
  label: string | null;
  items: CartItem[];
  heldBy: string | null;
  createdAt: string;
}

function formatMoney(amount: number) {
  return amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTime(s: string) {
  return new Date(s).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}


type Step = "category" | "product" | "quantity" | "cart";

// ── Modal: พักบิล ─────────────────────────────────────────────
function HoldConfirmModal({
  total, initialName, onConfirm, onCancel,
}: {
  total: number; initialName: string;
  onConfirm: (label: string) => void; onCancel: () => void;
}) {
  const [label, setLabel] = useState(initialName);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white w-full max-w-md rounded-t-3xl px-5 py-6 overflow-y-auto" style={{ maxHeight: "90vh" }}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">พักบิลนี้ไว้ก่อน</h3>
            <p className="text-gray-400 text-xs">ยอดรวม ฿{formatMoney(total)}</p>
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-3">ชื่อลูกค้า (เพื่อให้ป้าคนอื่นจำได้ง่าย)</p>
        <div className="relative mb-4">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl pl-10 pr-4 py-3 text-base focus:border-amber-400 focus:bg-white focus:outline-none transition-all"
            placeholder="เช่น ลุงสมชาย, ยายแดง…"
            maxLength={40}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium text-sm active:scale-[0.97] transition-all">
            ยกเลิก
          </button>
          <button onClick={() => onConfirm(label.trim())} className="py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm active:scale-[0.97] transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" /> พักบิล
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: แก้ไขรายการในตะกร้า ────────────────────────────────
function EditCartItemModal({
  item, onConfirm, onCancel,
}: {
  item: CartItem;
  onConfirm: (newQty: number, newPrice?: number) => void;
  onCancel: () => void;
}) {
  const [qty, setQty] = useState(item.quantity);
  const [price, setPrice] = useState(item.unitPrice);
  const [priceOverride, setPriceOverride] = useState(item.customPrice);
  const [showQtyPad, setShowQtyPad] = useState(false);
  const [showPricePad, setShowPricePad] = useState(false);

  const unitLabel = item.unit === "KG" ? "กก." : "ชิ้น";
  const effectivePrice = priceOverride ? price : item.unitPrice;
  const isQtyValid = qty > 0;
  const isPriceValid = !priceOverride || price > 0;
  const isValid = isQtyValid && isPriceValid;
  const newTotal = isValid ? qty * effectivePrice : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white w-full max-w-md rounded-t-3xl px-5 py-6">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${priceOverride ? "bg-amber-50" : "bg-blue-50"}`}>
            <Pencil className={`w-5 h-5 ${priceOverride ? "text-amber-500" : "text-blue-500"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{item.productName}</h3>
            <p className="text-gray-400 text-xs">ราคาปกติ ฿{item.unitPrice.toLocaleString()} / {unitLabel}</p>
          </div>
          {!item.customPrice && (
            <button onClick={() => setPriceOverride(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                priceOverride ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-400 border-gray-200"
              }`}>
              <Banknote className="w-3.5 h-3.5" />
              {priceOverride ? "ราคาพิเศษ" : "ปรับราคา"}
            </button>
          )}
        </div>

        {/* Price field (tap to open pad) */}
        {priceOverride && (
          <button
            onClick={() => setShowPricePad(true)}
            className="w-full mb-4 rounded-2xl px-4 py-4 text-center active:bg-amber-50 transition-colors"
            style={{ border: `3px solid ${price > 0 ? "#f59e0b" : "#e5e7eb"}` }}
          >
            <div className="flex items-center justify-center gap-2 text-amber-500 text-xs mb-1">
              <Banknote className="w-3.5 h-3.5" />
              <span>{item.customPrice ? "ราคารับซื้อ / หน่วย" : "ราคาพิเศษรอบนี้ (บาท)"}</span>
            </div>
            <p className={`text-5xl font-bold tabular-nums ${price > 0 ? "text-amber-600" : "text-gray-300"}`}>
              {price > 0 ? price : "0"}
            </p>
            {!item.customPrice && <p className="text-xs text-amber-400 mt-1">ปกติ ฿{item.unitPrice.toLocaleString()} · รอบนี้เท่านั้น</p>}
          </button>
        )}

        {/* Quantity field (tap to open pad) */}
        <button
          onClick={() => setShowQtyPad(true)}
          className="w-full rounded-2xl px-4 py-4 text-center active:bg-blue-50 transition-colors"
          style={{ border: `3px solid ${isQtyValid ? "#60a5fa" : "#e5e7eb"}` }}
        >
          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mb-1">
            {item.unit === "KG" ? <Scale className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
            <span>{item.unit === "KG" ? "น้ำหนัก (กิโลกรัม)" : "จำนวน (ชิ้น)"}</span>
          </div>
          <p className={`text-5xl font-bold tabular-nums ${isQtyValid ? "text-blue-600" : "text-gray-300"}`}>
            {qty > 0 ? qty : "0"}
          </p>
        </button>

        {/* Total preview */}
        <div className={`flex items-center justify-between rounded-xl px-4 py-3 mt-3 mb-4 ${isValid ? "bg-emerald-50" : "bg-gray-50"}`}>
          <p className="text-gray-400 text-sm">ยอดใหม่</p>
          <p className={`font-semibold text-xl tabular-nums ${isValid ? "text-emerald-600" : "text-gray-300"}`}>
            {isValid ? `฿${formatMoney(newTotal)}` : "—"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium text-sm active:scale-[0.97] transition-all">
            ยกเลิก
          </button>
          <button
            onClick={() => isValid && onConfirm(qty, priceOverride ? price : undefined)}
            disabled={!isValid}
            className="py-3.5 rounded-2xl bg-blue-500 disabled:bg-gray-100 disabled:text-gray-300 text-white font-medium text-sm active:scale-[0.97] transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> บันทึก
          </button>
        </div>

        {/* Pads */}
        <NumberPadDialog
          open={showQtyPad}
          onClose={() => setShowQtyPad(false)}
          title={item.unit === "KG" ? "น้ำหนัก (กิโลกรัม)" : "จำนวน (ชิ้น)"}
          unit={unitLabel}
          initialValue={qty}
          onConfirm={(v) => { setQty(v); setShowQtyPad(false); }}
        />
        <NumberPadDialog
          open={showPricePad}
          onClose={() => setShowPricePad(false)}
          title="ราคาพิเศษ (บาท / หน่วย)"
          unit="บาท"
          initialValue={price}
          onConfirm={(v) => { setPrice(v); setShowPricePad(false); }}
        />
      </div>
    </div>
  );
}

// ── Modal: ยืนยันจ่ายเงิน ──────────────────────────────────────
function PayConfirmModal({
  total, items, customerName, onConfirm, onCancel,
}: {
  total: number;
  items: CartItem[];
  customerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const groups = (() => {
    const order: string[] = [];
    const map: Record<string, CartItem[]> = {};
    items.forEach(item => {
      if (!order.includes(item.productId)) order.push(item.productId);
      if (!map[item.productId]) map[item.productId] = [];
      map[item.productId].push(item);
    });
    return order.map(pid => ({
      productId: pid,
      productName: map[pid][0].productName,
      unit: map[pid][0].unit,
      rounds: map[pid],
      totalQty: map[pid].reduce((s, r) => s + r.quantity, 0),
      totalSubtotal: map[pid].reduce((s, r) => s + r.subtotal, 0),
    }));
  })();

  const toggle = (pid: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(pid) ? next.delete(pid) : next.add(pid);
    return next;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white w-full max-w-md rounded-t-3xl flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* ── Header (fixed) ── */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">ยืนยันการรับซื้อ</h3>
              {customerName
                ? <p className="text-gray-400 text-xs">ลูกค้า: {customerName}</p>
                : <p className="text-gray-400 text-xs">ตรวจสอบรายการก่อนยืนยัน</p>
              }
            </div>
            <span className="ml-auto bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full">
              {groups.length} สินค้า · {items.length} รอบ
            </span>
          </div>
        </div>

        {/* ── Items list grouped (scrollable, collapsed by default) ── */}
        <div className="flex-1 overflow-y-auto mx-5 mb-0">
          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            {groups.map((group, gi) => {
              const isExp = expanded.has(group.productId);
              return (
                <div key={group.productId} className={gi > 0 ? "border-t border-gray-200" : ""}>
                  {/* Tappable group header */}
                  <button
                    onClick={() => toggle(group.productId)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left active:bg-gray-200/60 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium text-sm truncate">{group.productName}</p>
                      <p className="text-gray-500 text-xs">
                        <span className="bg-blue-50 text-blue-500 text-[10px] font-medium rounded px-1 mr-1">{group.rounds.length} รอบ</span>
                        รวม {group.totalQty} {group.unit === "KG" ? "กก." : "ชิ้น"}
                      </p>
                    </div>
                    <span className="text-emerald-600 font-semibold tabular-nums text-sm shrink-0">฿{formatMoney(group.totalSubtotal)}</span>
                    <svg className={`w-4 h-4 text-gray-300 shrink-0 transition-transform duration-200 ${isExp ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {/* Round rows — collapsed by default */}
                  {isExp && group.rounds.map((item, ri) => (
                    <div key={ri} className="flex items-center gap-2 px-4 py-1.5 border-t border-gray-100 bg-white/60 pl-6">
                      <span className="text-gray-300 text-[10px] w-10 shrink-0">รอบ {ri + 1}</span>
                      <span className="text-gray-500 text-xs flex-1">
                        {item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"} × ฿{item.unitPrice.toLocaleString()}
                      </span>
                      <span className="text-gray-600 text-xs tabular-nums shrink-0">฿{formatMoney(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Total + Buttons (fixed bottom) ── */}
        <div className="px-5 pt-3 pb-6 shrink-0">
          <div className="flex justify-between items-center px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 mb-3">
            <span className="text-emerald-800 font-semibold text-sm">ยอดรวมทั้งหมด</span>
            <span className="text-emerald-700 font-bold text-2xl tabular-nums">฿{formatMoney(total)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onCancel} className="py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium text-sm active:scale-[0.97] transition-all">
              ยกเลิก
            </button>
            <button onClick={onConfirm} className="py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-sm active:scale-[0.97] transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> ยืนยันจ่ายเงิน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal: บิลที่พัก ──────────────────────────────────────────
function HeldBillsModal({
  bills, onResume, onCancel, onClose,
}: {
  bills: HeldBill[];
  onResume: (bill: HeldBill) => void;
  onCancel: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-3xl overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">บิลที่พักไว้</h3>
              <p className="text-gray-400 text-xs">{bills.length} บิล — แตะเพื่อรับช่วงต่อ</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {bills.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm">ไม่มีบิลที่พักอยู่</p>
            </div>
          ) : bills.map((bill) => {
            const total = bill.items.reduce((s, i) => s + i.subtotal, 0);
            return (
              <div key={bill.id} className="bg-gray-50 rounded-2xl overflow-hidden">
                <button onClick={() => onResume(bill)} className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-amber-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{bill.label || "บิลไม่มีชื่อ"}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {bill.items.length} รายการ · {formatTime(bill.createdAt)}
                      {bill.heldBy ? ` · โดย ${bill.heldBy}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-emerald-600 font-medium text-sm tabular-nums">฿{formatMoney(total)}</p>
                    <p className="text-amber-500 text-xs flex items-center gap-0.5 justify-end">
                      รับช่วงต่อ <ChevronRight className="w-3 h-3" />
                    </p>
                  </div>
                </button>
                <div className="px-4 pb-3 border-t border-gray-100 bg-white">
                  <div className="pt-2.5 space-y-1">
                    {bill.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-600">
                          {item.productName}
                          <span className="text-gray-400 ml-1">({item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"})</span>
                        </span>
                        <span className="text-emerald-600 tabular-nums">฿{formatMoney(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => onCancel(bill.id)} className="mt-2.5 w-full py-1.5 rounded-xl bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors">
                    ยกเลิกบิลนี้
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-medium text-sm active:scale-[0.97] transition-all">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function PurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  // ── Draft persistence ──────────────────────────────────────
  const DRAFT_KEY = "purchase_cart_draft";
  const loadDraft = (): { cart: CartItem[]; customerName: string; customerId?: string | null } => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { cart: [], customerName: "" };
  };
  const saveDraft = (c: CartItem[], name: string, cid?: string | null) => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ cart: c, customerName: name, customerId: cid ?? null })); } catch {}
  };
  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  };

  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>("category");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedTransaction, setSavedTransaction] = useState<{
    id: string; totalAmount: number; items: CartItem[]; createdAt: string; customerName?: string | null;
  } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerMode, setCustomerMode] = useState<"new" | "regular">("new");
  const [customerPriceInfo, setCustomerPriceInfo] = useState<CustomerPriceInfo | null>(null);
  const [customerSuggestions, setCustomerSuggestions] = useState<{ id: string; name: string; nickname: string | null; phone: string | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [showHoldConfirm, setShowHoldConfirm] = useState(false);
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editingCartIdx, setEditingCartIdx] = useState<number | null>(null);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [holdingBill, setHoldingBill] = useState(false);

  const [customUnitPrice, setCustomUnitPrice] = useState("");
  const [priceGroups, setPriceGroups] = useState<PriceGroup[]>([]);
  const [sessionGroupId, setSessionGroupId] = useState<string>("");
  const [sessionGroupPrices, setSessionGroupPrices] = useState<Record<string, number>>({});
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const quantityRef = useRef<HTMLInputElement>(null);

  // NumberPad dialog state
  const [showQtyPad, setShowQtyPad] = useState(false);
  const [showPricePad, setShowPricePad] = useState(false);
  const [padHistory, setPadHistory] = useState<NumberPadHistoryItem[]>([]);

  // Load draft from localStorage only after mount to avoid SSR/hydration mismatch
  useEffect(() => {
    const draft = loadDraft();
    if (draft.cart.length > 0) {
      setCart(draft.cart);
      setStep("cart");
      setCustomerName(draft.customerName);
      setCustomerId(draft.customerId ?? null);
      setCustomerMode(draft.customerId ? "regular" : "new");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetch("/api/price-groups").then((r) => r.json()).then(setPriceGroups);
    loadHeldBills();
  }, []);

  // Auto-save draft whenever cart, customerName, or customerId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    saveDraft(cart, customerName, customerId);
  }, [cart, customerName, customerId]); // saveDraft is stable (no deps)

  // Auto-resume held bill from query param ?held=<id>
  useEffect(() => {
    const heldId = searchParams.get("held");
    if (!heldId || heldBills.length === 0) return;
    const bill = heldBills.find((b) => b.id === heldId);
    if (bill) handleResume(bill);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heldBills]);


  const loadHeldBills = useCallback(async () => {
    const res = await fetch("/api/held-bills");
    if (res.ok) setHeldBills(await res.json());
  }, []);

  const loadCustomerPrices = useCallback(async (cid: string, currentCart: CartItem[]) => {
    const res = await fetch(`/api/customers/${cid}/prices`);
    if (!res.ok) return;
    const info: CustomerPriceInfo = await res.json();
    setCustomerPriceInfo(info);
    // Re-price existing cart items (non-customPrice) using the new customer's resolved prices
    if (currentCart.length > 0) {
      setCart((prev) => prev.map((item) => {
        if (item.customPrice) return item;
        const resolved = info.prices.find((p) => p.productId === item.productId);
        if (!resolved) return item;
        return { ...item, unitPrice: resolved.pricePerUnit, subtotal: item.quantity * resolved.pricePerUnit };
      }));
    }
  }, []);

  // Load prices for a session group (temp apply without linking customer to the group)
  const applySessionGroup = useCallback(async (groupId: string, currentCart: CartItem[]) => {
    if (!groupId) {
      setSessionGroupId("");
      setSessionGroupPrices({});
      // Re-price cart back to customer/default prices
      setCart((prev) => prev.map((item) => {
        if (item.customPrice) return item;
        // will be re-derived by getProductPrice when next item is added; existing items keep current price
        return item;
      }));
      return;
    }
    const res = await fetch(`/api/price-groups/${groupId}/items`);
    if (!res.ok) return;
    const items: { productId: string; pricePerUnit: number }[] = await res.json();
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.productId] = i.pricePerUnit; });
    setSessionGroupId(groupId);
    setSessionGroupPrices(map);
    // Re-price existing cart items (non-customPrice, non-customer-override)
    if (currentCart.length > 0) {
      setCart((prev) => prev.map((item) => {
        if (item.customPrice) return item;
        const groupPrice = map[item.productId];
        if (groupPrice === undefined) return item;
        return { ...item, unitPrice: groupPrice, subtotal: item.quantity * groupPrice };
      }));
    }
  }, []);

  // Get resolved price for a product:
  // priority: customer override > session group > customer's registered group > default
  const getProductPrice = useCallback((product: Product): { price: number; source: "override" | "group" | "default"; groupLabel?: string } => {
    if (product.customPrice) return { price: product.pricePerUnit, source: "default" };
    // 1. Customer-specific override (highest priority)
    const customerOverride = customerPriceInfo?.prices.find(
      (p) => p.productId === product.id && p.source === "override"
    );
    if (customerOverride) return { price: customerOverride.pricePerUnit, source: "override" };
    // 2. Session group override (temp, for this transaction only)
    if (sessionGroupId && sessionGroupPrices[product.id] !== undefined) {
      const sg = priceGroups.find((g) => g.id === sessionGroupId);
      return { price: sessionGroupPrices[product.id], source: "group", groupLabel: sg?.name };
    }
    // 3. Customer's registered group / default
    const resolved = customerPriceInfo?.prices.find((p) => p.productId === product.id);
    if (resolved) return { price: resolved.pricePerUnit, source: resolved.source };
    return { price: product.pricePerUnit, source: "default" };
  }, [customerPriceInfo, sessionGroupId, sessionGroupPrices, priceGroups]);

  const totalAmount = cart.reduce((s, i) => s + i.subtotal, 0);

  // Group cart items by product (preserving order of first appearance)
  const cartGroups = (() => {
    const order: string[] = [];
    const map: Record<string, { item: CartItem; idx: number }[]> = {};
    cart.forEach((item, idx) => {
      if (!order.includes(item.productId)) order.push(item.productId);
      if (!map[item.productId]) map[item.productId] = [];
      map[item.productId].push({ item, idx });
    });
    return order.map(pid => ({
      productId: pid,
      productName: map[pid][0].item.productName,
      unit: map[pid][0].item.unit,
      unitPrice: map[pid][0].item.unitPrice,
      customPrice: map[pid][0].item.customPrice,
      rounds: map[pid],
      totalQty: map[pid].reduce((s, r) => s + r.item.quantity, 0),
      totalSubtotal: map[pid].reduce((s, r) => s + r.item.subtotal, 0),
    }));
  })();

  const handleAddRound = (group: typeof cartGroups[0]) => {
    setSelectedCategory(null);
    setSelectedProduct({
      id: group.productId,
      name: group.productName,
      unit: group.unit,
      pricePerUnit: group.unitPrice,
      customPrice: group.customPrice ?? false,
      categoryId: "",
    });
    setCustomUnitPrice(group.customPrice ? String(group.unitPrice) : "");
    setQuantity("");
    setStep("quantity");
  };

  const handleBack = () => {
    if (step === "category") cart.length > 0 ? setStep("cart") : router.push("/staff");
    else if (step === "product") setStep("category");
    else if (step === "quantity") selectedCategory ? setStep("product") : setStep("cart");
    else if (step === "cart") setStep("category");
  };

  const handleCategorySelect = (cat: Category) => { setSelectedCategory(cat); setStep("product"); };
  const handleProductSelect = (p: Product) => {
    if (!p.customPrice) {
      const { price } = getProductPrice(p);
      setSelectedProduct({ ...p, pricePerUnit: price });
    } else {
      setSelectedProduct(p);
    }
    setQuantity(""); setCustomUnitPrice(""); setStep("quantity");
  };

  const handleAddToCart = (qtyOverride?: number) => {
    const qty = qtyOverride ?? (quantity ? parseFloat(quantity) : 0);
    if (!selectedProduct || !qty || qty <= 0) return;
    if (selectedProduct.customPrice && (!customUnitPrice || parseFloat(customUnitPrice) <= 0)) return;
    const unitPrice = selectedProduct.customPrice ? parseFloat(customUnitPrice) : selectedProduct.pricePerUnit;
    const subtotal = qty * unitPrice;
    setCart([...cart, {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: qty, unitPrice, subtotal,
      unit: selectedProduct.unit,
      customPrice: selectedProduct.customPrice,
    }]);
    setStep("cart");
    setSelectedCategory(null);
    setSelectedProduct(null);
    setQuantity("");
  };

  const handleHoldConfirm = async (label: string) => {
    setHoldingBill(true);
    try {
      const res = await fetch("/api/held-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label || customerName || null, items: cart }),
      });
      if (res.ok) {
        clearDraft();
        setCart([]); setCustomerName(""); setCustomerId(null); setCustomerMode("new"); setCustomerPriceInfo(null);
        setSessionGroupId(""); setSessionGroupPrices({});
        setStep("category");
        setSelectedCategory(null); setSelectedProduct(null); setQuantity("");
        setShowHoldConfirm(false);
        await loadHeldBills();
        router.push("/staff");
      }
    } finally { setHoldingBill(false); }
  };

  const handleResume = async (bill: HeldBill) => {
    setCart([...cart, ...bill.items]);
    if (bill.label) setCustomerName(bill.label);
    await fetch(`/api/held-bills/${bill.id}`, { method: "DELETE" });
    await loadHeldBills();
    setShowHeldBills(false);
    setStep("cart");
  };

  const handleCancelHeld = async (id: string) => {
    await fetch(`/api/held-bills/${id}`, { method: "DELETE" });
    await loadHeldBills();
  };

  const handleSave = async () => {
    if (!cart.length) return;
    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, customerName: customerName.trim() || null, customerId: customerId || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedTransaction({ ...data, items: cart, customerName: customerName.trim() || null });
        clearDraft();
        setShowReceipt(true);
        setCart([]); setCustomerName(""); setCustomerId(null); setCustomerMode("new"); setCustomerPriceInfo(null);
        setSessionGroupId(""); setSessionGroupPrices({});
        setStep("category");
      }
    } finally { setSaving(false); }
  };

  const stepTitles: Record<Step, string> = {
    category: "เลือกหมวดหมู่",
    product: selectedCategory?.name ?? "เลือกสินค้า",
    quantity: "ใส่จำนวน",
    cart: "รายการรับซื้อ",
  };
  const stepNums: Record<Step, number> = { category: 1, product: 2, quantity: 3, cart: 4 };

  // ── Customer name search with autocomplete ────────────────────────────────
  const searchCustomerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCustomerInput = (val: string) => {
    setCustomerName(val);
    setCustomerId(null); // unlink if user types manually
    if (searchCustomerTimer.current) clearTimeout(searchCustomerTimer.current);
    if (val.trim().length >= 1) {
      searchCustomerTimer.current = setTimeout(async () => {
        const res = await fetch(`/api/customers?q=${encodeURIComponent(val.trim())}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.customers ?? []);
          setCustomerSuggestions(list.slice(0, 5));
          setShowSuggestions(list.length > 0);
        }
      }, 300);
    } else {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectCustomer = (c: { id: string; name: string; nickname: string | null; phone: string | null }) => {
    setCustomerName(c.name);
    setCustomerId(c.id);
    setShowSuggestions(false);
    loadCustomerPrices(c.id, cart);
  };

  const CustomerNameInput = () => (
    <div className="relative">
      <div className={`flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2.5 border-2 transition-all ${customerId ? "border-emerald-400 bg-emerald-50/40" : "border-transparent focus-within:border-emerald-400"}`}>
        <User className={`w-4 h-4 shrink-0 ${customerId ? "text-emerald-500" : "text-gray-400"}`} />
        <input
          type="text"
          value={customerName}
          onChange={(e) => handleCustomerInput(e.target.value)}
          onFocus={() => customerName.trim().length >= 1 && setShowSuggestions(customerSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          placeholder="พิมพ์ชื่อเพื่อค้นหา..."
          maxLength={40}
        />
        {customerId && customerPriceInfo?.priceGroupName ? (
          <span className="text-[10px] text-white rounded-md px-1.5 py-0.5 shrink-0 font-semibold" style={{ background: customerPriceInfo.priceGroupColor ?? "#16a34a" }}>
            กลุ่ม {customerPriceInfo.priceGroupName}
          </span>
        ) : customerId ? (
          <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded-md px-1.5 py-0.5 shrink-0 font-medium">ประจำ</span>
        ) : null}
        {customerName && (
          <button onMouseDown={(e) => { e.preventDefault(); setCustomerName(""); setCustomerId(null); setCustomerPriceInfo(null); setShowSuggestions(false); }} className="text-gray-300 hover:text-gray-500">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {showSuggestions && customerSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-30">
          {customerSuggestions.map((c) => (
            <button key={c.id} onMouseDown={() => selectCustomer(c)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 active:bg-emerald-100 transition-colors text-left border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{c.name}{c.nickname ? ` (${c.nickname})` : ""}</p>
                {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#eef2f7" }}>

      {/* ── HEADER ── */}
      <div
        className="text-white px-4 pb-5 sticky top-0 z-20 overflow-hidden"
        style={{
          background: "linear-gradient(140deg, #059669 0%, #10b981 40%, #0ea5e9 100%)",
          paddingTop: "max(env(safe-area-inset-top), 16px)",
        }}
      >
        {/* Decorative circle */}
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="flex items-center gap-3 mb-3 relative">
          <button onClick={handleBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 transition-all shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-medium">บันทึกรับซื้อ</h1>
            <p className="text-white/70 text-xs">{stepTitles[step]}</p>
          </div>

          {heldBills.length > 0 && (
            <button onClick={() => setShowHeldBills(true)} className="flex items-center gap-1.5 bg-amber-400/90 hover:bg-amber-400 px-2.5 py-1.5 rounded-xl text-amber-900 text-xs font-medium transition-all">
              <Clock className="w-3.5 h-3.5" />
              <span className="bg-amber-800/20 rounded-full w-4 h-4 flex items-center justify-center text-xs">{heldBills.length}</span>
            </button>
          )}

          {cart.length > 0 && (
            <button onClick={() => setStep("cart")} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl text-sm transition-all">
              <ShoppingCart className="w-4 h-4" />
              <span className="bg-white text-emerald-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">{cart.length}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 relative">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`h-1.5 rounded-full transition-all ${stepNums[step] >= n ? "bg-white w-6" : "bg-white/30 w-4"}`} />
          ))}
          <span className="text-white/50 text-xs ml-1">ขั้นตอน {Math.min(stepNums[step], 3)}/3</span>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 pb-10">

        {/* ── STEP 1: Category ── */}
        {step === "category" && (
          <div>
            {/* ── Customer chip — compact, tap to open modal ── */}
            {/* div not button — contains a nested clear button inside */}
            <div role="button" onClick={() => setShowCustomerModal(true)}
              className={`w-full flex items-center gap-3 mb-4 rounded-2xl px-4 py-3 shadow-sm transition-all active:scale-[0.98] cursor-pointer select-none ${
                customerId
                  ? "bg-white border-2 border-emerald-200"
                  : sessionGroupId
                  ? "bg-white border-2 border-amber-200"
                  : "bg-white border border-gray-100"
              }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                customerId ? "bg-emerald-100" : "bg-gray-100"
              }`}>
                <User className={`w-5 h-5 ${customerId ? "text-emerald-600" : "text-gray-400"}`} />
              </div>
              <div className="flex-1 text-left min-w-0">
                {customerId ? (
                  <>
                    <p className="font-semibold text-gray-800 text-sm truncate">{customerName}</p>
                    <p className="text-xs mt-0.5">
                      {sessionGroupId
                        ? <span className="text-amber-600">ราคากลุ่ม {priceGroups.find(g => g.id === sessionGroupId)?.name} (รอบนี้)</span>
                        : customerPriceInfo?.priceGroupName
                          ? <span style={{ color: customerPriceInfo.priceGroupColor ?? "#16a34a" }}>กลุ่ม {customerPriceInfo.priceGroupName}</span>
                          : <span className="text-gray-400">ราคาปกติ</span>
                      }
                    </p>
                  </>
                ) : sessionGroupId ? (
                  <>
                    <p className="font-semibold text-amber-700 text-sm">ราคากลุ่ม {priceGroups.find(g => g.id === sessionGroupId)?.name}</p>
                    <p className="text-xs text-amber-500">ใช้เฉพาะรอบนี้ · ยังไม่ระบุลูกค้า</p>
                  </>
                ) : customerName ? (
                  <>
                    <p className="font-medium text-gray-700 text-sm truncate">{customerName}</p>
                    <p className="text-xs text-gray-400">ลูกค้าใหม่</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">แตะเพื่อเลือกลูกค้า (ไม่บังคับ)</p>
                )}
              </div>
              {(customerId || customerName || sessionGroupId) ? (
                <button onMouseDown={(e) => {
                  e.stopPropagation();
                  setCustomerName(""); setCustomerId(null); setCustomerMode("new");
                  setCustomerPriceInfo(null); setSessionGroupId(""); setSessionGroupPrices({});
                }} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 active:bg-gray-200">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              )}
            </div>

            <p className="text-gray-400 text-sm mb-3">เลือกประเภทของที่ลูกค้านำมาขาย</p>

            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => {
                const grad = getCategoryGradient(cat.color ?? "#16a34a");
                const CIcon = getIconComponent(cat.icon ?? "Package");
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat)}
                    className="rounded-2xl flex flex-col items-start gap-3 active:scale-[0.94] transition-all text-left overflow-hidden"
                    style={{
                      padding: "16px",
                      background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                      boxShadow: `0 6px 20px ${grad.from}55`,
                    }}
                  >
                    {/* Icon — frosted glass */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.28)" }}
                    >
                      <CIcon className="w-6 h-6 text-white" />
                    </div>
                    {/* Text */}
                    <div>
                      <p className="text-white font-bold text-base leading-tight drop-shadow-sm">{cat.name}</p>
                      <p className="text-white/70 text-xs mt-1">
                        {cat.products.length} รายการ
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ปุ่มดูตะกร้าเมื่อมีสินค้า — ไม่แสดง list ให้ไปดูที่หน้า cart แทน */}
            {cart.length > 0 && (
              <button
                onClick={() => setStep("cart")}
                className="mt-4 w-full rounded-2xl px-4 py-4 flex items-center gap-3 active:scale-[0.98] transition-all bg-white"
                style={{ border: "2px dashed #10b981", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-emerald-700 font-semibold text-sm">ดูรายการในตะกร้า</p>
                  <p className="text-emerald-500 text-xs">{cart.length} รายการ · ฿{formatMoney(totalAmount)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </button>
            )}
          </div>
        )}

        {/* ── STEP 2: Product ── */}
        {step === "product" && selectedCategory && (
          <div>
            <p className="text-gray-400 text-sm mb-4">เลือกสินค้าที่ลูกค้านำมาขาย</p>
            <div className="space-y-2.5">
              {selectedCategory.products.map((product) => (
                <button key={product.id} onClick={() => handleProductSelect(product)}
                  className="w-full bg-white rounded-2xl px-4 py-4 shadow-sm active:scale-[0.98] active:bg-emerald-50 transition-all flex items-center gap-4">
                  {(() => {
                    const g = getCategoryGradient(selectedCategory.color ?? "#16a34a");
                    const I = getIconComponent(selectedCategory.icon ?? "Package");
                    return (
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}>
                        <I className="w-5 h-5 text-white" />
                      </div>
                    );
                  })()}
                  <div className="flex-1 text-left">
                    <p className="text-gray-800 font-medium">{product.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{product.unit === "KG" ? "วัดเป็นกิโลกรัม" : "วัดเป็นชิ้น"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {(() => {
                      if (product.customPrice) return <p className="text-purple-500 text-sm font-medium">กรอกเอง</p>;
                      const { price, source } = getProductPrice(product);
                      return (
                        <>
                          <p className="text-emerald-600 font-medium text-lg tabular-nums">฿{price.toLocaleString()}</p>
                          <p className="text-xs mt-0.5">
                            {source === "override"
                              ? <span className="text-purple-500 font-medium">เฉพาะบุคคล</span>
                              : source === "group"
                              ? <span className="font-semibold" style={{ color: customerPriceInfo?.priceGroupColor ?? "#16a34a" }}>กลุ่ม {customerPriceInfo?.priceGroupName}</span>
                              : <span className="text-gray-400">/{product.unit === "KG" ? "กก." : "ชิ้น"}</span>
                            }
                          </p>
                        </>
                      );
                    })()}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Quantity ── */}
        {step === "quantity" && selectedProduct && (() => {
          const unitLabel = selectedProduct.unit === "KG" ? "กก." : "ชิ้น";
          const unitPrice = selectedProduct.customPrice
            ? (customUnitPrice ? parseFloat(customUnitPrice) : 0)
            : selectedProduct.pricePerUnit;
          const qty = quantity ? parseFloat(quantity) : 0;
          const subtotalPreview = qty > 0 && (!selectedProduct.customPrice || unitPrice > 0)
            ? qty * unitPrice : null;
          const { from: gFrom, to: gTo } = getCategoryGradient(selectedCategory?.color ?? "#16a34a");
          const CatIcon = getIconComponent(selectedCategory?.icon ?? "Package");

          return (
            <div className="flex flex-col gap-3">
              {/* Product chip */}
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}>
                  <CatIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 leading-tight">{selectedProduct.name}</p>
                  {selectedProduct.customPrice
                    ? <p className="text-purple-500 text-xs mt-0.5">กรอกราคาเอง</p>
                    : <p className="text-emerald-600 text-xs mt-0.5">฿{selectedProduct.pricePerUnit.toLocaleString()} / {unitLabel}</p>
                  }
                </div>
              </div>

              {/* Custom price — tap to open pad */}
              {selectedProduct.customPrice && (
                <button
                  onClick={() => setShowPricePad(true)}
                  className="bg-white rounded-2xl px-4 py-4 shadow-sm text-center w-full active:bg-gray-50 transition-colors"
                  style={{ border: `2px solid ${customUnitPrice ? "#a855f7" : "#e5e7eb"}` }}
                >
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1.5 justify-center">
                    <Banknote className="w-3.5 h-3.5" />
                    <span>ราคารับซื้อ (บาท / {unitLabel})</span>
                  </div>
                  <p className={`text-4xl font-bold tabular-nums ${customUnitPrice ? "text-purple-600" : "text-gray-300"}`}>
                    {customUnitPrice || "แตะเพื่อใส่ราคา"}
                  </p>
                </button>
              )}

              {/* Quantity — tap to open pad */}
              <button
                onClick={() => setShowQtyPad(true)}
                className="bg-white rounded-2xl shadow-sm overflow-hidden w-full text-left active:bg-gray-50 transition-colors"
                style={{ border: `2px solid ${qty > 0 ? "#22c55e" : "#e5e7eb"}` }}
              >
                <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-gray-400 text-xs justify-center">
                  {selectedProduct.unit === "KG" ? <Scale className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
                  <span>{selectedProduct.unit === "KG" ? "น้ำหนัก (กิโลกรัม)" : "จำนวน (ชิ้น)"} · แตะเพื่อใส่</span>
                </div>
                <div className="px-4 pb-3 text-center">
                  <p className={`font-bold tabular-nums text-6xl leading-none ${qty > 0 ? "text-gray-800" : "text-gray-300"}`}>
                    {qty > 0 ? quantity : "0"}
                  </p>
                </div>
                {subtotalPreview !== null ? (
                  <div className="mx-3 mb-3 flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-2.5">
                    <p className="text-emerald-600 text-xs font-medium">ยอดที่ต้องจ่าย</p>
                    <p className="text-emerald-700 font-bold text-lg tabular-nums">฿{formatMoney(subtotalPreview)}</p>
                  </div>
                ) : (
                  <div className="mx-3 mb-3 bg-gray-50 rounded-xl px-4 py-2.5 text-center">
                    <p className="text-gray-300 text-xs">ยอดเงินจะแสดงเมื่อใส่จำนวน{selectedProduct.customPrice ? "และราคา" : ""}</p>
                  </div>
                )}
              </button>

              {/* Confirm button */}
              <button
                onClick={() => handleAddToCart()}
                disabled={qty <= 0 || (selectedProduct.customPrice && (!customUnitPrice || parseFloat(customUnitPrice) <= 0))}
                className="btn-staff bg-emerald-600 disabled:bg-gray-100 disabled:text-gray-300 text-white shadow-lg shadow-emerald-600/25 disabled:shadow-none"
                style={{ minHeight: 56 }}
              >
                <Check className="w-5 h-5" /> เพิ่มรายการ
              </button>

              {/* NumberPad dialogs */}
              <NumberPadDialog
                open={showQtyPad}
                onClose={() => setShowQtyPad(false)}
                title={selectedProduct.unit === "KG" ? "ใส่น้ำหนัก (กิโลกรัม)" : "ใส่จำนวน (ชิ้น)"}
                unit={unitLabel}
                initialValue={qty > 0 ? qty : null}
                history={padHistory}
                onHistoryChange={setPadHistory}
                onConfirm={(val) => { setQuantity(String(val)); setShowQtyPad(false); }}
              />
              <NumberPadDialog
                open={showPricePad}
                onClose={() => setShowPricePad(false)}
                title={`ราคารับซื้อ (บาท / ${unitLabel})`}
                unit="บาท"
                initialValue={customUnitPrice ? parseFloat(customUnitPrice) : null}
                history={padHistory}
                onHistoryChange={setPadHistory}
                onConfirm={(val) => { setCustomUnitPrice(String(val)); setShowPricePad(false); }}
              />
            </div>
          );
        })()}

        {/* ── STEP 4: Cart ── */}
        {step === "cart" && (
          <div className="flex flex-col gap-2.5">

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                <ShoppingCart className="w-12 h-12 text-gray-200 mb-2" />
                <p className="font-medium text-gray-500">ยังไม่มีรายการ</p>
                <button onClick={() => setStep("category")} className="mt-3 flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                  <Plus className="w-4 h-4" /> เพิ่มสินค้า
                </button>
              </div>
            ) : (
              <>
                {/* ── Customer Section — compact summary in cart ── */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-3.5 py-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${customerId ? "bg-emerald-100" : "bg-gray-100"}`}>
                      <User className={`w-4 h-4 ${customerId ? "text-emerald-600" : "text-gray-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {customerId ? (
                        <>
                          <p className="text-sm font-semibold text-gray-800 truncate">{customerName}</p>
                          <p className="text-[11px] text-gray-400">
                            {customerPriceInfo?.priceGroupName
                              ? <span style={{ color: customerPriceInfo.priceGroupColor ?? "#16a34a" }}>กลุ่ม {customerPriceInfo.priceGroupName}</span>
                              : "ลูกค้าประจำ · ราคาปกติ"}
                          </p>
                        </>
                      ) : customerName ? (
                        <>
                          <p className="text-sm font-medium text-gray-700 truncate">{customerName}</p>
                          <p className="text-[11px] text-gray-400">ลูกค้าใหม่</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">ไม่ระบุลูกค้า</p>
                      )}
                    </div>
                    <button
                      onClick={() => setStep("category")}
                      className="text-xs text-emerald-600 font-medium bg-emerald-50 rounded-lg px-2.5 py-1.5 shrink-0 active:bg-emerald-100">
                      แก้ไข
                    </button>
                  </div>
                </div>

                {/* ── Items (grouped, number-focused) ── */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Table header */}
                  <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-gray-400 text-xs font-medium flex-1">
                      {cartGroups.length} สินค้า · {cart.length} รอบ
                    </span>
                  </div>
                  {/* Product groups */}
                  {cartGroups.map((group, gi) => {
                    const isExpanded = expandedGroups.has(group.productId);
                    const toggleGroup = () => setExpandedGroups(prev => {
                      const next = new Set(prev);
                      isExpanded ? next.delete(group.productId) : next.add(group.productId);
                      return next;
                    });
                    return (
                      <div key={group.productId} className={gi > 0 ? "border-t-2 border-gray-100" : ""}>
                        {/* ── Group row ── */}
                        <div className="flex items-center gap-0 px-3 pt-3 pb-2.5">
                          {/* Left: number badge */}
                          <button onClick={toggleGroup}
                            className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-[11px] font-bold shrink-0 mr-2.5 active:bg-emerald-100 self-start mt-0.5">
                            {gi + 1}
                          </button>
                          {/* Center: name + numbers */}
                          <button onClick={toggleGroup} className="flex-1 text-left min-w-0">
                            {/* Product name — BIG & prominent */}
                            <p className="text-gray-800 font-bold text-base leading-tight truncate">{group.productName}</p>
                            {/* Qty row */}
                            <div className="flex items-baseline gap-2 mt-1">
                              <p className="text-gray-900 font-bold tabular-nums text-2xl leading-none">
                                {group.totalQty}
                                <span className="text-sm font-medium text-gray-500 ml-1">{group.unit === "KG" ? "กก." : "ชิ้น"}</span>
                              </p>
                              <span className="bg-blue-50 text-blue-500 rounded px-1.5 py-0.5 text-[10px] font-medium">{group.rounds.length} รอบ</span>
                            </div>
                            {/* Price — secondary */}
                            <p className="text-emerald-600 font-semibold tabular-nums text-sm mt-1">฿{formatMoney(group.totalSubtotal)}</p>
                          </button>
                          {/* Right: buttons */}
                          <div className="flex flex-col items-center justify-center gap-1.5 ml-2 shrink-0">
                            <button onClick={() => handleAddRound(group)}
                              className="flex items-center gap-0.5 text-[11px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl active:bg-emerald-100 transition-colors">
                              <Plus className="w-3 h-3" /> รอบ
                            </button>
                            <button onClick={toggleGroup}
                              className={`text-gray-300 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* ── Round rows (expanded) ── */}
                        {isExpanded && (
                          <div className="bg-gray-50/70 border-t border-gray-100 pb-1">
                            {group.rounds.map(({ item, idx }, ri) => (
                              <div key={idx} className={`flex items-center gap-2 px-3 py-2.5 ${ri > 0 ? "border-t border-gray-100" : ""}`}>
                                <span className="text-gray-300 text-[10px] w-8 pl-2 shrink-0">#{ri + 1}</span>
                                <div className="flex-1 min-w-0">
                                  {/* Round qty — big */}
                                  <p className="text-gray-800 font-bold text-lg tabular-nums leading-none">
                                    {item.quantity}
                                    <span className="text-sm font-medium text-gray-500 ml-1">{item.unit === "KG" ? "กก." : "ชิ้น"}</span>
                                  </p>
                                  <p className="text-gray-400 text-[11px] mt-0.5">
                                    × ฿{item.unitPrice.toLocaleString()}
                                    {item.customPrice && <span className="ml-1 text-purple-400">(ราคาเอง)</span>}
                                  </p>
                                </div>
                                <p className="text-emerald-600 font-semibold text-base tabular-nums shrink-0">฿{formatMoney(item.subtotal)}</p>
                                <button onClick={() => setEditingCartIdx(idx)} className="w-7 h-7 flex items-center justify-center rounded-xl bg-blue-50 text-blue-400 shrink-0">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="w-7 h-7 flex items-center justify-center rounded-xl bg-red-50 text-red-400 shrink-0">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Total row — largest number on the page */}
                  <div className="px-4 py-4 bg-emerald-50 border-t-2 border-emerald-200">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-emerald-600 text-xs font-medium mb-0.5">{cartGroups.length} สินค้า · {cart.length} รอบ</p>
                        <p className="text-emerald-700 text-sm font-semibold">ยอดรวมทั้งหมด</p>
                      </div>
                      <p className="text-emerald-700 font-bold tabular-nums leading-none" style={{ fontSize: 38 }}>
                        ฿{formatMoney(totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Sticky Action Bar ── */}
                <div className="sticky bottom-4 z-10 pt-1">
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-3 space-y-2">

                    {/* 1. เพิ่มสินค้า — ใช้บ่อยที่สุด, full width, อยู่บนสุด */}
                    <button
                      onClick={() => setStep("category")}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 text-base font-semibold active:bg-emerald-100 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      <span>+ เพิ่มสินค้า</span>
                    </button>

                    {/* 2. จ่าย — สำคัญสุด, ใหญ่สุด, อยู่ล่างเพิ่มสินค้า */}
                    <button
                      onClick={() => setShowPayConfirm(true)}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-blue-600 text-white font-bold text-xl active:bg-blue-700 transition-colors disabled:opacity-60 shadow-lg shadow-blue-600/30"
                    >
                      <Banknote className="w-6 h-6 shrink-0" />
                      <span>{saving ? "บันทึก..." : `จ่าย ฿${formatMoney(totalAmount)}`}</span>
                    </button>

                    {/* 3. ยกเลิก (ซ้าย/ไกลนิ้ว) + พักบิล (ขวา) — ทั้งคู่เล็กกว่า */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-red-400 text-sm font-medium active:bg-red-50 transition-colors border border-red-100 flex-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>ยกเลิก</span>
                      </button>
                      <button
                        onClick={() => setShowHoldConfirm(true)}
                        disabled={holdingBill}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 text-sm font-semibold active:bg-amber-100 transition-colors disabled:opacity-50 flex-[2]"
                      >
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>พักบิล</span>
                      </button>
                    </div>

                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {editingCartIdx !== null && (
        <EditCartItemModal
          item={cart[editingCartIdx]}
          onConfirm={(newQty, newPrice) => {
            setCart(cart.map((item, i) => {
              if (i !== editingCartIdx) return item;
              const price = newPrice !== undefined ? newPrice : item.unitPrice;
              return { ...item, quantity: newQty, unitPrice: price, subtotal: newQty * price };
            }));
            setEditingCartIdx(null);
          }}
          onCancel={() => setEditingCartIdx(null)}
        />
      )}
      {showPayConfirm && (
        <PayConfirmModal
          total={totalAmount}
          items={cart}
          customerName={customerName}
          onConfirm={() => { setShowPayConfirm(false); handleSave(); }}
          onCancel={() => setShowPayConfirm(false)}
        />
      )}
      {showHoldConfirm && (
        <HoldConfirmModal total={totalAmount} initialName={customerName} onConfirm={handleHoldConfirm} onCancel={() => setShowHoldConfirm(false)} />
      )}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-md rounded-t-3xl px-5 py-6 overflow-y-auto" style={{ maxHeight: "90vh" }}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">ยกเลิกบิลนี้?</h3>
                <p className="text-gray-400 text-xs">รายการทั้งหมด {cart.length} รายการจะถูกลบออก</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium text-sm active:scale-[0.97] transition-all"
              >
                ไม่ยกเลิก
              </button>
              <button
                onClick={() => {
                  clearDraft();
        setCart([]); setCustomerName(""); setCustomerId(null); setCustomerMode("new"); setCustomerPriceInfo(null); setStep("category");
        setSelectedCategory(null); setSelectedProduct(null); setQuantity("");
        setShowCancelConfirm(false);
                  router.push("/staff");
                }}
                className="py-3.5 rounded-2xl bg-red-500 text-white font-medium text-sm active:scale-[0.97] transition-all shadow-lg shadow-red-500/25"
              >
                ยกเลิกบิล
              </button>
            </div>
          </div>
        </div>
      )}
      {showHeldBills && (
        <HeldBillsModal bills={heldBills} onResume={handleResume} onCancel={handleCancelHeld} onClose={() => setShowHeldBills(false)} />
      )}
      {showReceipt && savedTransaction && (
        <ReceiptModal transaction={savedTransaction} onClose={() => { setShowReceipt(false); setSavedTransaction(null); router.push("/staff"); }} />
      )}

      {/* ── Customer Select Modal ── */}
      {showCustomerModal && (
        <CustomerSelectModal
          priceGroups={priceGroups}
          sessionGroupId={sessionGroupId}
          currentCustomerId={customerId}
          currentCustomerName={customerName}
          onSelectCustomer={(c) => {
            setCustomerMode("regular");
            selectCustomer(c);
            setShowCustomerModal(false);
          }}
          onNewCustomer={(name) => {
            setCustomerMode("new");
            setCustomerName(name);
            setCustomerId(null);
            setCustomerPriceInfo(null);
            setShowCustomerModal(false);
          }}
          onSelectGroup={(groupId) => {
            applySessionGroup(groupId, cart);
          }}
          onClear={() => {
            setCustomerName(""); setCustomerId(null); setCustomerMode("new");
            setCustomerPriceInfo(null); setSessionGroupId(""); setSessionGroupPrices({});
          }}
          onClose={() => setShowCustomerModal(false)}
        />
      )}
    </div>
  );
}

// ── Customer Select Modal (bottom sheet) ─────────────────────
function CustomerSelectModal({
  priceGroups, sessionGroupId, currentCustomerId, currentCustomerName,
  onSelectCustomer, onNewCustomer, onSelectGroup, onClear, onClose,
}: {
  priceGroups: PriceGroup[];
  sessionGroupId: string;
  currentCustomerId: string | null;
  currentCustomerName: string;
  onSelectCustomer: (c: { id: string; name: string; nickname: string | null; phone: string | null; priceGroupId?: string | null }) => void;
  onNewCustomer: (name: string) => void;
  onSelectGroup: (groupId: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [customers, setCustomers] = useState<{ id: string; name: string; nickname: string | null; phone: string | null; priceGroupId: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState(currentCustomerId ? "" : currentCustomerName);
  const [tab, setTab] = useState<"list" | "new">(currentCustomerId ? "list" : "list");
  const [showGroupPicker, setShowGroupPicker] = useState(!!sessionGroupId);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load initial list
    loadCustomers("");
    setTimeout(() => searchRef.current?.focus(), 150);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCustomers = async (search: string) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "20" });
    if (search) params.set("q", search);
    const res = await fetch(`/api/customers?${params}`);
    if (res.ok) {
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : (data.customers ?? []));
    }
    setLoading(false);
  };

  const handleSearch = (val: string) => {
    setQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadCustomers(val), 300);
  };

  const activeGroup = priceGroups.find((g) => g.id === sessionGroupId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-3xl flex flex-col"
        style={{ maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-0 shrink-0" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="font-bold text-gray-800 flex-1">เลือกลูกค้า</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3 shrink-0">
          <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input ref={searchRef} type="text" value={q} onChange={(e) => handleSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, ชื่อเล่น, เบอร์..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none" />
            {q && <button onClick={() => handleSearch("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
          </div>
        </div>

        {/* Customer list */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{q ? `ไม่พบ "${q}"` : "ยังไม่มีลูกค้า"}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {customers.map((c) => {
                const isSelected = c.id === currentCustomerId;
                const pg = priceGroups.find((g) => g.id === c.priceGroupId);
                return (
                  <button key={c.id} onClick={() => onSelectCustomer(c)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                      isSelected ? "bg-emerald-50 border-2 border-emerald-200" : "bg-gray-50 border border-gray-100"
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-emerald-200" : "bg-white"}`}>
                      <User className={`w-5 h-5 ${isSelected ? "text-emerald-700" : "text-gray-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm truncate">{c.name}</p>
                        {c.nickname && <span className="text-xs text-gray-400 shrink-0">"{c.nickname}"</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {pg
                          ? <span className="text-[10px] text-white rounded px-1.5 py-0.5 font-bold" style={{ background: pg.color ?? "#16a34a" }}>กลุ่ม {pg.name}</span>
                          : <span className="text-[10px] text-gray-400">ราคาปกติ</span>
                        }
                        {c.phone && <span className="text-[10px] text-gray-400">{c.phone}</span>}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="shrink-0 border-t border-gray-100 px-5 pt-3 pb-5 space-y-2.5"
          style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>

          {/* ราคาพิเศษรอบนี้ — collapsible */}
          <button onClick={() => setShowGroupPicker((v) => !v)}
            className="w-full flex items-center gap-2 py-2 text-xs font-semibold text-gray-500">
            <Banknote className="w-3.5 h-3.5" />
            ราคาพิเศษรอบนี้ (ไม่ใช้กลุ่มของลูกค้า)
            <ChevronRight className={`w-3.5 h-3.5 ml-auto transition-transform ${showGroupPicker ? "rotate-90" : ""}`} />
            {sessionGroupId && (
              <span className="text-white text-[10px] rounded-md px-1.5 py-0.5 font-bold"
                style={{ background: priceGroups.find(g => g.id === sessionGroupId)?.color ?? "#16a34a" }}>
                กลุ่ม {activeGroup?.name}
              </span>
            )}
          </button>
          {showGroupPicker && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
              <button onClick={() => onSelectGroup("")}
                className={`flex-none px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${!sessionGroupId ? "bg-gray-800 text-white border-gray-800" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                ปกติ
              </button>
              {priceGroups.map((g) => (
                <button key={g.id} onClick={() => onSelectGroup(sessionGroupId === g.id ? "" : g.id)}
                  className={`flex-none px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${sessionGroupId === g.id ? "text-white border-transparent" : "bg-gray-50 border-gray-200"}`}
                  style={sessionGroupId === g.id ? { background: g.color ?? "#16a34a" } : { color: g.color ?? "#16a34a" }}>
                  กลุ่ม {g.name}
                </button>
              ))}
            </div>
          )}

          {/* New customer name input */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3.5 py-2.5 border border-gray-200">
            <Plus className="w-4 h-4 text-gray-400 shrink-0" />
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="หรือพิมพ์ชื่อลูกค้าใหม่..."
              className="flex-1 bg-transparent text-sm placeholder-gray-400 focus:outline-none"
              maxLength={40} />
            {newName.trim() && (
              <button onClick={() => onNewCustomer(newName.trim())}
                className="bg-gray-800 text-white text-xs font-semibold rounded-xl px-3 py-1.5 shrink-0">
                ใช้ชื่อนี้
              </button>
            )}
          </div>

          {/* Clear + Close */}
          <div className="flex gap-2">
            {(currentCustomerId || currentCustomerName || sessionGroupId) && (
              <button onClick={() => { onClear(); onClose(); }}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 text-sm font-semibold active:bg-gray-200">
                ล้างการเลือก
              </button>
            )}
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-semibold active:bg-emerald-600">
              {currentCustomerId ? "ยืนยัน" : "ข้ามไปก่อน"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
