"use client";

import CaseTable from "../components/CaseTable";
import MainLayout from "../layouts/MainLayout";
import { UploadCloud } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "../hooks/useTranslation";

export default function ExtractionPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { t } = useTranslation();

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    }, 1500);
  };

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
          <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto py-6">
            <div className={`flex items-center justify-center h-16 w-16 rounded-full mb-4 ${uploadSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-teal-50 text-teal-600'}`}>
              <UploadCloud size={28} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {uploadSuccess ? t("extraction.complete" as any) : t("extraction.drop" as any)}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {uploadSuccess 
                ? t("extraction.success_desc" as any)
                : t("extraction.default_desc" as any)}
            </p>
            
            <div className="relative w-48">
              <input
                type="file"
                accept=".pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleUpload();
                  }
                }}
              />
              <div className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold transition shadow-sm ${
                isUploading ? 'bg-slate-100 text-slate-500 border border-slate-200' : 
                uploadSuccess ? 'bg-emerald-600 text-white' : 
                'bg-slate-900 text-white hover:bg-slate-800'
              }`}>
                {isUploading ? t("cases.extracting" as any) : uploadSuccess ? t("cases.success" as any) : t("cases.select_pdf" as any)}
              </div>
            </div>
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
