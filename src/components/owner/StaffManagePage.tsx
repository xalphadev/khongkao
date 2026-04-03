"use client";

import { useState, useEffect } from "react";
import { Crown, User, Phone, Plus, X, Users } from "lucide-react";

interface User {
  id: string; name: string; username: string; role: string;
  phone: string | null; isActive: boolean; createdAt: string;
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{children}</label>
);

export default function StaffManagePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "staff", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<User | null>(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setUsers(await fetch("/api/users").then((r) => r.json()));
    setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ name: "", username: "", password: "", role: "staff", phone: "" }); setError(""); setShowModal(true); };
  const openEdit = (u: User) => { setEditing(u); setForm({ name: u.name, username: u.username, password: "", role: u.role, phone: u.phone ?? "" }); setError(""); setShowModal(true); };

  const handleSave = async () => {
    setError("");
    if (!form.name || !form.username) { setError("กรุณากรอกข้อมูลให้ครบ"); return; }
    if (!editing && !form.password) { setError("กรุณาตั้งรหัสผ่าน"); return; }
    setSaving(true);
    const body: Partial<typeof form> = { name: form.name, role: form.role, phone: form.phone };
    if (!editing) body.username = form.username;
    if (form.password) body.password = form.password;
    const res = editing
      ? await fetch(`/api/users/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form }) });
    if (res.ok) { setShowModal(false); loadUsers(); }
    else { const d = await res.json(); setError(d.error ?? "เกิดข้อผิดพลาด"); }
    setSaving(false);
  };

  const handleToggle = async (u: User) => {
    await fetch(`/api/users/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !u.isActive }) });
    setConfirm(null);
    loadUsers();
  };

  const owners = users.filter((u) => u.role === "owner");
  const staff = users.filter((u) => u.role === "staff");

  const UserCard = ({ u }: { u: User }) => (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all ${!u.isActive ? "opacity-50" : "hover:shadow-md"}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${u.role === "owner" ? "bg-purple-100" : "bg-blue-100"}`}>
          {u.role === "owner"
            ? <Crown className="w-5 h-5 text-purple-500" />
            : <User className="w-5 h-5 text-blue-500" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 text-sm">{u.name}</p>
          <p className="text-gray-400 text-xs">@{u.username}</p>
        </div>
        <div className="ml-auto">
          <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "owner" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
            {u.role === "owner" ? "เจ้าของ" : "พนักงาน"}
          </span>
        </div>
      </div>
      {u.phone && (
        <p className="text-gray-400 text-xs mb-2 flex items-center gap-1"><Phone className="w-3 h-3" /> {u.phone}</p>
      )}
      <div className="flex gap-2 pt-3 border-t border-gray-50">
        <button onClick={() => openEdit(u)}
          className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          แก้ไข
        </button>
        <button onClick={() => setConfirm(u)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${u.isActive ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
          {u.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── Page banner ── */}
      <div className="relative rounded-3xl overflow-hidden px-5 py-5 flex items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)" }}>
        <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full bg-white/[0.08]" />
        <div className="absolute bottom-0 left-12 w-20 h-20 rounded-full bg-black/[0.07]" />
        <div className="flex items-center gap-4 relative">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">จัดการพนักงาน</p>
            <p className="text-cyan-100 text-sm">เพิ่ม/แก้ไขบัญชีผู้ใช้งาน</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="relative flex items-center gap-2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all shrink-0 shadow-sm">
          <Plus className="w-4 h-4" /> เพิ่มพนักงาน
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {owners.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">เจ้าของร้าน</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {owners.map((u) => <UserCard key={u.id} u={u} />)}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">พนักงาน</p>
            {staff.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
                <User className="w-10 h-10 text-gray-200 mb-2 mx-auto" />
                <p className="text-sm">ยังไม่มีพนักงาน</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {staff.map((u) => <UserCard key={u.id} u={u} />)}
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">{editing ? "แก้ไขพนักงาน" : "เพิ่มพนักงานใหม่"}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <FieldLabel>ชื่อ-นามสกุล</FieldLabel>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none" placeholder="เช่น ป้าแดง" />
              </div>
              <div>
                <FieldLabel>ชื่อผู้ใช้ (Username)</FieldLabel>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!!editing}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none disabled:opacity-50" placeholder="pa_daeng" />
              </div>
              <div>
                <FieldLabel>รหัสผ่าน {editing && <span className="text-gray-400 normal-case">(เว้นว่างถ้าไม่เปลี่ยน)</span>}</FieldLabel>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none" placeholder="รหัสผ่าน" />
              </div>
              <div>
                <FieldLabel>บทบาท</FieldLabel>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none">
                  <option value="staff">พนักงาน (Staff)</option>
                  <option value="owner">เจ้าของร้าน (Owner)</option>
                </select>
              </div>
              <div>
                <FieldLabel>เบอร์โทรศัพท์</FieldLabel>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:outline-none" placeholder="0xx-xxx-xxxx" />
              </div>
              {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-2 text-sm">{error}</div>}
            </div>
            <div className="px-6 pb-5 flex gap-2.5">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-xl text-sm font-medium">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm toggle */}
      {confirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 ${confirm.isActive ? "bg-red-100" : "bg-green-100"}`}>
              {confirm.isActive ? "🔒" : "🔓"}
            </div>
            <h3 className="text-base font-medium text-gray-900 text-center mb-2">
              {confirm.isActive ? "ปิดใช้งานบัญชี?" : "เปิดใช้งานบัญชี?"}
            </h3>
            <p className="text-gray-500 text-sm text-center mb-5">
              {confirm.isActive
                ? `"${confirm.name}" จะไม่สามารถเข้าสู่ระบบได้`
                : `เปิดให้ "${confirm.name}" เข้าสู่ระบบได้อีกครั้ง`}
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setConfirm(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">ยกเลิก</button>
              <button onClick={() => handleToggle(confirm)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white ${confirm.isActive ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"}`}>
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
