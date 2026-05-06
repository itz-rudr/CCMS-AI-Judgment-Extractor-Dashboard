"use client";

import { approvedActionPlans, dashboardStats, judgmentCases, departmentSummary } from "./lib/ccms-data";
import MainLayout from "./layouts/MainLayout";
import { ShieldCheck, CalendarClock, Gavel, CheckCircle2, AlertTriangle, ArrowRight, Filter, ChevronDown, Calendar as CalendarIcon, Building2, X } from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import Link from "next/link";
import PriorityCaseCard from "./components/PriorityCaseCard";
import { useState, useRef, useMemo } from "react";
import FilterPanel, { FilterState } from "./components/FilterPanel";
import { useSettings } from "./contexts/SettingsContext";
import { useTranslation } from "./hooks/useTranslation";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function Dashboard() {
  const expandedRef = useRef<HTMLDivElement>(null);
  
  const { t } = useTranslation();

  // Filter States
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    departments: [],
    risks: [],
    statuses: [],
    dateRange: null
  });
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Derived Data
  const departments = useMemo(() => Array.from(new Set(judgmentCases.map(c => c.department))), []);

  const filteredCases = useMemo(() => {
    return judgmentCases.filter(c => {
      // Advanced Filters Logic
      if (advancedFilters.departments.length > 0 && !advancedFilters.departments.includes(c.department)) return false;
      if (advancedFilters.risks.length > 0 && !advancedFilters.risks.includes(c.risk)) return false;
      
      // Map ReviewStatus to the 3 standard statuses
      if (advancedFilters.statuses.length > 0) {
        let matchesStatus = false;
        if (advancedFilters.statuses.includes("Verified") && c.reviewStatus === "Approved") matchesStatus = true;
        if (advancedFilters.statuses.includes("Pending") && (c.reviewStatus === "Needs Review" || c.reviewStatus === "Edited")) matchesStatus = true;
        // Mock Overdue logic
        const today = "2026-05-06";
        const targetDate = c.limitationDate || c.dueDate;
        if (advancedFilters.statuses.includes("Overdue") && targetDate < today) matchesStatus = true;
        
        if (!matchesStatus) return false;
      }
      
      if (advancedFilters.dateRange) {
        const today = "2026-05-06";
        const next2Days = "2026-05-08";
        const thisWeek = "2026-05-13";
        const targetDate = c.limitationDate || c.dueDate;
        
        if (advancedFilters.dateRange === "Today" && targetDate !== today) return false;
        if (advancedFilters.dateRange === "Next 2 Days" && (targetDate > next2Days || targetDate < today)) return false;
        if (advancedFilters.dateRange === "This Week" && (targetDate > thisWeek || targetDate < today)) return false;
      }
      return true;
    });
  }, [advancedFilters]);

  // Priority Cases always filtered by risk Critical/High natively if no specific risk filters applied?
  // User says: "Apply filters to Key Actions Required".
  // If risks are specified, we show only those risks. If no risks specified, do we default to Critical/High?
  // The original component showed only Critical/High.
  const priorityCases = useMemo(() => {
    if (advancedFilters.risks.length > 0) {
      return filteredCases;
    }
    return filteredCases.filter(c => c.risk === "Critical" || c.risk === "High");
  }, [filteredCases, advancedFilters.risks]);
  const visibleCases = priorityCases.slice(0, 2);

  const filteredActionPlans = useMemo(() => {
    return approvedActionPlans.filter(plan => {
      if (advancedFilters.departments.length > 0 && !advancedFilters.departments.includes(plan.department)) return false;
      
      if (advancedFilters.dateRange) {
        const today = "2026-05-06";
        const next2Days = "2026-05-08";
        const thisWeek = "2026-05-13";
        const targetDate = plan.dueDate;
        
        if (advancedFilters.dateRange === "Today" && targetDate !== today) return false;
        if (advancedFilters.dateRange === "Next 2 Days" && (targetDate > next2Days || targetDate < today)) return false;
        if (advancedFilters.dateRange === "This Week" && (targetDate > thisWeek || targetDate < today)) return false;
      }
      return true;
    });
  }, [advancedFilters]);

  const activeFilterCount = advancedFilters.departments.length + advancedFilters.risks.length + advancedFilters.statuses.length + (advancedFilters.dateRange ? 1 : 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {t("dashboard.title" as any)}
            </h1>
            
            {/* Unified Filter Button */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsFilterPanelOpen(true)}
                className={`focus-ring flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 shadow-sm ${
                  activeFilterCount > 0
                    ? "border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <Filter size={16} className={activeFilterCount > 0 ? "text-blue-600" : "text-slate-500"} />
                <span>{t("filters.filters" as any)}{activeFilterCount > 0 && ` (${activeFilterCount})`}</span>
              </button>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button 
                  onClick={() => setAdvancedFilters({ departments: [], risks: [], statuses: [], dateRange: null })}
                  className="whitespace-nowrap text-xs font-bold text-slate-400 hover:text-slate-700 transition px-2"
                >
                  {t("filters.clear_all" as any)}
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-600">
            {t("dashboard.subtitle" as any)}
          </p>
        </div>

        {/* Filter Panel */}
        <FilterPanel 
          isOpen={isFilterPanelOpen}
          onClose={() => setIsFilterPanelOpen(false)}
          filters={advancedFilters}
          setFilters={setAdvancedFilters}
          availableDepartments={departments}
        />

        {/* Quick Insights Bar */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Emerald */}
          <motion.div variants={item} className="panel rounded-xl p-5 flex items-center justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t("dashboard.total_verified" as any)}</p>
              <h3 className="text-2xl font-bold text-slate-900">312</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </motion.div>
          {/* Blue */}
          <motion.div variants={item} className="panel rounded-xl p-5 flex items-center justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t("dashboard.due_today" as any)}</p>
              <h3 className="text-2xl font-bold text-slate-900">8</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <CalendarClock size={24} />
            </div>
          </motion.div>
          {/* Rose */}
          <motion.div variants={item} className="panel rounded-xl p-5 flex items-center justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t("dashboard.high_risk" as any)}</p>
              <h3 className="text-2xl font-bold text-slate-900">18</h3>
            </div>
            <div className="p-3 rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle size={24} />
            </div>
          </motion.div>
          {/* Amber */}
          <motion.div variants={item} className="panel rounded-xl p-5 flex items-center justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t("dashboard.overdue" as any)}</p>
              <h3 className="text-2xl font-bold text-slate-900">24</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
              <Gavel size={24} />
            </div>
          </motion.div>
        </motion.div>

        {/* Main Layout Split */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          <div className="xl:col-span-2 space-y-6">
            {/* Key Actions Required */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {t("dashboard.key_actions" as any)}
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{t("dashboard.high_priority" as any)}</span>
                </h2>
                <Link 
                  href="/cases?priority=high"
                  className="focus-ring text-sm font-semibold text-blue-600 hover:text-blue-700 transition flex items-center gap-1 group hover:underline decoration-blue-300 underline-offset-4"
                >
                  {t("dashboard.view_all" as any)}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <motion.div layout className="flex flex-col gap-4">
                <AnimatePresence initial={false}>
                  {visibleCases.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm"
                    >
                      No priority cases match the selected filters.
                    </motion.div>
                  ) : (
                    visibleCases.map((c) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <PriorityCaseCard caseRecord={c} variants={item} />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
                <div ref={expandedRef} className="h-1" />
              </motion.div>
            </motion.div>

            {/* Department Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{t("dashboard.dept_overview" as any)}</h2>
                <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition flex items-center gap-1 group">
                  {t("dashboard.full_report" as any)}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="panel rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      <tr>
                        <th className="px-6 py-4">{t("dashboard.department" as any)}</th>
                        <th className="px-6 py-4">{t("dashboard.compliance_score" as any)}</th>
                        <th className="px-6 py-4">{t("dashboard.approved" as any)}</th>
                        <th className="px-6 py-4">{t("dashboard.overdue" as any)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {departmentSummary.map((dept, idx) => {
                        const total = dept.approved + dept.review + dept.overdue;
                        const score = Math.round((dept.approved / total) * 100);
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{t(("departments." + dept.name.toLowerCase().replace(/ /g, "_")) as any) || dept.name}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-slate-700 w-8">{score}%</span>
                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${score > 80 ? 'bg-emerald-500' : score > 60 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${score}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-emerald-600 font-semibold">{dept.approved}</td>
                            <td className="px-6 py-4">
                              {dept.overdue > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                  {dept.overdue} {t("dashboard.overdue_lowercase" as any) || "overdue"}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Important Dates Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{t("dashboard.important_dates" as any)}</h2>
            </div>
            <div className="panel rounded-xl p-5 bg-white space-y-6">
              {filteredActionPlans.length === 0 ? (
                <div className="text-center text-slate-500 py-4">
                  No important dates match the selected filters.
                </div>
              ) : (
                filteredActionPlans.slice(0, 5).map((plan, index) => (
                  <div key={index} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-px before:bg-slate-200 last:before:hidden">
                  <div className="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full bg-white border-[4px] border-blue-500 z-10 shadow-sm" />
                  <div className="mb-1 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <span className="text-blue-600 font-bold">{plan.dueDate}</span>
                    <span className="text-slate-400">{t("dashboard.limitation" as any)}: {plan.limitationDate}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{plan.id}</h3>
                  <p className="text-xs font-medium text-slate-500 mb-1">{t(("departments." + plan.department.toLowerCase().replace(/ /g, "_")) as any) || plan.department}</p>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {plan.actionSummary}
                  </p>
                </div>
              )))}
            </div>
          </motion.div>

        </div>
      </div>
    </MainLayout>
  );
}
