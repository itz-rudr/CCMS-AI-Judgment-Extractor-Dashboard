"use client";

import {
  judgmentCases,
  type CaseRisk,
  type ReviewStatus,
} from "@/app/lib/ccms-data";
import { ArrowRight, Filter, Search, FileQuestion, X, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslation } from "../hooks/useTranslation";
import { listExtractions, type ApiCase } from "../services/api";

const statusTabs: Array<"All" | ReviewStatus> = [
  "All",
  "Needs Review",
  "Edited",
  "Approved",
  "Rejected",
];

const riskClass: Record<CaseRisk, string> = {
  Critical: "bg-rose-50 text-rose-700 border-rose-200",
  High: "bg-amber-50 text-amber-700 border-amber-200",
  Medium: "bg-blue-50 text-blue-700 border-blue-200",
};

const statusClass: Record<ReviewStatus, string> = {
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Needs Review": "bg-amber-50 text-amber-700 border-amber-200",
  Edited: "bg-teal-50 text-teal-700 border-teal-200",
  Rejected: "bg-slate-100 text-slate-600 border-slate-200",
};

// Convert static mock case to ApiCase shape so we can use a unified type
function staticToApi(c: (typeof judgmentCases)[number]): ApiCase {
  return c as unknown as ApiCase;
}

export default function CaseTable() {
  const router = useRouter();
  const [activeStatus, setActiveStatus] =
    useState<(typeof statusTabs)[number]>("All");
  const [query, setQuery] = useState("");
  const { t } = useTranslation();

  const [cases, setCases] = useState<ApiCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listExtractions();
      setCases(data);
      setIsLive(true);
    } catch (err) {
      console.warn("Backend unavailable, using mock data:", err);
      setCases(judgmentCases.map(staticToApi));
      setIsLive(false);
      setError("Backend offline – showing demo data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
    
    // Listen for custom event from the upload section to refresh automatically
    const handleRefresh = () => fetchCases();
    window.addEventListener("case-extracted", handleRefresh);
    return () => window.removeEventListener("case-extracted", handleRefresh);
  }, [fetchCases]);

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const matchesStatus =
        activeStatus === "All" || item.reviewStatus === activeStatus;
      const text = [
        item.id,
        item.cisId,
        item.title,
        item.department,
        item.bench,
        item.nodalOfficer,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [activeStatus, query, cases]);

  return (
    <section className="panel overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm">
      <div className="border-b border-slate-100 p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900">
              {t("case_table.title" as any)}
            </h2>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
              <Filter size={14} />
              {filteredCases.length} {t("case_table.items" as any)}
            </div>
            {/* Live/Offline badge */}
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                isLive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isLive ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isLive ? "Live" : "Demo"}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={fetchCases}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              title="Refresh from backend"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-teal-100 focus-within:border-teal-400 transition">
              <Search size={16} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-64"
                placeholder={t("case_table.search" as any)}
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

        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <WifiOff size={12} />
            {error}
          </div>
        )}

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
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw size={20} className="animate-spin mr-2" />
            <span className="text-sm font-medium">Loading cases...</span>
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">{t("case_table.headers.case" as any)}</th>
                <th className="px-6 py-4">{t("case_table.headers.dept_parties" as any)}</th>
                <th className="px-6 py-4">{t("case_table.headers.action_summary" as any)}</th>
                <th className="px-6 py-4">{t("case_table.headers.status" as any)}</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((item, i) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  key={item.id}
                  className="transition hover:bg-slate-50 group"
                >
                  <td className="px-6 py-4 align-top">
                    <div className="max-w-[180px]">
                      <p className="font-bold text-slate-900 truncate" title={item.id}>{item.id}</p>
                      <p className="mt-1 text-[10px] text-slate-400 font-mono truncate">{item.cisId}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            riskClass[item.risk as CaseRisk] ?? "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {item.risk}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="max-w-[220px]">
                      <p className="font-bold text-slate-800 truncate" title={item.department}>{item.department}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 line-clamp-2 italic">
                        {item.petitioner} <span className="text-[10px] text-slate-400 not-italic">vs</span> {item.respondent}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="max-w-[340px]">
                      <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">
                        {item.actionSummary}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      <span
                        className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-[11px] font-bold ${
                          statusClass[item.reviewStatus as ReviewStatus] ?? "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {item.reviewStatus}
                      </span>
                      <p className="text-center text-[10px] font-bold text-slate-400">
                        {item.confidence}% MATCH
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-right">
                    <button
                      onClick={() => router.push(`/review?id=${item.id}`)}
                      className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition group-hover:bg-teal-50 group-hover:text-teal-700"
                    >
                      {t("case_table.verify" as any)}
                      <ArrowRight size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filteredCases.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="bg-slate-100 p-3 rounded-full mb-3 text-slate-400">
                        <FileQuestion size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">
                        {t("case_table.no_matches" as any)}
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {t("case_table.no_matches_desc" as any)} &quot;{query}&quot;.{" "}
                        {t("case_table.try_adjusting" as any)}
                      </p>
                      {query && (
                        <button
                          onClick={() => setQuery("")}
                          className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                        >
                          {t("case_table.clear_search" as any)}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
