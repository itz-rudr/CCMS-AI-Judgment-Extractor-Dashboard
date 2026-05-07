"use client";

import { departmentSummary, pipelineSteps, reviewerQueue } from "../lib/ccms-data";
import MainLayout from "../layouts/MainLayout";
import { motion, Variants } from "framer-motion";
import { Activity, LayoutGrid, Users } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

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

export default function AnalyticsPage() {
  const { t } = useTranslation();
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t("analytics.title" as any)}
          </h1>
          <p className="text-sm text-slate-600">
            {t("analytics.subtitle" as any)}
          </p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Pipeline Overview */}
          <motion.div variants={item} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Activity size={18} className="text-blue-500" />
              {t("analytics.pipeline" as any)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pipelineSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="panel rounded-xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-blue-500 text-white">
                        <Icon size={20} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">{step.count}</h3>
                    </div>
                    <p className="mt-3 text-sm font-bold text-slate-800">{step.title}</p>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{step.detail}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Reviewer Queue */}
          <motion.div variants={item} className="space-y-4 flex flex-col h-full">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 shrink-0">
              <Users size={18} className="text-amber-400" />
              {t("analytics.workload" as any)}
            </div>
            <div className="panel rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm flex-1 flex flex-col">
              <div className="divide-y divide-slate-100 flex-1 flex flex-col">
                {reviewerQueue.map((queueItem, idx) => {
                  const Icon = queueItem.icon;
                  return (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition flex-1">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-slate-100 text-slate-600">
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{queueItem.label}</p>
                          <p className="text-xs text-slate-500">{queueItem.detail}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
                        {queueItem.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Departmental Compliance */}
          <motion.div variants={item} className="lg:col-span-2 space-y-4 mt-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <LayoutGrid size={18} className="text-blue-400" />
              {t("analytics.dept_compliance" as any)}
            </div>
            <div className="panel rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Approved Action Plans</th>
                      <th className="px-6 py-4">Pending Review</th>
                      <th className="px-6 py-4">Overdue Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departmentSummary.map((dept, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{dept.name}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {dept.approved} cases
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-amber-600">{dept.review} items</td>
                        <td className="px-6 py-4">
                          {dept.overdue > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                              {dept.overdue} overdue
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
