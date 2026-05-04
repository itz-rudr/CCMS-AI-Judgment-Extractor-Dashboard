"use client";

import {
  BarChart3,
  ClipboardCheck,
  FileStack,
  LayoutDashboard,
  Scale,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Extraction", icon: FileStack, path: "/cases" },
  { name: "Verification", icon: ClipboardCheck, path: "/review" },
  { name: "Analytics", icon: BarChart3, path: "/analytics" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white text-slate-800 lg:flex lg:flex-col">
      <div className="border-b border-slate-100 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
            <Scale size={23} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">
              CCMS AI
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-slate-950">
              Judgment Desk
            </h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Workspace
        </p>
        <div className="mt-3 space-y-1">
          {menu.map((item) => {
            const active = pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.path}
                className={`focus-ring flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-slate-50 text-teal-700 border border-slate-200 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                }`}
              >
                <Icon
                  size={18}
                  className={active ? "text-teal-700" : "text-slate-400"}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
            <ShieldCheck size={17} />
            Verified Only
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Dashboard records appear only after reviewer approval with source
            evidence attached.
          </p>
        </div>
      </div>
    </aside>
  );
}
