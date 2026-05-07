import React from "react";
import { JudgmentCase } from "../lib/ccms-data";
import { ArrowRight, UserPlus, AlertOctagon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "../hooks/useTranslation";

interface PriorityCaseCardProps {
  caseRecord: JudgmentCase;
  variants?: any;
}

export default function PriorityCaseCard({ caseRecord, variants }: PriorityCaseCardProps) {
  const { t } = useTranslation();
  const isCritical = caseRecord.risk === "Critical";
  const badgeColor = isCritical 
    ? "bg-rose-100 text-rose-700 border-rose-200" 
    : "bg-amber-100 text-amber-700 border-amber-200";
  const indicatorColor = isCritical ? "bg-rose-500" : "bg-amber-500";
  
  // Use translation key dynamically based on risk level
  const riskKey = caseRecord.risk.toLowerCase() + "_risk";

  return (
    <motion.div 
      variants={variants}
      className="panel relative rounded-xl p-5 pl-6 bg-white overflow-hidden flex flex-col md:flex-row gap-6 justify-between items-start group hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
    >
      {/* Left Color Indicator Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${indicatorColor}`} />

      {/* Main Content (Left Side) */}
      <div className="flex-1 space-y-3 w-full">
        {/* Header Section */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}>
            {t("dashboard." + riskKey as any)}
          </span>
          <span className="text-sm font-semibold text-slate-500">
            {caseRecord.id}
          </span>
        </div>

        {/* Title and Description */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-snug">
            {caseRecord.title}
          </h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
            {caseRecord.actionSummary}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <Link 
            href={`/review?id=${caseRecord.id}`}
            className="focus-ring flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 shadow-sm"
          >
            {t("dashboard.view_case" as any)}
            <ArrowRight size={14} />
          </Link>
          <button className="focus-ring flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
            <UserPlus size={14} />
            {t("dashboard.assign_officer" as any)}
          </button>
          <button className="focus-ring flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 hover:border-rose-300">
            <AlertOctagon size={14} />
            {t("dashboard.escalate" as any)}
          </button>
        </div>
      </div>

      {/* Right Side: Limitation Date */}
      <div className="w-full md:w-auto shrink-0 md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {t("dashboard.limitation_date" as any)}
        </span>
        <span className={`text-sm font-bold px-2.5 py-1 rounded-md border ${isCritical ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
          {caseRecord.limitationDate}
        </span>
      </div>
    </motion.div>
  );
}
