"use client";

export default function Navbar() {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex flex-col">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Overview
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Live Panels</h2>
        </div>

        <div className="flex flex-1 items-center gap-3">
          <input
            type="text"
            placeholder="Search cases..."
            className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
          <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
            Export
          </button>
        </div>

        <div className="flex items-center gap-4 text-slate-600">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-lg shadow-sm">
            🔔
          </span>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-lg shadow-sm">
            👤
          </span>
        </div>
      </div>
    </div>
  );
}