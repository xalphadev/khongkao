"use client";

import { useState, useEffect } from "react";
import {
  Plus, X,
  Wrench, Cpu, Newspaper, Recycle, GlassWater, Package,
  Hammer, Zap, Smartphone, Tv, Radio, Monitor, Printer,
  FileText, BookOpen, Book, Box,
  Shirt, Tag, ShoppingBag, Gift,
  UtensilsCrossed, Coffee, Microwave,
  Car, Bike, Truck, Cog,
  Gem, Watch, Glasses,
  Sofa, Home, DoorOpen, Lamp,
  Gamepad2, Puzzle, Dumbbell, Trophy,
  Leaf, FlaskConical, Scissors, Paintbrush,
  Music, Camera, Headphones,
  Archive, Layers, Grid3x3,
} from "lucide-react";

// ── Icon registry ────────────────────────────────────────────────
export const ICON_OPTIONS: { key: string; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  // โลหะ / เครื่องมือ
  { key: "Wrench",       label: "ประแจ",       Icon: Wrench },
  { key: "Hammer",       label: "ค้อน",        Icon: Hammer },
  { key: "Cog",          label: "ฟันเฟือง",    Icon: Cog },
  { key: "Zap",          label: "ไฟฟ้า",       Icon: Zap },
  { key: "Scissors",     label: "กรรไกร",      Icon: Scissors },
  // อิเล็กทรอนิกส์
  { key: "Cpu",          label: "CPU",         Icon: Cpu },
  { key: "Smartphone",   label: "มือถือ",      Icon: Smartphone },
  { key: "Tv",           label: "โทรทัศน์",    Icon: Tv },
  { key: "Monitor",      label: "จอคอม",       Icon: Monitor },
  { key: "Radio",        label: "วิทยุ",       Icon: Radio },
  { key: "Printer",      label: "เครื่องพิมพ์", Icon: Printer },
  { key: "Camera",       label: "กล้อง",       Icon: Camera },
  { key: "Headphones",   label: "หูฟัง",       Icon: Headphones },
  { key: "Microwave",    label: "ไมโครเวฟ",    Icon: Microwave },
  // กระดาษ / หนังสือ
  { key: "Newspaper",    label: "หนังสือพิมพ์", Icon: Newspaper },
  { key: "FileText",     label: "เอกสาร",      Icon: FileText },
  { key: "Book",         label: "หนังสือ",     Icon: Book },
  { key: "BookOpen",     label: "หนังสือเปิด", Icon: BookOpen },
  // พลาสติก / กล่อง
  { key: "Recycle",      label: "รีไซเคิล",   Icon: Recycle },
  { key: "Package",      label: "กล่องสินค้า", Icon: Package },
  { key: "Box",          label: "กล่อง",       Icon: Box },
  { key: "Archive",      label: "เก็บเอกสาร", Icon: Archive },
  // แก้ว / เครื่องครัว
  { key: "GlassWater",   label: "แก้วน้ำ",     Icon: GlassWater },
  { key: "UtensilsCrossed", label: "เครื่องครัว", Icon: UtensilsCrossed },
  { key: "Coffee",       label: "กาแฟ",        Icon: Coffee },
  // เสื้อผ้า / แฟชั่น
  { key: "Shirt",        label: "เสื้อผ้า",    Icon: Shirt },
  { key: "Tag",          label: "ป้ายราคา",    Icon: Tag },
  { key: "ShoppingBag",  label: "ถุงช้อปปิ้ง", Icon: ShoppingBag },
  { key: "Glasses",      label: "แว่นตา",      Icon: Glasses },
  { key: "Watch",        label: "นาฬิกา",      Icon: Watch },
  { key: "Gem",          label: "เพชรพลอย",    Icon: Gem },
  { key: "Gift",         label: "ของขวัญ",     Icon: Gift },
  // เฟอร์นิเจอร์ / บ้าน
  { key: "Sofa",         label: "โซฟา",        Icon: Sofa },
  { key: "Home",         label: "บ้าน",        Icon: Home },
  { key: "DoorOpen",     label: "ประตู",       Icon: DoorOpen },
  { key: "Lamp",         label: "โคมไฟ",       Icon: Lamp },
  // ยานพาหนะ
  { key: "Car",          label: "รถยนต์",      Icon: Car },
  { key: "Bike",         label: "จักรยาน",     Icon: Bike },
  { key: "Truck",        label: "รถบรรทุก",    Icon: Truck },
  // กีฬา / ของเล่น
  { key: "Gamepad2",     label: "เกม",         Icon: Gamepad2 },
  { key: "Puzzle",       label: "ปริศนา",      Icon: Puzzle },
  { key: "Dumbbell",     label: "ดัมเบล",      Icon: Dumbbell },
  { key: "Trophy",       label: "ถ้วยรางวัล",  Icon: Trophy },
  // อื่นๆ
  { key: "Music",        label: "ดนตรี",       Icon: Music },
  { key: "Paintbrush",   label: "สี/ศิลปะ",    Icon: Paintbrush },
  { key: "FlaskConical", label: "เคมี",        Icon: FlaskConical },
  { key: "Leaf",         label: "ธรรมชาติ",    Icon: Leaf },
  { key: "Layers",       label: "หลายชั้น",    Icon: Layers },
  { key: "Grid3x3",      label: "ทั่วไป",      Icon: Grid3x3 },
];

export const COLOR_OPTIONS = [
  { key: "#16a34a", label: "เขียว",        from: "#15803d", to: "#22c55e" },
  { key: "#2563eb", label: "น้ำเงิน",      from: "#1d4ed8", to: "#3b82f6" },
  { key: "#dc2626", label: "แดง",          from: "#b91c1c", to: "#f87171" },
  { key: "#d97706", label: "ส้มทอง",       from: "#b45309", to: "#fbbf24" },
  { key: "#7c3aed", label: "ม่วง",         from: "#6d28d9", to: "#a78bfa" },
  { key: "#0891b2", label: "ฟ้าคราม",     from: "#0e7490", to: "#22d3ee" },
  { key: "#db2777", label: "ชมพู",         from: "#be185d", to: "#f472b6" },
  { key: "#65a30d", label: "เขียวมะนาว",   from: "#4d7c0f", to: "#a3e635" },
  { key: "#ea580c", label: "ส้ม",          from: "#c2410c", to: "#fb923c" },
  { key: "#0f766e", label: "เขียวน้ำ",     from: "#0f766e", to: "#2dd4bf" },
  { key: "#475569", label: "เทาเข้ม",      from: "#334155", to: "#94a3b8" },
  { key: "#92400e", label: "น้ำตาล",       from: "#78350f", to: "#d97706" },
  { key: "#1e40af", label: "น้ำเงินเข้ม",  from: "#1e3a8a", to: "#3b82f6" },
  { key: "#9d174d", label: "แดงม่วง",      from: "#831843", to: "#ec4899" },
  { key: "#064e3b", label: "เขียวเข้ม",    from: "#022c22", to: "#10b981" },
  { key: "#1e3a5f", label: "กรมท่า",       from: "#0f172a", to: "#3b82f6" },
  { key: "#7e22ce", label: "ม่วงเข้ม",     from: "#581c87", to: "#c084fc" },
  { key: "#b45309", label: "เหลืองทอง",    from: "#92400e", to: "#fcd34d" },
  { key: "#0e7490", label: "ฟ้าทะเล",      from: "#164e63", to: "#67e8f9" },
  { key: "#be123c", label: "แดงเข้ม",      from: "#881337", to: "#fb7185" },
];

export function getIconComponent(key: string): React.ComponentType<{ className?: string }> {
  return ICON_OPTIONS.find((o) => o.key === key)?.Icon ?? Package;
}
export function getCategoryGradient(colorKey: string) {
  return COLOR_OPTIONS.find((c) => c.key === colorKey) ?? COLOR_OPTIONS[0];
}

interface Category {
  id: string; name: string; description: string | null;
  icon: string | null; color: string | null;
  isActive: boolean; products: { id: string }[];
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{children}</label>
);

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "", icon: "Package", color: "#16a34a" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setCategories(await fetch("/api/categories?includeInactive=true").then((r) => r.json()));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", icon: "Package", color: "#16a34a" });
    setError(""); setShowModal(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? "", icon: c.icon ?? "Package", color: c.color ?? "#16a34a" });
    setError(""); setShowModal(true);
  };

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

  const selectedColor = getCategoryGradient(form.color);
  const SelectedIcon = getIconComponent(form.icon);

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
            const grad = getCategoryGradient(c.color ?? "#16a34a");
            const CIcon = getIconComponent(c.icon ?? "Package");
            return (
              <div key={c.id} className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all ${!c.isActive ? "opacity-50" : "hover:shadow-md"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}>
                    <CIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                    {c.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{c.description}</p>}
                    <p className="text-gray-400 text-xs mt-0.5">{c.products.length} สินค้า</p>
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

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

            {/* Header with preview */}
            <div className="relative overflow-hidden px-5 pt-5 pb-6 shrink-0"
              style={{ background: `linear-gradient(135deg, ${selectedColor.from}, ${selectedColor.to})` }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="flex items-center justify-between mb-4 relative">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/25 flex items-center justify-center shadow-inner">
                    <SelectedIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">{form.name || "ชื่อหมวดหมู่"}</p>
                    <p className="text-white/70 text-xs mt-0.5">{form.description || "คำอธิบาย"}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white/20 text-white active:bg-white/30">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-white/60 text-xs relative">ตัวอย่างที่จะแสดงให้ป้าๆ เห็น</p>
            </div>

            {/* Scrollable form */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

              {/* ชื่อ */}
              <div>
                <FieldLabel>ชื่อหมวดหมู่ *</FieldLabel>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none"
                  placeholder="เช่น โลหะ, กระดาษ, อิเล็กทรอนิกส์" />
              </div>

              {/* คำอธิบาย */}
              <div>
                <FieldLabel>คำอธิบาย (ถ้ามี)</FieldLabel>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none"
                  placeholder="เช่น เหล็ก, ทองแดง, อลูมิเนียม" />
              </div>

              {/* เลือกสี */}
              <div>
                <FieldLabel>เลือกสี</FieldLabel>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setForm({ ...form, color: c.key })}
                      className="relative w-full aspect-square rounded-2xl transition-all active:scale-90"
                      style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                      title={c.label}
                    >
                      {form.color === c.key && (
                        <div className="absolute inset-0 rounded-2xl ring-[3px] ring-white ring-offset-1 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* เลือก icon */}
              <div>
                <FieldLabel>เลือก Icon</FieldLabel>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_OPTIONS.map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, icon: key })}
                      title={label}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border-2 transition-all active:scale-90 ${
                        form.icon === key
                          ? "border-transparent text-white shadow-md"
                          : "border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100"
                      }`}
                      style={form.icon === key ? { background: `linear-gradient(135deg, ${selectedColor.from}, ${selectedColor.to})` } : {}}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[9px] leading-none truncate w-full text-center">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-2 text-sm">{error}</div>}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 flex gap-2.5 border-t border-gray-100 shrink-0"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}>
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-semibold hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-2 px-8 py-3 rounded-2xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${selectedColor.from}, ${selectedColor.to})` }}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
