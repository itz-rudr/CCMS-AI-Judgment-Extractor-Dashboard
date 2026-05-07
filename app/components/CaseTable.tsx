"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowRight, Filter, Search, FileQuestion, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslation } from "../hooks/useTranslation";

type ReviewStatus = "Needs Review" | "Edited" | "Approved" | "Rejected" | "Pending";
type CaseRisk = "Critical" | "High" | "Medium";

const statusTabs: Array<"All" | ReviewStatus> = [
  "All",
  "Pending",
  "Needs Review",
  "Edited",
  "Approved",
  "Rejected",
];

const riskClass: Record<string, string> = {
  Critical: "bg-rose-50 text-rose-700 border-rose-200",
  High: "bg-amber-50 text-amber-700 border-amber-200",
  Medium: "bg-blue-50 text-blue-700 border-blue-200",
};

const statusClass: Record<string, string> = {
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Needs Review": "bg-amber-50 text-amber-700 border-amber-200",
  Edited: "bg-teal-50 text-teal-700 border-teal-200",
  Rejected: "bg-slate-100 text-slate-600 border-slate-200",
  Pending: "bg-yellow-100 text-yellow-900 border-yellow-200",
};

export default function CaseTable() {
  const router = useRouter();
  const [activeStatus, setActiveStatus] = useState<(typeof statusTabs)[number]>("All");
  const [query, setQuery] = useState("");
  const { t } = useTranslation();

  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCases() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${apiUrl}/api/cases`);
        const data = await res.json();
        
        // Map backend response to UI Case type
        const mapped = data.map((c: any) => ({
          id: c.case_number || c.id,
          cisId: c.case_number || "CIS-12345",
          department: "Legal Dept", // fallback
          petitioner: "John Doe",
          respondent: "State",
          actionSummary: "Pending Action",
          deadline: c.order_date || c.next_hearing_date || "TBD",
          reviewStatus: "Pending", // fallback
          confidence: 85,
          risk: "High",
        }));
        setCases(mapped);
      } catch (err) {
        console.error("Failed to fetch cases:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const matchesStatus =
        activeStatus === "All" || item.reviewStatus === activeStatus;
      const text = [
        item.id,
        item.cisId,
        item.department,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());

      return matchesStatus && matchesQuery;
    });
  }, [cases, activeStatus, query]);

  return (
    <section className="panel overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm">
      <div className="border-b border-slate-100 p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900">
              {t("case_table.title" as any) || "Case Table"}
            </h2>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
              <Filter size={14} />
              {filteredCases.length} {t("case_table.items" as any) || "items"}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-teal-100 focus-within:border-teal-400 transition">
              <Search size={16} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-64"
                placeholder={t("case_table.search" as any) || "Search..."}
              />
              {query && (
                <button 
                  onClick={() => setQuery("")}
                  className="text-slate-400 hover:text-slate-600 transition"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {statusTabs.map((tab) => {
            const active = activeStatus === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveStatus(tab)}
                className={`focus-ring rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
            <tr>
              <th className="px-6 py-4">{t("case_table.headers.case" as any) || "Case"}</th>
              <th className="px-6 py-4">{t("case_table.headers.dept_parties" as any) || "Dept / Parties"}</th>
              <th className="px-6 py-4">{t("case_table.headers.action_summary" as any) || "Action Summary"}</th>
              <th className="px-6 py-4">{t("case_table.headers.status" as any) || "Status"}</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-slate-500">Loading cases...</td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <div className="bg-slate-100 p-3 rounded-full mb-3 text-slate-400">
                      <FileQuestion size={24} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">{t("case_table.no_matches" as any) || "No matches"}</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {t("case_table.no_matches_desc" as any) || "We couldn't find any cases matching"} "{query}". {t("case_table.try_adjusting" as any) || "Try adjusting your filters."}
                    </p>
                    {query && (
                      <button 
                        onClick={() => setQuery("")}
                        className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                      >
                        {t("case_table.clear_search" as any) || "Clear Search"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : filteredCases.map((item, i) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={item.id} 
                className="transition hover:bg-slate-50 group"
              >
                <td className="px-6 py-4 align-top">
                  <p className="font-bold text-slate-900">{item.id}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.cisId}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${riskClass[item.risk] || riskClass.High}`}>
                      {item.risk}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <p className="font-bold text-slate-800">
                    {item.department}
                  </p>
                  <p className="mt-1 max-w-[240px] text-xs leading-5 text-slate-500">
                    {item.petitioner} vs {item.respondent}
                  </p>
                </td>
                <td className="px-6 py-4 align-top">
                  <p className="max-w-[300px] text-sm leading-relaxed text-slate-600 line-clamp-2">
                    {item.actionSummary}
                  </p>
                </td>
                <td className="px-6 py-4 align-top">
                  <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${statusClass[item.reviewStatus] || statusClass.Pending}`}>
                    {item.reviewStatus}
                  </span>
                  <p className="mt-2 text-xs font-semibold text-slate-400">
                    {item.confidence}% {t("case_table.confidence" as any) || "Confidence"}
                  </p>
                </td>
                <td className="px-6 py-4 align-top text-right">
                  <button
                    onClick={() => router.push(`/review?id=${item.id}`)}
                    className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition group-hover:bg-teal-50 group-hover:text-teal-700"
                  >
                    {t("case_table.verify" as any) || "Verify"}
                    <ArrowRight size={14} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
