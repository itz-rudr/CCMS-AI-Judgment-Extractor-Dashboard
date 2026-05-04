"use client";

import dynamic from "next/dynamic";
import MainLayout from "../layouts/MainLayout";

const ReviewPanel = dynamic(() => import("../components/ReviewPanel"), {
  ssr: false,
  loading: () => (
    <div className="panel rounded-lg p-6 text-sm font-semibold text-slate-600">
      Loading review workspace...
    </div>
  ),
});

export default function ReviewPage() {
  return (
    <MainLayout>
      <ReviewPanel />
    </MainLayout>
  );
}
