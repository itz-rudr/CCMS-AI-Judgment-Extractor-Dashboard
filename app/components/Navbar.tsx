"use client";

import {
  Search,
  UserCircle,
  Download
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";
import { useTranslation } from "../hooks/useTranslation";

const mobileMenu = [
  { id: "nav.home", path: "/" },
  { id: "nav.cases", path: "/cases" },
  { id: "nav.review", path: "/review" },
  { id: "nav.analytics", path: "/analytics" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          
          <div className="lg:hidden flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">
              CCMS Desk
            </h2>
          </div>

          {/* Central Search Bar */}
          <div className="flex-1 max-w-2xl mx-auto w-full group">
            <label className="flex min-w-0 items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 shadow-inner transition-all duration-300 focus-within:bg-slate-900 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-900/50 group-hover:border-slate-600">
              <Search size={18} className="shrink-0 text-slate-400 transition-colors duration-300 group-focus-within:text-blue-400" />
              <input
                className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500 font-medium transition-all"
                placeholder={t("nav.search_placeholder" as any)}
              />
            </label>
          </div>

          {/* Right Icons */}
          <div className="flex flex-row items-center justify-end gap-3 hidden sm:flex">
            <button
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-100 hover:shadow"
            >
              <Download size={16} />
              {t("nav.export" as any)}
            </button>

            <NotificationBell />
            
            <button
              aria-label="Profile"
              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <UserCircle size={22} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 lg:hidden overflow-x-auto pb-1">
          {mobileMenu.map((item) => {
            const active = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`whitespace-nowrap focus-ring flex items-center justify-center rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-blue-400/30 bg-blue-500/10 text-blue-400"
                    : "border-slate-800 bg-slate-900 text-slate-400"
                }`}
              >
                {t(item.id as any)}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
