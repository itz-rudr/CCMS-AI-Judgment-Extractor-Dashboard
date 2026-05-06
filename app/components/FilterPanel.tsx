"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

export type FilterState = {
  departments: string[];
  risks: string[];
  statuses: string[];
  dateRange: string | null;
};

type FilterPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  availableDepartments: string[];
};

export default function FilterPanel({ isOpen, onClose, filters, setFilters, availableDepartments }: FilterPanelProps) {
  const { t } = useTranslation();

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) return array.filter(i => i !== item);
    return [...array, item];
  };

  const handleClearAll = () => {
    setFilters({
      departments: [],
      risks: [],
      statuses: [],
      dateRange: null
    });
  };

  const activeCount = filters.departments.length + filters.risks.length + filters.statuses.length + (filters.dateRange ? 1 : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{t("filters.filters" as any) || "More Filters"}</h2>
              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Risk Level */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t("filters.risk_level" as any)}</h3>
                <div className="space-y-2">
                  {["Critical", "High", "Medium"].map(risk => (
                    <label key={risk} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.risks.includes(risk) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                        {filters.risks.includes(risk) && <Check size={14} strokeWidth={3} />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={filters.risks.includes(risk)}
                        onChange={() => setFilters({ ...filters, risks: toggleArrayItem(filters.risks, risk) })}
                      />
                      <span className="text-sm font-medium text-slate-700 select-none">{risk}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t("filters.status" as any)}</h3>
                <div className="space-y-2">
                  {["Verified", "Pending", "Overdue"].map(status => (
                    <label key={status} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.statuses.includes(status) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                        {filters.statuses.includes(status) && <Check size={14} strokeWidth={3} />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={filters.statuses.includes(status)}
                        onChange={() => setFilters({ ...filters, statuses: toggleArrayItem(filters.statuses, status) })}
                      />
                      <span className="text-sm font-medium text-slate-700 select-none">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Department */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t("filters.departments" as any)}</h3>
                <div className="space-y-2">
                  {availableDepartments.map(dept => {
                    const deptKey = "departments." + dept.toLowerCase().replace(/ /g, "_");
                    return (
                    <label key={dept} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.departments.includes(dept) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                        {filters.departments.includes(dept) && <Check size={14} strokeWidth={3} />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={filters.departments.includes(dept)}
                        onChange={() => setFilters({ ...filters, departments: toggleArrayItem(filters.departments, dept) })}
                      />
                      <span className="text-sm font-medium text-slate-700 select-none leading-tight">{t(deptKey as any) || dept}</span>
                    </label>
                  )})}
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t("filters.date_range" as any)}</h3>
                <div className="space-y-2">
                  {["Today", "Next 2 Days", "This Week"].map(dateOption => {
                    const dateKey = dateOption.toLowerCase().replace(/ /g, "_");
                    return (
                    <label key={dateOption} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${filters.dateRange === dateOption ? 'border-blue-600 bg-white' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                        {filters.dateRange === dateOption && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                      </div>
                      <input 
                        type="radio" 
                        name="dateRange"
                        className="hidden" 
                        checked={filters.dateRange === dateOption}
                        onChange={() => setFilters({ ...filters, dateRange: filters.dateRange === dateOption ? null : dateOption })}
                      />
                      <span className="text-sm font-medium text-slate-700 select-none">{t("settings." + dateKey as any) || dateOption}</span>
                    </label>
                  )})}
                  {/* Clear Date */}
                  {filters.dateRange && (
                    <button onClick={() => setFilters({ ...filters, dateRange: null })} className="text-xs text-slate-500 hover:text-slate-700 font-semibold pt-1">
                      {t("settings.clear_selection" as any)}
                    </button>
                  )}
                </div>
              </div>
              
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
              <button 
                onClick={handleClearAll}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition flex-1"
              >
                {t("filters.clear_all" as any)}
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition flex-1 flex items-center justify-center gap-2"
              >
                Apply Filters {activeCount > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{activeCount}</span>}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
