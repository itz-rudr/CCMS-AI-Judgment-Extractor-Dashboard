"use client";

import CaseTable from "../components/CaseTable";
import MainLayout from "../layouts/MainLayout";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Globe } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "../hooks/useTranslation";
import { uploadPDF, getJobStatus } from "../services/api";

type UploadLang = "English" | "Hindi" | "Kannada";

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading" }
  | { phase: "processing"; jobId: string; progress: number; statusText: string }
  | { phase: "success"; message: string; caseId?: string }
  | { phase: "error"; message: string };

export default function ExtractionPage() {
  const [uploadState, setUploadState] = useState<UploadState>({ phase: "idle" });
  const [language, setLanguage] = useState<UploadLang>("English");
  const { t } = useTranslation();

  const pollJob = async (jobId: string) => {
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const job = await getJobStatus(jobId);
        setUploadState({
          phase: "processing",
          jobId,
          progress: job.progress,
          statusText: job.status,
        });
        if (job.status.startsWith("Done")) {
          setUploadState({ 
            phase: "success", 
            message: job.status.includes("Session") ? "PDF extracted to temporary session storage." : "PDF extracted and saved to database!",
            caseId: job.case_id
          });
          // Trigger automatic refresh of the CaseTable
          window.dispatchEvent(new Event("case-extracted"));
          return;
        }
        if (job.status.startsWith("Failed")) {
          setUploadState({ phase: "error", message: job.status });
          return;
        }
      } catch {
        // keep polling even on transient errors
      }
    }
    setUploadState({ phase: "error", message: "Processing timed out. Please try again." });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset input

    setUploadState({ phase: "uploading" });
    try {
      const result = await uploadPDF(file, language);
      console.log(result);
      setUploadState({
        phase: "processing",
        jobId: result.job_id,
        progress: 0,
        statusText: "Starting...",
      });
      await pollJob(result.job_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadState({ phase: "error", message: msg });
    }
  };

  const isActive = uploadState.phase === "uploading" || uploadState.phase === "processing";

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t("extraction.title" as any)}
          </h1>
          <p className="text-sm text-slate-600">
            {t("extraction.subtitle" as any)}
          </p>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel rounded-xl p-8 border border-slate-200 bg-white"
        >
          <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto py-6 gap-6">
            
            {/* Icon */}
            <div
              className={`flex items-center justify-center h-16 w-16 rounded-full ${
                uploadState.phase === "success"
                  ? "bg-emerald-100 text-emerald-600"
                  : uploadState.phase === "error"
                  ? "bg-rose-100 text-rose-600"
                  : "bg-teal-50 text-teal-600"
              }`}
            >
              {uploadState.phase === "success" ? (
                <CheckCircle2 size={28} />
              ) : uploadState.phase === "error" ? (
                <AlertCircle size={28} />
              ) : uploadState.phase === "uploading" || uploadState.phase === "processing" ? (
                <Loader2 size={28} className="animate-spin" />
              ) : (
                <UploadCloud size={28} />
              )}
            </div>

            {/* Title */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                {uploadState.phase === "idle" && (t("extraction.drop" as any) || "Upload Judgment PDF")}
                {uploadState.phase === "uploading" && "Uploading..."}
                {uploadState.phase === "processing" && (uploadState as any).statusText}
                {uploadState.phase === "success" && (t("extraction.complete" as any) || "Extraction Complete")}
                {uploadState.phase === "error" && "Upload Failed"}
              </h2>
              <p className="text-sm text-slate-500">
                {uploadState.phase === "idle" && (t("extraction.default_desc" as any) || "PDF files only. AI will extract case data automatically.")}
                {uploadState.phase === "uploading" && "Sending your file to the backend…"}
                {uploadState.phase === "processing" && `Progress: ${(uploadState as any).progress}%`}
                {uploadState.phase === "success" && (uploadState as any).message}
                {uploadState.phase === "error" && (uploadState as any).message}
              </p>
            </div>

            {/* Progress bar */}
            <AnimatePresence>
              {uploadState.phase === "processing" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-xs"
                >
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-teal-500 rounded-full"
                      animate={{ width: `${(uploadState as any).progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Language selector + upload button */}
            {!isActive && uploadState.phase !== "success" && (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <Globe size={14} className="text-slate-500" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as UploadLang)}
                    className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Kannada">Kannada</option>
                  </select>
                </label>

                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    disabled={isActive}
                  />
                  <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold transition shadow-sm bg-slate-900 text-white hover:bg-slate-800">
                    <UploadCloud size={16} />
                    {t("cases.select_pdf" as any) || "Select PDF"}
                  </div>
                </div>
              </div>
            )}

            {/* Reset after error or success */}
            {uploadState.phase === "success" && (uploadState as any).caseId && (
              <button
                onClick={() => window.location.href = `/review?id=${(uploadState as any).caseId}`}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-bold transition shadow-md bg-teal-600 text-white hover:bg-teal-700"
              >
                <CheckCircle2 size={18} />
                Start Verification
              </button>
            )}

            {(uploadState.phase === "error" || uploadState.phase === "success") && (
              <button
                onClick={() => setUploadState({ phase: "idle" })}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-4 transition"
              >
                Upload another file
              </button>
            )}
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CaseTable />
        </motion.div>
      </div>
    </MainLayout>
  );
}
