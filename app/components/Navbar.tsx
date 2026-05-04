"use client";

import {
  Bell,
  Search,
  UserCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mobileMenu = [
  { name: "Home", path: "/" },
  { name: "Cases", path: "/cases" },
  { name: "Review", path: "/review" },
  { name: "Analytics", path: "/analytics" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          
          <div className="lg:hidden flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              CCMS Desk
            </h2>
          </div>

          {/* Central Search Bar */}
          <div className="flex-1 max-w-2xl mx-auto w-full">
            <label className="flex min-w-0 items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 shadow-inner transition focus-within:bg-white focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
                placeholder="Search cases, departments, officers..."
              />
            </label>
          </div>

          {/* Right Icons */}
          <div className="flex flex-row items-center justify-end gap-3 hidden sm:flex">
            <button
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Export
            </button>

            <button
              aria-label="Notifications"
              className="relative focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 border-2 border-white"></span>
            </button>
            
            <button
              aria-label="Profile"
              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
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
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
