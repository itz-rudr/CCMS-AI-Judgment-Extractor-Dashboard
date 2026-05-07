"use client";

import { Bell } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { judgmentCases } from "@/app/lib/ccms-data";
import { useTranslation } from "../hooks/useTranslation";

const formatRemainingTime = (hours: number) => {
  if (hours < 24) {
    const rounded = Math.ceil(hours);
    return `Due in ${rounded} hr${rounded !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    if (remainingHours > 0) {
      return `Due in ${days}d ${remainingHours}h`;
    }
    return `Due in ${days} day${days !== 1 ? 's' : ''}`;
  }
};

export default function NotificationBell() {
  const [now, setNow] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Set initial date on client to avoid hydration mismatch
    setNow(new Date());
    // Auto-refresh every minute to keep timers accurate
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const upcomingCases = useMemo(() => {
    if (!now) return [];
    
    return judgmentCases.filter((c) => {
      // Assuming dueDate is YYYY-MM-DD. We append T23:59:59 to treat it as local end-of-day.
      const dueDate = new Date(c.dueDate + "T23:59:59"); 
      const timeDiff = dueDate.getTime() - now.getTime();
      const hoursRemaining = timeDiff / (1000 * 60 * 60);
      
      // Include ONLY cases where deadline is within the next 48 hours
      // Excludes overdue (<= 0) and distant (> 48) cases
      return hoursRemaining > 0 && hoursRemaining <= 48;
    }).sort((a, b) => {
      const dateA = new Date(a.dueDate + "T23:59:59").getTime();
      const dateB = new Date(b.dueDate + "T23:59:59").getTime();
      return dateA - dateB;
    });
  }, [now]);

  // Loading state for SSR to prevent hydration mismatch
  if (!now) {
    return (
      <button
        aria-label="Notifications loading"
        className="relative focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition"
      >
        <Bell size={18} />
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        aria-label="Notifications"
        onClick={() => setIsOpen(!isOpen)}
        className="relative focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
      >
        <Bell size={18} />
        {upcomingCases.length > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 border-2 border-white text-[9px] font-bold text-white shadow-sm">
            {upcomingCases.length}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-lg border border-slate-200 overflow-hidden z-50">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">{t("notifications.urgent_deadlines" as any)}</h3>
            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {t("notifications.next_48h" as any)}
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {upcomingCases.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {upcomingCases.map(c => {
                  const dueDate = new Date(c.dueDate + "T23:59:59");
                  const hoursRemaining = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                  const isUrgent = hoursRemaining <= 24;
                  
                  return (
                    <li key={c.id} className="p-4 hover:bg-slate-50 transition flex flex-col gap-1 cursor-default">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-900 truncate" title={c.title}>{c.title}</p>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md ${isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {formatRemainingTime(hoursRemaining)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span className="font-medium text-slate-600">{c.id}</span>
                        <span>Due: {new Date(c.dueDate).toLocaleDateString()}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                  <Bell size={20} />
                </div>
                <p className="text-sm font-medium text-slate-600">{t("notifications.no_urgent" as any)}</p>
              </div>
            )}
            {upcomingCases.length > 0 && (
              <div className="border-t border-slate-100 p-2 bg-slate-50">
                <button className="w-full rounded-lg py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition">
                  {t("notifications.view_all" as any)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
