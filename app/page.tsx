import MainLayout from "../app/layouts/MainLayout";
import StatsCard from "../app/components/StatsCard";
import CaseTable from "../app/components/CaseTable";

export default function Home() {
  return (
    <MainLayout>
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm shadow-slate-200/40 backdrop-blur-md">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-sky-600">Welcome back</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            Case Management Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Monitor active cases, review insights, and track team performance in one place.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
              New Case
            </button>
            <button className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300">
              Add Note
            </button>
          </div>
          <div className="text-sm text-slate-500">
            Last updated: May 4, 2026
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <StatsCard title="Total Cases" value="120" />
        <StatsCard title="Pending" value="45" />
        <StatsCard title="Approved" value="60" />
        <StatsCard title="Rejected" value="15" />
      </div>

      <CaseTable />
    </MainLayout>
  );
}