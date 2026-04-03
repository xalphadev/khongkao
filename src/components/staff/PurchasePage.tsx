"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ShoppingCart, Clock, Plus, X, Check,
  Wrench, Cpu, Newspaper, Recycle, GlassWater, Package,
  Scale, Hash, Banknote, User, CheckCircle2, ChevronRight, Pencil,
} from "lucide-react";
import ReceiptModal from "./ReceiptModal";

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  categoryId: string;
}

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unit: string;
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

type CatIconName = "โลหะ" | "อิเล็กทรอนิกส์" | "กระดาษ" | "พลาสติก" | "แก้ว";

const CAT_ICON_MAP: Record<CatIconName, React.ComponentType<{ className?: string }>> = {
  โลหะ: Wrench,
  อิเล็กทรอนิกส์: Cpu,
  กระดาษ: Newspaper,
  พลาสติก: Recycle,
  แก้ว: GlassWater,
};

function CatIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CAT_ICON_MAP[name as CatIconName] ?? Package;
  return <Icon className={className ?? "w-6 h-6"} />;
}

const CAT_COLORS: Record<string, string> = {
  โลหะ: "from-slate-500 to-slate-600",
  อิเล็กทรอนิกส์: "from-blue-500 to-blue-600",
  กระดาษ: "from-amber-500 to-orange-500",
  พลาสติก: "from-purple-500 to-violet-600",
  แก้ว: "from-cyan-500 to-teal-500",
};

const CAT_SHADOW: Record<string, string> = {
  โลหะ: "shadow-slate-500/30",
  อิเล็กทรอนิกส์: "shadow-blue-500/30",
  กระดาษ: "shadow-amber-500/30",
  พลาสติก: "shadow-purple-500/30",
  แก้ว: "shadow-cyan-500/30",
};

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
  onConfirm: (newQty: number) => void;
  onCancel: () => void;
}) {
  const [qty, setQty] = useState(String(item.quantity));
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTimeout(() => inputRef.current?.select(), 100);
  }, []);
  const parsed = parseFloat(qty);
  const isValid = !isNaN(parsed) && parsed > 0;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white w-full max-w-md rounded-t-3xl px-5 py-6">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Pencil className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{item.productName}</h3>
            <p className="text-gray-400 text-xs">฿{item.unitPrice.toLocaleString()} / {item.unit === "KG" ? "กก." : "ชิ้น"}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-3">
          {item.unit === "KG" ? <Scale className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
          <span>{item.unit === "KG" ? "แก้ไขน้ำหนัก (กิโลกรัม)" : "แก้ไขจำนวน (ชิ้น)"}</span>
        </div>

        <input
          ref={inputRef}
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full bg-white rounded-2xl px-4 py-5 text-6xl font-medium text-center focus:outline-none transition-all tabular-nums mb-3"
          style={{ border: "3px solid #60a5fa" }}
          min="0"
          step={item.unit === "KG" ? "0.1" : "1"}
          inputMode="decimal"
        />

        {isValid && (
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-4">
            <p className="text-gray-400 text-sm">ยอดใหม่</p>
            <p className="text-blue-600 font-medium text-xl tabular-nums">฿{formatMoney(parsed * item.unitPrice)}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium text-sm active:scale-[0.97] transition-all">
            ยกเลิก
          </button>
          <button
            onClick={() => isValid && onConfirm(parsed)}
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
      <div className="bg-white w-full max-w-md rounded-t-3xl px-5 py-6">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Banknote className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">ยืนยันการรับซื้อ</h3>
            {customerName ? (
              <p className="text-gray-400 text-xs">ลูกค้า: {customerName}</p>
            ) : (
              <p className="text-gray-400 text-xs">ตรวจสอบรายการก่อนยืนยัน</p>
            )}
          </div>
        </div>

        {/* รายการสินค้า */}
        <div className="bg-gray-50 rounded-2xl overflow-hidden mb-4">
          <div className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm">
                <span className="text-gray-700">
                  {item.productName}
                  <span className="text-gray-400 text-xs ml-1.5">{item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"}</span>
                </span>
                <span className="text-green-600 font-medium tabular-nums">฿{formatMoney(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-green-50 border-t border-green-100">
            <span className="text-green-800 font-medium text-sm">ยอดรวม</span>
            <span className="text-green-700 font-medium text-xl tabular-nums">฿{formatMoney(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium text-sm active:scale-[0.97] transition-all">
            ยกเลิก
          </button>
          <button onClick={onConfirm} className="py-3.5 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 text-white font-medium text-sm active:scale-[0.97] transition-all shadow-lg shadow-green-600/25 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> ยืนยันจ่ายเงิน
          </button>
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
  const [editingCartIdx, setEditingCartIdx] = useState<number | null>(null);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [holdingBill, setHoldingBill] = useState(false);

  const quantityRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    loadHeldBills();
  }, []);

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
  const handleProductSelect = (p: Product) => { setSelectedProduct(p); setQuantity(""); setStep("quantity"); };

  const handleAddToCart = () => {
    if (!selectedProduct || !quantity || parseFloat(quantity) <= 0) return;
    const qty = parseFloat(quantity);
    const subtotal = qty * selectedProduct.pricePerUnit;
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
        quantity: qty, unitPrice: selectedProduct.pricePerUnit, subtotal,
        unit: selectedProduct.unit,
      }]);
    }
    setStep("category");
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

            {heldBills.length > 0 && (
              <button onClick={() => setShowHeldBills(true)} className="w-full mb-4 flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-3 active:scale-[0.98] transition-all">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-amber-800 font-medium text-sm">มีบิลพักอยู่ {heldBills.length} บิล</p>
                  <p className="text-amber-600 text-xs">แตะเพื่อรับช่วงต่อ หรือเปิดบิลใหม่ได้เลย</p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500" />
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`relative bg-gradient-to-br ${CAT_COLORS[cat.name] ?? "from-gray-500 to-gray-600"} rounded-2xl p-4 flex flex-col items-start gap-3 shadow-lg ${CAT_SHADOW[cat.name] ?? "shadow-gray-500/20"} active:scale-[0.96] transition-all overflow-hidden`}
                >
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                  <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                    <CatIcon name={cat.name} className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm leading-tight">{cat.name}</p>
                    <p className="text-white/60 text-xs">{cat.products.length} รายการ</p>
                  </div>
                </button>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="mt-5">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-green-50 flex justify-between items-center border-b border-green-100">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-medium">{cart.length}</span>
                      <p className="text-green-800 text-sm font-medium">สินค้าในตะกร้า</p>
                    </div>
                    <p className="text-green-700 font-medium tabular-nums">฿{formatMoney(totalAmount)}</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {cart.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-700">{item.productName}</span>
                          <span className="text-gray-400 text-xs ml-1.5">{item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"}</span>
                        </div>
                        <span className="text-green-600 font-medium tabular-nums shrink-0">฿{formatMoney(item.subtotal)}</span>
                        <button onClick={() => setEditingCartIdx(i)} className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-blue-400 hover:bg-blue-100 transition-all shrink-0">
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 space-y-2">
                    <CustomerNameInput />
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setShowHoldConfirm(true)} disabled={holdingBill} className="flex items-center justify-center gap-1.5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-700 text-sm font-medium active:scale-[0.97] transition-all" style={{ minHeight: 52 }}>
                        <Clock className="w-4 h-4 shrink-0" /> พักบิล
                      </button>
                      <button onClick={() => setShowPayConfirm(true)} disabled={saving} className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 disabled:from-green-400 disabled:to-green-400 text-white shadow-lg shadow-green-600/25 active:scale-[0.97] transition-all" style={{ minHeight: 52 }}>
                        <Banknote className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium">{saving ? "บันทึก..." : `จ่าย ฿${formatMoney(totalAmount)}`}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
                  <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    <CatIcon name={selectedCategory.name} className="w-5 h-5 text-gray-500" />
                  </div>
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
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <CatIcon name={selectedCategory?.name ?? ""} className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                <p className="text-green-600 text-sm">฿{selectedProduct.pricePerUnit.toLocaleString()} / {selectedProduct.unit === "KG" ? "กก." : "ชิ้น"}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl px-5 py-6 shadow-sm">
              {/* Label */}
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-3">
                {selectedProduct.unit === "KG" ? <Scale className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                <span>{selectedProduct.unit === "KG" ? "ใส่น้ำหนัก (กิโลกรัม)" : "ใส่จำนวน (ชิ้น)"}</span>
              </div>

              {/* ── ช่องตัวเลข: เป็น hero ── */}
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

              {/* ── ยอดเงิน: secondary ── */}
              {quantity && parseFloat(quantity) > 0 ? (
                <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-gray-400 text-sm">ยอดที่ต้องจ่าย</p>
                  <p className="text-green-600 font-medium text-xl tabular-nums">
                    ฿{formatMoney(parseFloat(quantity) * selectedProduct.pricePerUnit)}
                  </p>
                </div>
              ) : (
                <div className="mt-3 bg-gray-50 rounded-xl px-4 py-3 text-center">
                  <p className="text-gray-300 text-sm">ยอดเงินจะแสดงเมื่อใส่จำนวน</p>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={!quantity || parseFloat(quantity) <= 0}
                className="btn-staff bg-green-600 hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-300 text-white mt-4 shadow-lg shadow-green-600/25 disabled:shadow-none"
                style={{ minHeight: 60 }}
              >
                <Check className="w-5 h-5" /> เพิ่มรายการ
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Cart ── */}
        {step === "cart" && (
          <div>
            <p className="text-gray-400 text-sm mb-4">ตรวจสอบรายการก่อนบันทึก</p>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                <ShoppingCart className="w-12 h-12 text-gray-200 mb-2" />
                <p className="font-medium text-gray-500">ยังไม่มีรายการ</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {cart.map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl px-4 py-3.5 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-sm font-medium shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium text-sm">{item.productName}</p>
                      <p className="text-gray-400 text-xs">{item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"} × ฿{item.unitPrice.toLocaleString()}</p>
                    </div>
                    <p className="text-green-600 font-medium text-sm tabular-nums shrink-0">฿{formatMoney(item.subtotal)}</p>
                    <button onClick={() => setEditingCartIdx(i)} className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-blue-400 hover:bg-blue-100 transition-all shrink-0">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div className="bg-white rounded-2xl px-5 py-4 shadow-sm mb-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-500 text-sm">ยอดรวมทั้งหมด</p>
                    <p className="text-3xl font-medium text-green-600 tabular-nums">฿{formatMoney(totalAmount)}</p>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full w-full" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm mb-4 flex items-center gap-3 border-2 border-transparent focus-within:border-green-400 transition-all">
                  <User className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-400 text-xs mb-0.5">ชื่อลูกค้า</p>
                    <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-transparent text-base text-gray-800 placeholder-gray-300 focus:outline-none"
                      placeholder="ไม่บังคับ เช่น ลุงสมชาย" maxLength={40} />
                  </div>
                  {customerName && (
                    <button onClick={() => setCustomerName("")} className="text-gray-300 hover:text-gray-500 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button onClick={() => setStep("category")} className="btn-staff bg-white text-gray-600 shadow-sm border border-gray-200 mb-2" style={{ minHeight: 52 }}>
                  <Plus className="w-4 h-4" /> เพิ่มสินค้า
                </button>
                <button onClick={() => setShowHoldConfirm(true)} disabled={holdingBill} className="btn-staff bg-amber-50 border-2 border-amber-200 text-amber-700 mb-2" style={{ minHeight: 52, fontSize: "0.95rem" }}>
                  <Clock className="w-4 h-4" /> พักบิลนี้ไว้ก่อน
                </button>
                <button onClick={() => setShowPayConfirm(true)} disabled={saving} className="btn-staff bg-gradient-to-r from-green-600 to-green-500 disabled:from-green-400 disabled:to-green-400 text-white shadow-lg shadow-green-600/25" style={{ minHeight: 64 }}>
                  <Banknote className="w-5 h-5" />
                  {saving ? "กำลังบันทึก..." : `จ่ายเงิน ฿${formatMoney(totalAmount)}`}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {editingCartIdx !== null && (
        <EditCartItemModal
          item={cart[editingCartIdx]}
          onConfirm={(newQty) => {
            setCart(cart.map((item, i) =>
              i === editingCartIdx
                ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice }
                : item
            ));
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
      {showHeldBills && (
        <HeldBillsModal bills={heldBills} onResume={handleResume} onCancel={handleCancelHeld} onClose={() => setShowHeldBills(false)} />
      )}
      {showReceipt && savedTransaction && (
        <ReceiptModal transaction={savedTransaction} onClose={() => { setShowReceipt(false); setSavedTransaction(null); router.push("/staff"); }} />
      )}
    </div>
  );
}
