"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, KeyRound, Eye, EyeOff, AlertCircle, Recycle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace(session.user.role === "owner" ? "/owner" : "/staff");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a7a3f]">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (result?.error) setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    else router.replace("/");
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      {/* Top green section */}
      <div className="relative flex-shrink-0 pt-16 pb-20 px-6 overflow-hidden" style={{ background: "linear-gradient(140deg, #059669 0%, #10b981 50%, #0ea5e9 100%)" }}>
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/[0.06] rounded-full" />
        <div className="absolute top-10 -right-4 w-24 h-24 bg-white/[0.06] rounded-full" />
        <div className="absolute -bottom-4 -left-8 w-32 h-32 bg-white/[0.06] rounded-full" />

        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 rounded-3xl mb-4 shadow-lg">
            <Recycle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-medium text-white">มือสองของเก่า</h1>
          <p className="text-white/70 text-sm mt-1">ระบบรับซื้อของเก่า</p>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 390 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0 40 C97.5 0 292.5 0 390 40 L390 40 L0 40 Z" fill="#f4f6f9" />
          </svg>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 px-5 -mt-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-black/[0.08] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-base font-medium text-gray-700 text-center">เข้าสู่ระบบ</h2>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl pl-11 pr-4 py-3.5 text-base focus:border-emerald-400 focus:bg-white focus:outline-none transition-all"
                  placeholder="กรอกชื่อผู้ใช้"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl pl-11 pr-12 py-3.5 text-base focus:border-emerald-400 focus:bg-white focus:outline-none transition-all"
                  placeholder="กรอกรหัสผ่าน"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full active:scale-[0.98] disabled:opacity-60 text-white font-medium py-4 rounded-2xl text-base transition-all shadow-lg mt-2"
              style={{ background: "linear-gradient(135deg, #22c55e 0%, #10b981 50%, #0ea5e9 100%)", boxShadow: "0 8px 24px rgba(16,185,129,0.35)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6 pb-8">
          มือสองของเก่า © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
