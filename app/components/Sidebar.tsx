"use client";

import {
  BarChart3,
  ClipboardCheck,
  FileStack,
  LayoutDashboard,
  Scale,
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../contexts/AuthContext";

const menu = [
  { id: "nav.dashboard", icon: LayoutDashboard, path: "/" },
  { id: "nav.extraction", icon: FileStack, path: "/cases" },
  { id: "nav.verification", icon: ClipboardCheck, path: "/review" },
  { id: "nav.analytics", icon: BarChart3, path: "/analytics" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-800 bg-slate-900 text-slate-300 lg:flex lg:flex-col">
      <div className="border-b border-slate-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Scale size={23} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
              CCMS AI
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Judgment Desk
            </h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5 overflow-y-auto">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {t("nav.workspace")}
        </p>
        <div className="mt-3 space-y-1">
          {menu.map((item) => {
            const active = pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.path}
                className={`relative focus-ring flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition overflow-hidden ${
                  active
                    ? "bg-slate-800/50 text-blue-400 border border-slate-800 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/30 hover:text-white border border-transparent"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 w-[3px] h-full bg-blue-400 rounded-r-md"
                  />
                )}
                <Icon
                  size={18}
                  className={active ? "text-blue-400 relative z-10" : "text-slate-400 relative z-10"}
                />
                <span className="relative z-10">{t(item.id)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-800 p-4 space-y-4">
        
        {/* Settings Link at Bottom */}
        <Link
          href="/settings"
          className={`relative focus-ring flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition overflow-hidden ${
            pathname === "/settings"
              ? "bg-slate-800/50 text-blue-400 border border-slate-800 shadow-sm"
              : "text-slate-400 hover:bg-slate-800/30 hover:text-white border border-transparent"
          }`}
        >
          {pathname === "/settings" && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute left-0 top-0 w-[3px] h-full bg-blue-400 rounded-r-md"
            />
          )}
          <Settings
            size={18}
            className={pathname === "/settings" ? "text-blue-400 relative z-10" : "text-slate-400 relative z-10"}
          />
          <span className="relative z-10">{t("nav.settings")}</span>
        </Link>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full relative focus-ring flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition overflow-hidden text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-transparent"
        >
          <LogOut size={18} className="relative z-10" />
          <span className="relative z-10">{t("nav.logout" as any) || "Logout"}</span>
        </button>

        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
            <ShieldCheck size={17} />
            {t("nav.verified_only")}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {t("nav.verified_desc")}
          </p>
        </div>
      </div>
    </aside>
  );
}
