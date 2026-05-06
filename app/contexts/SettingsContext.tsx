"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language } from "../lib/i18n";

export type SettingsState = {
  profile: {
    name: string;
    email: string;
    role: string;
  };
  notifications: {
    deadlineAlerts: boolean;
    caseUpdates: boolean;
    escalationAlerts: boolean;
  };
  appearance: {
    theme: "light" | "dark";
    density: "compact" | "comfortable";
  };
  preferences: {
    defaultDepartment: string;
    defaultDateRange: string;
    language: Language;
  };
};

const defaultSettings: SettingsState = {
  profile: {
    name: "Admin User",
    email: "admin@govtech.in",
    role: "System Administrator",
  },
  notifications: {
    deadlineAlerts: true,
    caseUpdates: false,
    escalationAlerts: true,
  },
  appearance: {
    theme: "light",
    density: "comfortable",
  },
  preferences: {
    defaultDepartment: "All Departments",
    defaultDateRange: "Today",
    language: "en",
  },
};

type SettingsContextType = {
  settings: SettingsState;
  updateSettings: (newSettings: Partial<SettingsState>) => void;
  resetToDefault: () => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isMounted, setIsMounted] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("ccms_settings");
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save to LocalStorage and Apply Theme
  useEffect(() => {
    if (!isMounted) return;
    
    localStorage.setItem("ccms_settings", JSON.stringify(settings));

    // Apply Dark Mode
    if (settings.appearance.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings, isMounted]);

  const updateSettings = (newSettings: Partial<SettingsState>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetToDefault = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetToDefault }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
