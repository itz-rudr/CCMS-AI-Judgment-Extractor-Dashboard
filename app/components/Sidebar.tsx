"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaFileAlt, FaBrain, FaChartBar } from "react-icons/fa";

export default function Sidebar() {
  const pathname = usePathname();

  const menu = [
    { name: "Dashboard", icon: <FaHome />, path: "/" },
    { name: "Cases", icon: <FaFileAlt />, path: "/cases" },
    { name: "Review", icon: <FaBrain />, path: "/review" },
    { name: "Analytics", icon: <FaChartBar />, path: "/analytics" },
  ];

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-full w-64 flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-8 text-white shadow-2xl">
      <div>
        <div className="mb-10">
          <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">
            CCMS
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">
            Control Center
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Manage cases, review intelligence, and stay on top of approvals.
          </p>
        </div>

        <ul className="space-y-2">
          {menu.map((item) => {
            const active = pathname === item.path;
            return (
              <li key={item.name}>
                <Link href={item.path} className="group block">
                  <div
                    className={`flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-white/15 text-white shadow-lg shadow-slate-900/20"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                        active ? "bg-slate-800 text-sky-400" : "bg-slate-800/80 text-slate-300"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.name}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <p className="font-semibold text-white">Need help?</p>
        <p className="mt-2 leading-6">
          Reach out to support or check the docs for case review best practices.
        </p>
      </div>
    </aside>
  );
}