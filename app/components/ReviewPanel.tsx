"use client";

import {
  judgmentCases,
  type JudgmentCase,
  type SourceHighlight,
} from "@/app/lib/ccms-data";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Highlighter,
  Pencil,
  ShieldAlert,
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion } from "framer-motion";
import { useTranslation } from "../hooks/useTranslation";
import { getExtraction, verifyCase, type ApiCase, BASE_URL } from "../services/api";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const ORIGINAL_WIDTH = 860;
const PAGE_WIDTH = 620;

const buildFields = (item: JudgmentCase) => ({
  caseId: item.caseNumber,
  department: item.department,
  responsibleOffice: item.responsibleOffice,
  actionSummary: item.actionSummary,
  responsible_officer: item.responsible_officer ?? "",
});

type ReviewFields = ReturnType<typeof buildFields>;

const statusClass: Record<string, string> = {
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Needs Review": "bg-amber-50 text-amber-700 border-amber-200",
  Edited: "bg-teal-50 text-teal-700 border-teal-200",
  Rejected: "bg-slate-100 text-slate-600 border-slate-200",
};

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}

export default function ReviewPanel() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");
  const { t } = useTranslation();

  const [liveCase, setLiveCase] = useState<ApiCase | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!requestedId) { setIsLoading(false); return; }
    setIsLoading(true);
    getExtraction(requestedId)
      .then(data => { setLiveCase(data); setIsLive(true); })
      .catch(() => { setIsLive(false); })
      .finally(() => setIsLoading(false));
  }, [requestedId]);

  const staticFallback = useMemo(() =>
    judgmentCases.find((item) => item.id === requestedId) ?? judgmentCases[0]
  , [requestedId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 size={24} className="animate-spin mr-3" />
        <span className="text-sm font-medium">Loading case...</span>
      </div>
    );
  }

  const caseRecord = (liveCase ?? staticFallback) as unknown as JudgmentCase;

  return <ReviewWorkspace key={caseRecord.id} caseRecord={caseRecord} caseId={requestedId} isLive={isLive} />;
}

function ReviewWorkspace({ caseRecord, caseId, isLive }: { caseRecord: JudgmentCase; caseId: string | null; isLive: boolean }) {
  const { t } = useTranslation();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(caseRecord.highlights[0]?.page ?? 1);
  const [selectedHighlight, setSelectedHighlight] = useState<SourceHighlight>(
    caseRecord.highlights[0] ?? { id: "x", label: "", page: 1, confidence: 0, quote: "", field: "", box: { x:0, y:0, width:0, height:0 } }
  );
  const [fields, setFields] = useState<ReviewFields>(() => buildFields(caseRecord));
  const [decision, setDecision] = useState(caseRecord.reviewStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const pdfFile = useMemo(() => {
    if (caseRecord.pdfUrl) {
      // If it's a relative path starting with /static, prepend BASE_URL
      const url = caseRecord.pdfUrl.startsWith("http") 
        ? caseRecord.pdfUrl 
        : `${BASE_URL}${caseRecord.pdfUrl}`;
      return { url };
    }
    return { url: "/sample.pdf" }; // fallback
  }, [caseRecord.pdfUrl]);

  const safePageNumber = numPages ? Math.min(pageNumber, numPages) : pageNumber;
  const scale = PAGE_WIDTH / ORIGINAL_WIDTH;

  const updateField = (key: keyof ReviewFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setDecision("Edited");
  };

  const selectHighlight = (highlight: SourceHighlight) => {
    setSelectedHighlight(highlight);
    setPageNumber(highlight.page);
  };

  const handleSubmit = async (newDecision: typeof decision) => {
    setDecision(newDecision);
    if (!caseId || !isLive) return; // offline – just update UI
    setIsSubmitting(true);
    setSubmitMsg(null);
    try {
      await verifyCase(caseId, {
        decision: newDecision as any,
        fields: newDecision === "Edited" ? {
          cisId: fields.caseId,
          actionSummary: fields.actionSummary,
        } : undefined,
      });
      setSubmitMsg(`✓ Decision "${newDecision}" saved to database.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submit failed";
      setSubmitMsg(`Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  console.log(caseRecord)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            {caseRecord.caseNumber || caseRecord.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            {caseRecord.bench} • {caseRecord.sourceType}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${
            isLive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {isLive ? <Wifi size={11} /> : <WifiOff size={11} />}
            {isLive ? "Live" : "Demo"}
          </div>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white border border-slate-700">
            {caseRecord.confidence}% System Confidence
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(460px,0.9fr)]">
        
        {/* Left Side: Document Viewer & Evidence */}
        <section className="flex flex-col gap-4">
          <div className="panel rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <FileText size={16} className="text-teal-600" />
                {t("review_panel.source_doc" as any)}
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold">
                <button
                  onClick={() => setPageNumber((page) => Math.max(page - 1, 1))}
                  className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-slate-600 w-16 text-center">
                  {safePageNumber} / {numPages ?? "--"}
                </span>
                <button
                  onClick={() =>
                    setPageNumber((page) =>
                      numPages ? Math.min(page + 1, numPages) : page + 1
                    )
                  }
                  className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="bg-slate-100 p-4 flex-1 flex justify-center items-start overflow-auto">
              <div className="relative shadow-lg rounded-md bg-white border border-slate-200" style={{ width: PAGE_WIDTH }}>
                <Document
                  file={pdfFile}
                  onLoadSuccess={({ numPages }: { numPages: number }) =>
                    setNumPages(numPages)
                  }
                  loading={
                    <div className="flex h-[620px] items-center justify-center text-sm font-bold text-slate-400">
                      Loading PDF...
                    </div>
                  }
                  error={
                    <div className="flex h-[620px] flex-col items-center justify-center text-center text-sm text-rose-500 bg-rose-50/50">
                      <ShieldAlert size={28} className="mb-2" />
                      <p className="font-bold">Cannot load PDF</p>
                    </div>
                  }
                >
                  <Page
                    pageNumber={safePageNumber}
                    width={PAGE_WIDTH}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </Document>

                {selectedHighlight.page === safePageNumber && (
                  <div
                    className="absolute rounded-md border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_0_9999px_rgba(255,255,255,0.6)]"
                    style={{
                      top: selectedHighlight.box.y * scale,
                      left: selectedHighlight.box.x * scale,
                      width: selectedHighlight.box.width * scale,
                      height: selectedHighlight.box.height * scale,
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Evidence Map Minimal */}
          <div className="panel rounded-xl bg-white border border-slate-200 shadow-sm p-4 h-[420px] flex flex-col">
             <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3 shrink-0">
                <Highlighter size={16} className="text-amber-500" />
                {t("review_panel.extracted_evidence" as any)}
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {caseRecord.highlights && caseRecord.highlights.length > 0 ? (
                  caseRecord.highlights.map((highlight) => {
                    const selected = selectedHighlight.id === highlight.id;
                    return (
                      <button
                        key={highlight.id}
                        onClick={() => selectHighlight(highlight)}
                        className={`focus-ring w-full rounded-lg border p-4 text-left transition flex flex-col gap-2 ${
                          selected
                            ? "border-amber-400 bg-amber-50 shadow-sm"
                            : "border-slate-200 bg-slate-50 hover:bg-white"
                        }`}
                      >
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <p className="text-[10px] font-extrabold text-slate-900 uppercase tracking-tighter">{highlight.label}</p>
                          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                            PAGE {highlight.page}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 italic">
                          &ldquo;{highlight.quote}&rdquo;
                        </p>
                        <div className="mt-1 pt-2 flex items-center justify-between">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Field: {highlight.field}</span>
                           <span className="text-[10px] font-bold text-amber-600">{Math.min(100, Math.round(highlight.confidence * 100))}% Confidence</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium italic border-2 border-dashed border-slate-100 rounded-lg">
                    No source evidence available.
                  </div>
                )}
              </div>
          </div>
        </section>

        {/* Right Side: Editable Fields & Actions */}
        <section className="space-y-4 flex flex-col h-full">
          <div className="panel rounded-xl bg-white border border-slate-200 shadow-sm p-5 flex-1">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 border-b border-slate-100 pb-3 mb-4">
              <Pencil size={16} className="text-teal-600" />
              {t("review_panel.verified_data" as any)}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInput
                label="Case ID"
                value={fields.caseId}
                onChange={(value) => updateField("caseId", value)}
              />
              <FieldInput
                label="Department"
                value={fields.department}
                onChange={(value) => updateField("department", value)}
              />
              <FieldInput
                label="Responsible office"
                value={fields.responsibleOffice}
                onChange={(value) => updateField("responsibleOffice", value)}
              />
              <FieldInput
                label="Responsible officer"
                value={fields.responsible_officer}
                onChange={(value) => updateField("responsible_officer", value)}
              />
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nature of action
                </span>
                <select
                  value={fields.actionType}
                  onChange={(event) =>
                    updateField("actionType", event.target.value)
                  }
                  className="mt-1.5 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                >
                  <option>Compliance</option>
                  <option>Appeal Review</option>
                  <option>Compliance + Appeal Review</option>
                </select>
              </label>
              <FieldInput
                label="Compliance due"
                value={fields.dueDate}
                type="date"
                onChange={(value) => updateField("dueDate", value)}
              />
              <FieldInput
                label="Appeal limitation"
                value={fields.limitationDate}
                type="date"
                onChange={(value) => updateField("limitationDate", value)}
              />
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Action Summary
              </span>
              <textarea
                value={fields.actionSummary}
                onChange={(event) =>
                  updateField("actionSummary", event.target.value)
                }
                rows={3}
                className="mt-1.5 w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            {/* AI Action Plan Minimal View */}
            <div className="mt-6 pt-4 border-t border-slate-100">
               <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <CalendarClock size={16} className="text-blue-600" />
                Proposed Action Plan
              </div>
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {caseRecord.actionPlan && caseRecord.actionPlan.length > 0 ? (
                  caseRecord.actionPlan.map((step, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-md border border-slate-100">
                      <div className="flex justify-between items-start gap-3">
                        <p className="text-sm font-bold text-slate-800 leading-tight flex-1">{step.title}</p>
                        <span className="shrink-0 px-2 py-0.5 rounded bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                          Due: {step.due}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Owner: {step.owner}</p>
                        <span className="text-[10px] font-bold text-teal-600 uppercase italic">{step.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-4">No action steps identified.</p>
                )}
              </div>
            </div>
          </div>

          <div className="panel rounded-xl bg-slate-50 border border-slate-200 shadow-sm p-4">
            {submitMsg && (
              <div className={`mb-3 text-xs font-semibold px-3 py-2 rounded-lg border ${
                submitMsg.startsWith("Error")
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>{submitMsg}</div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                onClick={() => handleSubmit("Approved")}
                disabled={isSubmitting}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {t("review_panel.buttons.approve" as any)}
              </button>
              <button
                onClick={() => handleSubmit("Edited")}
                disabled={isSubmitting}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                <Pencil size={16} />
                {t("review_panel.buttons.save" as any)}
              </button>
              <button
                onClick={() => handleSubmit("Rejected")}
                disabled={isSubmitting}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
              >
                <XCircle size={16} />
                {t("review_panel.buttons.reject" as any)}
              </button>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
