type Case = {
  id: string;
  department: string;
  deadline: string;
  status: string;
};

export default function CaseTable() {
  const cases: Case[] = [
    {
      id: "C001",
      department: "Legal",
      deadline: "2026-05-10",
      status: "Pending",
    },
    {
      id: "C002",
      department: "Police",
      deadline: "2026-05-12",
      status: "Approved",
    },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="px-6 py-6 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Recent Cases</h2>
          <p className="mt-2 text-sm text-slate-500">Latest activity and status overview.</p>
        </div>
        <button className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:mt-0">
          View all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Case ID</th>
              <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Department</th>
              <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Deadline</th>
              <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.map((c, index) => (
              <tr key={c.id} className={`transition ${index % 2 === 0 ? "bg-slate-50/40" : "bg-white"} hover:bg-slate-100`}>
                <td className="px-6 py-4 text-slate-700">{c.id}</td>
                <td className="px-6 py-4 text-slate-700">{c.department}</td>
                <td className="px-6 py-4 text-slate-700">{c.deadline}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      c.status === "Pending"
                        ? "bg-yellow-100 text-yellow-900"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}