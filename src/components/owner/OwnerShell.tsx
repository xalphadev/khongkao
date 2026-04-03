"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Recycle, LayoutDashboard, BarChart2, Tag, FolderOpen,
  Users, Settings, LogOut, X, Menu,
} from "lucide-react";

const navItems = [
  { href: "/owner",              label: "หน้าหลัก",  icon: LayoutDashboard, exact: true },
  { href: "/owner/reports",      label: "รายงาน",   icon: BarChart2,        exact: false },
  { href: "/owner/products",     label: "สินค้า",   icon: Tag,              exact: false },
  { href: "/owner/categories",   label: "หมวดหมู่", icon: FolderOpen,       exact: false },
  { href: "/owner/staff",        label: "พนักงาน",  icon: Users,            exact: false },
  { href: "/owner/settings",     label: "ตั้งค่า",  icon: Settings,         exact: false },
];

export default function OwnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (item: { href: string; exact: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const SidebarNav = ({ onNav }: { onNav?: () => void }) => (
    <nav className="flex-1 px-3 py-2 space-y-0.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNav}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
              active
                ? "bg-green-600 text-white shadow-md shadow-green-600/30"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className={active ? "font-medium" : ""}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex overflow-x-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 fixed h-full z-20">
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center shadow-md shadow-green-600/30">
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">มือสองของเก่า</p>
            <p className="text-gray-400 text-xs">ระบบจัดการร้าน</p>
          </div>
        </div>
        <div className="mx-4 h-px bg-gray-100" />
        <SidebarNav />
        <div className="mx-4 h-px bg-gray-100" />
        <div className="px-3 py-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-red-50 hover:text-red-500 w-full transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile: Drawer overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden backdrop-blur-[2px]"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile: Slide-in drawer (เมนูเพิ่มเติม + ออกจากระบบ) ── */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white z-40 flex flex-col shadow-2xl transform transition-transform duration-200 ease-out lg:hidden ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">มือสองของเก่า</p>
              <p className="text-gray-400 text-xs">เจ้าของร้าน</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <SidebarNav onNav={() => setDrawerOpen(false)} />
        <div className="px-3 pb-6 border-t border-gray-100 pt-2">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 w-full transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen overflow-x-hidden w-full">

        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700 active:bg-gray-200 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
              <Recycle className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-gray-800 text-sm">
              {navItems.find((n) => isActive(n))?.label ?? "มือสองของเก่า"}
            </span>
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile for tab bar */}
        <main className="flex-1 p-4 lg:p-6 max-w-6xl w-full mx-auto pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100"
        style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.06)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors active:bg-gray-50 min-w-0"
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${active ? "bg-green-50" : ""}`}>
                  <Icon className={`w-[18px] h-[18px] transition-colors ${active ? "text-green-600 stroke-[2.2]" : "text-gray-400"}`} />
                </div>
                <span
                  className="text-[9px] leading-none font-medium truncate w-full text-center px-0.5"
                  style={{ color: active ? "#16a34a" : "#9ca3af" }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
