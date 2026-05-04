type Props = {
  title: string;
  value: string;
};

export default function StatsCard({ title, value }: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="rounded-2xl bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
          Summary
        </div>
        <div className="rounded-2xl bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
          Live
        </div>
      </div>
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
        {title}
      </h2>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}