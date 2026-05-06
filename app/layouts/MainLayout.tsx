"use client";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AuthGuard from "../components/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <div className="min-h-screen lg:pl-72">
          <Navbar />
          <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
