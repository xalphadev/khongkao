"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ShoppingCart, Clock, Plus, X, Check,
  Package,
  Scale, Hash, Banknote, User, CheckCircle2, ChevronRight, Pencil, Trash2,
} from "lucide-react";
import ReceiptModal from "./ReceiptModal";
import { getIconComponent, getCategoryGradient } from "@/components/owner/CategoriesPage";

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
      <div className="bg-white w-full max-w-md rounded-t-3xl px-5 py-6">
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
  const [qty, setQty] = useState(String(item.quantity));
  const [price, setPrice] = useState(String(item.unitPrice));
  const qtyRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTimeout(() => (item.customPrice ? priceRef : qtyRef).current?.select(), 100);
  }, [item.customPrice]);

  const parsedQty = parseFloat(qty);
  const parsedPrice = parseFloat(price);
  const effectivePrice = item.customPrice ? parsedPrice : item.unitPrice;
  const isQtyValid = !isNaN(parsedQty) && parsedQty > 0;
  const isPriceValid = !item.customPrice || (!isNaN(parsedPrice) && parsedPrice > 0);
  const isValid = isQtyValid && isPriceValid;
  const newTotal = isValid ? parsedQty * effectivePrice : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white w-full max-w-md rounded-t-3xl px-5 py-6">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.customPrice ? "bg-purple-50" : "bg-blue-50"}`}>
            <Pencil className={`w-5 h-5 ${item.customPrice ? "text-purple-500" : "text-blue-500"}`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{item.productName}</h3>
            {item.customPrice
              ? <p className="text-purple-500 text-xs font-medium">กรอกราคาเอง</p>
              : <p className="text-gray-400 text-xs">฿{item.unitPrice.toLocaleString()} / {item.unit === "KG" ? "กก." : "ชิ้น"}</p>
            }
          </div>
        </div>

        {/* ── ราคา/หน่วย (เฉพาะ customPrice) ── */}
        {item.customPrice && (
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-2">
              <Banknote className="w-4 h-4" />
              <span>ราคารับซื้อ / หน่วย (บาท)</span>
            </div>
            <input
              ref={priceRef}
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-white rounded-2xl px-4 py-4 text-5xl font-medium text-center focus:outline-none tabular-nums"
              style={{ border: `3px solid ${isPriceValid && price ? "#a855f7" : "#e5e7eb"}` }}
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0"
            />
          </div>
        )}

        {/* ── จำนวน ── */}
        <div className={item.customPrice ? "" : ""}>
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-2">
            {item.unit === "KG" ? <Scale className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
            <span>{item.unit === "KG" ? "น้ำหนัก (กิโลกรัม)" : "จำนวน (ชิ้น)"}</span>
          </div>
          <input
            ref={qtyRef}
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full bg-white rounded-2xl px-4 py-4 text-5xl font-medium text-center focus:outline-none transition-all tabular-nums"
            style={{ border: `3px solid ${isQtyValid ? "#60a5fa" : "#e5e7eb"}` }}
            min="0"
            step={item.unit === "KG" ? "0.1" : "1"}
            inputMode="decimal"
            placeholder="0"
          />
        </div>

        {/* ── ยอดใหม่ ── */}
        <div className={`flex items-center justify-between rounded-xl px-4 py-3 mt-3 mb-4 ${isValid ? "bg-green-50" : "bg-gray-50"}`}>
          <p className="text-gray-400 text-sm">ยอดใหม่</p>
          <p className={`font-semibold text-xl tabular-nums ${isValid ? "text-green-600" : "text-gray-300"}`}>
            {isValid ? `฿${formatMoney(newTotal)}` : "—"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium text-sm active:scale-[0.97] transition-all">
            ยกเลิก
          </button>
          <button
            onClick={() => isValid && onConfirm(parsedQty, item.customPrice ? parsedPrice : undefined)}
            disabled={!isValid}
            className="py-3.5 rounded-2xl bg-blue-500 disabled:bg-gray-100 disabled:text-gray-300 text-white font-medium text-sm active:scale-[0.97] transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> บันทึก
          </button>
        </div>
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
              {items.length} รายการ
            </span>
          </div>
        </div>

        {/* ── Items list (scrollable) ── */}
        <div className="flex-1 overflow-y-auto mx-5 mb-0">
          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <div className="divide-y divide-gray-100">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm">
                  <span className="text-gray-700 flex-1 min-w-0 pr-2 truncate">
                    {item.productName}
                    <span className="text-gray-400 text-xs ml-1.5">{item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"}</span>
                  </span>
                  <span className="text-green-600 font-medium tabular-nums shrink-0">฿{formatMoney(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Total + Buttons (fixed bottom) ── */}
        <div className="px-5 pt-3 pb-6 shrink-0">
          <div className="flex justify-between items-center px-4 py-3 bg-green-50 rounded-2xl border border-green-100 mb-3">
            <span className="text-green-800 font-semibold text-sm">ยอดรวมทั้งหมด</span>
            <span className="text-green-700 font-bold text-2xl tabular-nums">฿{formatMoney(total)}</span>
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
                    <p className="text-green-600 font-medium text-sm tabular-nums">฿{formatMoney(total)}</p>
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
                        <span className="text-green-600 tabular-nums">฿{formatMoney(item.subtotal)}</span>
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>("category");
  const [saving, setSaving] = useState(false);
  const [savedTransaction, setSavedTransaction] = useState<{
    id: string; totalAmount: number; items: CartItem[]; createdAt: string; customerName?: string | null;
  } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [showHoldConfirm, setShowHoldConfirm] = useState(false);
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editingCartIdx, setEditingCartIdx] = useState<number | null>(null);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [holdingBill, setHoldingBill] = useState(false);

  const [customUnitPrice, setCustomUnitPrice] = useState("");
  const quantityRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    loadHeldBills();
  }, []);

  // Auto-resume held bill from query param ?held=<id>
  useEffect(() => {
    const heldId = searchParams.get("held");
    if (!heldId || heldBills.length === 0) return;
    const bill = heldBills.find((b) => b.id === heldId);
    if (bill) handleResume(bill);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heldBills]);

  useEffect(() => {
    if (step === "quantity") setTimeout(() => quantityRef.current?.focus(), 150);
  }, [step]);

  const loadHeldBills = useCallback(async () => {
    const res = await fetch("/api/held-bills");
    if (res.ok) setHeldBills(await res.json());
  }, []);

  const totalAmount = cart.reduce((s, i) => s + i.subtotal, 0);

  const handleBack = () => {
    if (step === "category") cart.length > 0 ? setStep("cart") : router.push("/staff");
    else if (step === "product") setStep("category");
    else if (step === "quantity") setStep("product");
    else if (step === "cart") setStep("category");
  };

  const handleCategorySelect = (cat: Category) => { setSelectedCategory(cat); setStep("product"); };
  const handleProductSelect = (p: Product) => { setSelectedProduct(p); setQuantity(""); setCustomUnitPrice(""); setStep("quantity"); };

  const handleAddToCart = () => {
    if (!selectedProduct || !quantity || parseFloat(quantity) <= 0) return;
    if (selectedProduct.customPrice && (!customUnitPrice || parseFloat(customUnitPrice) <= 0)) return;
    const qty = parseFloat(quantity);
    const unitPrice = selectedProduct.customPrice ? parseFloat(customUnitPrice) : selectedProduct.pricePerUnit;
    const subtotal = qty * unitPrice;
    const idx = cart.findIndex((i) => i.productId === selectedProduct.id);
    if (idx >= 0) {
      const updated = [...cart];
      updated[idx].quantity += qty;
      updated[idx].subtotal += subtotal;
      setCart(updated);
    } else {
      setCart([...cart, {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: qty, unitPrice, subtotal,
        unit: selectedProduct.unit,
        customPrice: selectedProduct.customPrice,
      }]);
    }
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
        setCart([]); setCustomerName(""); setStep("category");
        setSelectedCategory(null); setSelectedProduct(null); setQuantity("");
        setShowHoldConfirm(false);
        await loadHeldBills();
        router.push("/staff");
      }
    } finally { setHoldingBill(false); }
  };

  const handleResume = async (bill: HeldBill) => {
    const merged = [...cart];
    for (const incoming of bill.items) {
      const idx = merged.findIndex((i) => i.productId === incoming.productId);
      if (idx >= 0) { merged[idx].quantity += incoming.quantity; merged[idx].subtotal += incoming.subtotal; }
      else merged.push(incoming);
    }
    setCart(merged);
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
        body: JSON.stringify({ items: cart, customerName: customerName.trim() || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedTransaction({ ...data, items: cart, customerName: customerName.trim() || null });
        setShowReceipt(true);
        setCart([]); setCustomerName(""); setStep("category");
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

  // ── Cart action block (reused in category preview + cart step) ──
  const CustomerNameInput = () => (
    <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2.5 border-2 border-transparent focus-within:border-green-400 transition-all">
      <User className="w-4 h-4 text-gray-400 shrink-0" />
      <input
        type="text"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
        placeholder="ชื่อลูกค้า (ไม่บังคับ)"
        maxLength={40}
      />
      {customerName && (
        <button onClick={() => setCustomerName("")} className="text-gray-300 hover:text-gray-500">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">

      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-4 pt-4 pb-5 sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={handleBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 transition-all shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-medium">บันทึกรับซื้อ</h1>
            <p className="text-green-200 text-xs">{stepTitles[step]}</p>
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
              <span className="bg-white text-green-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">{cart.length}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
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
            <p className="text-gray-400 text-sm mb-4">เลือกประเภทของที่ลูกค้านำมาขาย</p>

            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => {
                const grad = getCategoryGradient(cat.color ?? "#16a34a");
                const CIcon = getIconComponent(cat.icon ?? "Package");
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat)}
                    className="relative rounded-3xl flex flex-col items-start gap-4 shadow-xl active:scale-[0.95] transition-all overflow-hidden"
                    style={{ padding: "20px 18px 22px", background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`, boxShadow: `0 8px 24px ${grad.from}50` }}
                  >
                    <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-black/[0.08] rounded-full" />
                    <div className="w-14 h-14 bg-white/25 rounded-2xl flex items-center justify-center relative">
                      <CIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="relative">
                      <p className="text-white font-bold text-xl leading-tight">{cat.name}</p>
                      <p className="text-white/70 text-sm mt-1">{cat.products.length} รายการ</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ปุ่มดูตะกร้าเมื่อมีสินค้า — ไม่แสดง list ให้ไปดูที่หน้า cart แทน */}
            {cart.length > 0 && (
              <button
                onClick={() => setStep("cart")}
                className="mt-5 w-full bg-white rounded-2xl shadow-sm border border-green-100 px-4 py-4 flex items-center gap-3 active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-green-800 font-medium text-sm">ดูรายการในตะกร้า</p>
                  <p className="text-green-600 text-xs">{cart.length} รายการ · ฿{formatMoney(totalAmount)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-green-400" />
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
                  className="w-full bg-white rounded-2xl px-4 py-4 shadow-sm active:scale-[0.98] active:bg-green-50 transition-all flex items-center gap-4">
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
                    <p className="text-green-600 font-medium text-lg tabular-nums">฿{product.pricePerUnit.toLocaleString()}</p>
                    <p className="text-gray-400 text-xs">/{product.unit === "KG" ? "กก." : "ชิ้น"}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Quantity ── */}
        {step === "quantity" && selectedProduct && (
          <div>
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex items-center gap-3">
              {(() => {
                const g = getCategoryGradient(selectedCategory?.color ?? "#16a34a");
                const I = getIconComponent(selectedCategory?.icon ?? "Package");
                return (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}>
                    <I className="w-6 h-6 text-white" />
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                {selectedProduct.customPrice
                  ? <p className="text-purple-600 text-sm font-medium">กรอกราคาเอง</p>
                  : <p className="text-green-600 text-sm">฿{selectedProduct.pricePerUnit.toLocaleString()} / {selectedProduct.unit === "KG" ? "กก." : "ชิ้น"}</p>
                }
              </div>
            </div>

            <div className="bg-white rounded-2xl px-5 py-6 shadow-sm space-y-4">
              {/* ── ราคาต่อหน่วย (เฉพาะ customPrice) ── */}
              {selectedProduct.customPrice && (
                <div>
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-3">
                    <Banknote className="w-4 h-4" />
                    <span>ราคารับซื้อ (บาท / {selectedProduct.unit === "KG" ? "กก." : "ชิ้น"})</span>
                  </div>
                  <input
                    type="number"
                    value={customUnitPrice}
                    onChange={(e) => setCustomUnitPrice(e.target.value)}
                    className="w-full bg-white rounded-2xl px-4 py-4 text-5xl font-medium text-center focus:outline-none transition-all tabular-nums"
                    style={{ border: "3px solid #a855f7" }}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                  />
                </div>
              )}

              {/* ── จำนวน ── */}
              <div>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-3">
                  {selectedProduct.unit === "KG" ? <Scale className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                  <span>{selectedProduct.unit === "KG" ? "ใส่น้ำหนัก (กิโลกรัม)" : "ใส่จำนวน (ชิ้น)"}</span>
                </div>
                <input
                  ref={quantityRef}
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-white rounded-2xl px-4 py-5 text-7xl font-medium text-center focus:outline-none transition-all tabular-nums"
                  style={{ border: "3px solid #4ade80" }}
                  placeholder="0"
                  min="0"
                  step={selectedProduct.unit === "KG" ? "0.1" : "1"}
                  inputMode="decimal"
                />
              </div>

              {/* ── ยอดเงิน: secondary ── */}
              {quantity && parseFloat(quantity) > 0 && (!selectedProduct.customPrice || (customUnitPrice && parseFloat(customUnitPrice) > 0)) ? (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-gray-400 text-sm">ยอดที่ต้องจ่าย</p>
                  <p className="text-green-600 font-medium text-xl tabular-nums">
                    ฿{formatMoney(parseFloat(quantity) * (selectedProduct.customPrice ? parseFloat(customUnitPrice || "0") : selectedProduct.pricePerUnit))}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                  <p className="text-gray-300 text-sm">ยอดเงินจะแสดงเมื่อใส่จำนวน{selectedProduct.customPrice ? "และราคา" : ""}</p>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={
                  !quantity || parseFloat(quantity) <= 0 ||
                  (selectedProduct.customPrice && (!customUnitPrice || parseFloat(customUnitPrice) <= 0))
                }
                className="btn-staff bg-green-600 hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-300 text-white shadow-lg shadow-green-600/25 disabled:shadow-none"
                style={{ minHeight: 60 }}
              >
                <Check className="w-5 h-5" /> เพิ่มรายการ
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Cart ── */}
        {step === "cart" && (
          <div className="flex flex-col gap-2.5">

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                <ShoppingCart className="w-12 h-12 text-gray-200 mb-2" />
                <p className="font-medium text-gray-500">ยังไม่มีรายการ</p>
                <button onClick={() => setStep("category")} className="mt-3 flex items-center gap-1.5 text-green-600 text-sm font-medium">
                  <Plus className="w-4 h-4" /> เพิ่มสินค้า
                </button>
              </div>
            ) : (
              <>
                {/* ── Customer name ── */}
                <div className="bg-white rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-3 border-2 border-transparent focus-within:border-green-400 transition-all">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                    placeholder="ชื่อลูกค้า (ไม่บังคับ)"
                    maxLength={40}
                  />
                  {customerName && (
                    <button onClick={() => setCustomerName("")} className="text-gray-300 shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* ── Items (compact table) ── */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-gray-400 text-xs font-medium flex-1">สินค้า ({cart.length} รายการ)</span>
                    <span className="text-gray-400 text-xs font-medium w-20 text-center">จำนวน × ราคา</span>
                    <span className="text-gray-400 text-xs font-medium w-16 text-right">ยอด</span>
                    <span className="w-14" />
                  </div>
                  {/* Rows */}
                  {cart.map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 ${i > 0 ? "border-t border-gray-50" : ""}`}>
                      <span className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium text-sm leading-tight truncate">{item.productName}</p>
                        <p className="text-gray-400 text-[11px] leading-tight">
                          {item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"} × ฿{item.unitPrice.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-green-600 font-semibold text-sm tabular-nums shrink-0 w-16 text-right">฿{formatMoney(item.subtotal)}</p>
                      <button onClick={() => setEditingCartIdx(i)} className="w-7 h-7 flex items-center justify-center rounded-xl bg-blue-50 text-blue-400 shrink-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="w-7 h-7 flex items-center justify-center rounded-xl bg-red-50 text-red-400 shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {/* Total row */}
                  <div className="flex items-center justify-between px-3 py-3 bg-green-50 border-t border-green-100">
                    <p className="text-green-700 text-sm font-semibold">ยอดรวม {cart.length} รายการ</p>
                    <p className="text-green-700 font-bold text-xl tabular-nums">฿{formatMoney(totalAmount)}</p>
                  </div>
                </div>

                {/* ── Sticky Action Bar ── */}
                <div className="sticky bottom-4 z-10 pt-1">
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-3 space-y-2.5">
                    {/* จ่าย */}
                    <button
                      onClick={() => setShowPayConfirm(true)}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg active:bg-blue-700 transition-colors disabled:opacity-60 shadow-md shadow-blue-600/30"
                    >
                      <Banknote className="w-6 h-6 shrink-0" />
                      <span>{saving ? "บันทึก..." : `จ่าย ฿${formatMoney(totalAmount)}`}</span>
                    </button>
                    {/* เพิ่มสินค้า + พักบิล */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setStep("category")}
                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-600 text-sm font-medium active:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>เพิ่มสินค้า</span>
                      </button>
                      <button
                        onClick={() => setShowHoldConfirm(true)}
                        disabled={holdingBill}
                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 text-sm font-medium active:bg-amber-100 transition-colors disabled:opacity-50"
                      >
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>พักบิล</span>
                      </button>
                    </div>
                    {/* ยกเลิก */}
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-2xl text-red-400 text-sm font-medium active:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ยกเลิกบิลนี้</span>
                    </button>
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
          <div className="bg-white w-full max-w-md rounded-t-3xl px-5 py-6">
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
                  setCart([]); setCustomerName(""); setStep("category");
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
    </div>
  );
}
