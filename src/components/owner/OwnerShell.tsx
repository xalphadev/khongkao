"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Recycle, LayoutDashboard, BarChart2, Tag, FolderOpen,
  Users, Settings, LogOut, X, Menu, ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/owner",            label: "หน้าหลัก",  icon: LayoutDashboard, exact: true,  color: "#16a34a" },
  { href: "/owner/reports",    label: "รายงาน",   icon: BarChart2,        exact: false, color: "#2563eb" },
  { href: "/owner/products",   label: "สินค้า",   icon: Tag,              exact: false, color: "#d97706" },
  { href: "/owner/categories", label: "หมวดหมู่", icon: FolderOpen,       exact: false, color: "#7c3aed" },
  { href: "/owner/staff",      label: "พนักงาน",  icon: Users,            exact: false, color: "#0891b2" },
  { href: "/owner/settings",   label: "ตั้งค่า",  icon: Settings,         exact: false, color: "#6b7280" },
];

// Only 4 most-used items in the bottom tab bar; the rest go in the drawer
const tabBarItems = navItems.slice(0, 4);

export default function OwnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (item: { href: string; exact: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const currentPage = navItems.find((n) => isActive(n));

  const SidebarNav = ({ onNav }: { onNav?: () => void }) => (
    <nav className="flex-1 px-3 py-3 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNav}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm transition-all group ${
              active ? "shadow-sm" : "hover:bg-gray-50"
            }`}
            style={active ? { background: `${item.color}15`, color: item.color } : { color: "#6b7280" }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all"
              style={active ? { background: item.color } : { background: "#f3f4f6" }}
            >
              <Icon
                className="w-4 h-4 transition-colors"
                style={{ color: active ? "#fff" : "#9ca3af" }}
                strokeWidth={active ? 2.2 : 1.8}
              />
            </div>
            <span className={`flex-1 ${active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
            {active && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex overflow-x-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 fixed h-full z-20 bg-white shadow-sm border-r border-gray-100">
        {/* Logo header */}
        <div
          className="px-5 py-5 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #166534 0%, #16a34a 100%)" }}
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">มือสองของเก่า</p>
            <p className="text-green-200 text-xs mt-0.5">ระบบจัดการร้าน</p>
          </div>
        </div>

        <SidebarNav />

        <div className="mx-3 h-px bg-gray-100" />
        <div className="px-3 py-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm text-gray-400 hover:bg-red-50 hover:text-red-500 w-full transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile: Drawer overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-[2px]"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile: Slide-in drawer ── */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white z-40 flex flex-col shadow-2xl transform transition-transform duration-200 ease-out lg:hidden ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: "linear-gradient(135deg, #166534 0%, #16a34a 100%)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">มือสองของเก่า</p>
              <p className="text-green-200 text-xs">เจ้าของร้าน</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <SidebarNav onNav={() => setDrawerOpen(false)} />
        <div className="px-3 pb-6 border-t border-gray-100 pt-2">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm text-red-500 hover:bg-red-50 w-full transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen overflow-x-hidden w-full">

        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3"
          style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.06)" }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-2xl active:bg-gray-100 transition-colors"
            style={{ background: "#f3f4f6" }}
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2.5 flex-1">
            {currentPage && (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: currentPage.color }}
              >
                <currentPage.icon className="w-4 h-4 text-white" strokeWidth={2.2} />
              </div>
            )}
            <span className="font-semibold text-gray-800 text-base">
              {currentPage?.label ?? "มือสองของเก่า"}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-6xl w-full mx-auto pb-28 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar (4 items + More) ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white"
        style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch px-2 pt-1.5 pb-1.5 gap-1">
          {tabBarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center py-1 gap-1 min-w-0 active:scale-95 transition-all"
              >
                <div
                  className="w-12 h-8 rounded-2xl flex items-center justify-center transition-all"
                  style={active ? { background: `${item.color}18` } : {}}
                >
                  <Icon
                    className="w-5 h-5 transition-all"
                    style={{ color: active ? item.color : "#9ca3af" }}
                    strokeWidth={active ? 2.3 : 1.8}
                  />
                </div>
                <span
                  className="text-[10px] leading-none font-semibold"
                  style={{ color: active ? item.color : "#9ca3af" }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More button → opens drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-1 gap-1 min-w-0 active:scale-95 transition-all"
          >
            <div className="w-12 h-8 rounded-2xl flex items-center justify-center">
              <Menu className="w-5 h-5 text-gray-400" strokeWidth={1.8} />
            </div>
            <span className="text-[10px] leading-none font-semibold text-gray-400">เพิ่มเติม</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
