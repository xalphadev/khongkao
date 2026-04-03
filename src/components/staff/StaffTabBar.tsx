"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList } from "lucide-react";

const tabs = [
  { href: "/staff", label: "หน้าหลัก", icon: Home },
  { href: "/staff/history", label: "ประวัติ", icon: ClipboardList },
];

export default function StaffTabBar() {
  const pathname = usePathname();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100"
      style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}
    >
      <div className="flex items-stretch" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-95"
            >
              <div
                className="w-11 h-7 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: active ? "#dcfce7" : "transparent",
                }}
              >
                <Icon
                  className="w-5 h-5 transition-colors"
                  style={{ color: active ? "#16a34a" : "#9ca3af" }}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span
                className="text-xs font-medium transition-colors"
                style={{ color: active ? "#16a34a" : "#9ca3af" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
