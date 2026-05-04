"use client";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <div className="ml-64 flex flex-1 flex-col">
        <Navbar />

        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}