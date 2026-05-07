"use client";

import MainLayout from "../layouts/MainLayout";
import { useState, useEffect } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { Language } from "../lib/i18n";
import { useTranslation } from "../hooks/useTranslation";
import { User, Bell, Palette, Sliders, Save, RefreshCw, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSettings, resetToDefault } = useSettings();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Local state for draft settings before saving
  const [draft, setDraft] = useState(settings);

  // Sync draft when global settings change (e.g. initial load from localstorage)
  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      updateSettings(draft);
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 600);
  };

  const tabs = [
    { id: "profile", label: t("settings.tabs.profile" as any), icon: User },
    { id: "notifications", label: t("settings.tabs.notifications" as any), icon: Bell },
    { id: "appearance", label: t("settings.tabs.appearance" as any), icon: Palette },
    { id: "preferences", label: t("settings.tabs.preferences" as any), icon: Sliders },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("settings.title" as any)}</h1>
            <p className="text-sm text-slate-600">{t("settings.subtitle" as any)}</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={resetToDefault}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
            >
              <RefreshCw size={16} />
              {t("settings.reset" as any)}
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center gap-2 disabled:opacity-70"
            >
              <Save size={16} />
              {isSaving ? t("settings.saving" as any) : t("settings.save" as any)}
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          
          {/* Sidebar Tabs */}
          <div className="md:col-span-1 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive 
                      ? "bg-blue-50 text-blue-700 border border-blue-100" 
                      : "text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-blue-600" : "text-slate-400"} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content Panel */}
          <div className="md:col-span-3 space-y-6">
            
            {/* PROFILE SETTINGS */}
            {activeTab === "profile" && (
              <div className="panel rounded-xl p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Profile Details</h2>
                  <p className="text-sm text-slate-500">Update your personal information.</p>
                </div>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <input 
                      type="text" 
                      value={draft.profile.name}
                      onChange={(e) => setDraft({ ...draft, profile: { ...draft.profile, name: e.target.value } })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-sm bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                    <input 
                      type="email" 
                      value={draft.profile.email}
                      onChange={(e) => setDraft({ ...draft, profile: { ...draft.profile, email: e.target.value } })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-sm bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">System Role</label>
                    <input 
                      type="text" 
                      value={draft.profile.role}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 outline-none text-sm cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATION SETTINGS */}
            {activeTab === "notifications" && (
              <div className="panel rounded-xl p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Notification Preferences</h2>
                  <p className="text-sm text-slate-500">Choose what updates you want to receive.</p>
                </div>
                <div className="space-y-4 divide-y divide-slate-100">
                  
                  {/* Toggle Item */}
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Deadline Alerts</h3>
                      <p className="text-xs text-slate-500">Get notified when a case is approaching its limitation date.</p>
                    </div>
                    <button 
                      onClick={() => setDraft({ ...draft, notifications: { ...draft.notifications, deadlineAlerts: !draft.notifications.deadlineAlerts } })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${draft.notifications.deadlineAlerts ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${draft.notifications.deadlineAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  {/* Toggle Item */}
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Case Updates</h3>
                      <p className="text-xs text-slate-500">Receive emails when a case status changes to Verified.</p>
                    </div>
                    <button 
                      onClick={() => setDraft({ ...draft, notifications: { ...draft.notifications, caseUpdates: !draft.notifications.caseUpdates } })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${draft.notifications.caseUpdates ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${draft.notifications.caseUpdates ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Toggle Item */}
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Escalation Alerts</h3>
                      <p className="text-xs text-slate-500">Immediate notifications for Critical risk cases.</p>
                    </div>
                    <button 
                      onClick={() => setDraft({ ...draft, notifications: { ...draft.notifications, escalationAlerts: !draft.notifications.escalationAlerts } })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${draft.notifications.escalationAlerts ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${draft.notifications.escalationAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* APPEARANCE */}
            {activeTab === "appearance" && (
              <div className="panel rounded-xl p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Appearance</h2>
                  <p className="text-sm text-slate-500">Customize how the dashboard looks.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">Theme</label>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setDraft({ ...draft, appearance: { ...draft.appearance, theme: "light" } })}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${draft.appearance.theme === "light" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white hover:border-slate-300"}`}
                      >
                        <span className="font-semibold text-sm">Light Mode</span>
                      </button>
                      <button 
                        onClick={() => setDraft({ ...draft, appearance: { ...draft.appearance, theme: "dark" } })}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${draft.appearance.theme === "dark" ? "border-blue-600 bg-slate-800 text-white" : "border-slate-200 bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
                      >
                        <span className="font-semibold text-sm">Dark Mode</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">UI Density</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={draft.appearance.density === "comfortable"} 
                          onChange={() => setDraft({ ...draft, appearance: { ...draft.appearance, density: "comfortable" } })}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
                        />
                        <span className="text-sm font-medium text-slate-700">Comfortable (Default)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={draft.appearance.density === "compact"} 
                          onChange={() => setDraft({ ...draft, appearance: { ...draft.appearance, density: "compact" } })}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
                        />
                        <span className="text-sm font-medium text-slate-700">Compact</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SYSTEM PREFERENCES */}
            {activeTab === "preferences" && (
              <div className="panel rounded-xl p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">System Preferences</h2>
                  <p className="text-sm text-slate-500">Set default behaviors for your workspace.</p>
                </div>
                
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">{t("settings.language" as any) || "Language"}</label>
                    <select 
                      value={draft.preferences.language}
                      onChange={(e) => setDraft({ ...draft, preferences: { ...draft.preferences, language: e.target.value as Language } })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-sm bg-white"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Default Department Filter</label>
                    <select 
                      value={draft.preferences.defaultDepartment}
                      onChange={(e) => setDraft({ ...draft, preferences: { ...draft.preferences, defaultDepartment: e.target.value } })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-sm bg-white"
                    >
                      <option>All Departments</option>
                      <option>Revenue Department</option>
                      <option>Education Department</option>
                      <option>Urban Development</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Default Date Range</label>
                    <select 
                      value={draft.preferences.defaultDateRange}
                      onChange={(e) => setDraft({ ...draft, preferences: { ...draft.preferences, defaultDateRange: e.target.value } })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-sm bg-white"
                    >
                      <option>All Dates</option>
                      <option>Today</option>
                      <option>This Week</option>
                      <option>This Month</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-[slide-in-up_0.3s_ease-out]">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-sm font-medium">Settings saved successfully</span>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
