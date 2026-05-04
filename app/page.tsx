"use client";

import { approvedActionPlans, dashboardStats } from "./lib/ccms-data";
import MainLayout from "./layouts/MainLayout";
import { ShieldCheck, CalendarClock, Gavel, CheckCircle2 } from "lucide-react";
import { motion, Variants } from "framer-motion";

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
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-teal-600">
            Welcome Back
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Case Management Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Monitor verified action plans, track upcoming deadlines, and oversee departmental compliance.
          </p>
        </div>

        {/* Stats Row */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {dashboardStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                variants={item}
                className="panel rounded-xl p-5 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {stat.label}
                    </p>
                    <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                  </div>
                  <div className={`p-2 rounded-lg bg-${stat.tone}-50 text-${stat.tone}-600`}>
                    <Icon size={20} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                  <span className={`px-2 py-0.5 rounded text-xs bg-${stat.tone}-100 text-${stat.tone}-700`}>
                    Live
                  </span>
                  <span className="text-slate-500">{stat.change}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Layout Split */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Column: Recent Approved Cases */}
          <motion.div variants={item} className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recent Approved Cases</h2>
              <button className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition">
                View all
              </button>
            </div>
            
            <div className="panel rounded-xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Case ID</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Deadline</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {approvedActionPlans.slice(0, 5).map((plan) => (
                      <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{plan.id}</td>
                        <td className="px-6 py-4 text-slate-600">{plan.department}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">{plan.dueDate}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 size={14} />
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                    {approvedActionPlans.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                          No recent cases available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Live Hearing Timeline / Deadlines */}
          <motion.div variants={item} className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Deadlines</h2>
            
            <div className="panel rounded-xl p-5 bg-white space-y-6">
              {approvedActionPlans.map((plan, index) => (
                <div key={index} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-px before:bg-slate-200 last:before:hidden">
                  <div className="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full bg-white border-4 border-amber-400 z-10 shadow-sm" />
                  <div className="mb-1 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <span>{plan.dueDate}</span>
                    <span className="text-amber-600">Pending</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{plan.department}</h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {plan.actionSummary}
                  </p>
                </div>
              ))}
              {approvedActionPlans.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-4">
                  No upcoming deadlines.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
