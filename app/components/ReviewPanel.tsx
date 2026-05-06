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
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion } from "framer-motion";
import { useTranslation } from "../hooks/useTranslation";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const ORIGINAL_WIDTH = 860;
const PAGE_WIDTH = 620;

const buildFields = (item: JudgmentCase) => ({
  caseId: item.id,
  department: item.department,
  responsibleOffice: item.responsibleOffice,
  actionType: item.actionType,
  dueDate: item.dueDate,
  limitationDate: item.limitationDate,
  actionSummary: item.actionSummary,
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

  const caseRecord = useMemo(() => {
    return (
      judgmentCases.find((item) => item.id === requestedId) ?? judgmentCases[0]
    );
  }, [requestedId]);

  return <ReviewWorkspace key={caseRecord.id} caseRecord={caseRecord} />;
}

function ReviewWorkspace({ caseRecord }: { caseRecord: JudgmentCase }) {
  const { t } = useTranslation();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(caseRecord.highlights[0].page);
  const [selectedHighlight, setSelectedHighlight] = useState<SourceHighlight>(
    caseRecord.highlights[0]
  );
  const [fields, setFields] = useState<ReviewFields>(() =>
    buildFields(caseRecord)
  );
  const [decision, setDecision] = useState(caseRecord.reviewStatus);
  const pdfFile = useMemo(() => ({ url: "/sample.pdf" }), []);

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            {caseRecord.title}
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
              {t("review_panel.confidence" as any)}: {caseRecord.confidence}%
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            {caseRecord.bench} • {caseRecord.sourceType}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-white border border-slate-700">
            {caseRecord.confidence}% {t("review_panel.ai_confidence" as any)}
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
          <div className="panel rounded-xl bg-white border border-slate-200 shadow-sm p-4">
             <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <Highlighter size={16} className="text-amber-500" />
                {t("review_panel.extracted_evidence" as any)}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {caseRecord.highlights.map((highlight) => {
                  const selected = selectedHighlight.id === highlight.id;
                  return (
                    <button
                      key={highlight.id}
                      onClick={() => selectHighlight(highlight)}
                      className={`focus-ring shrink-0 w-64 rounded-lg border p-3 text-left transition ${
                        selected
                          ? "border-amber-400 bg-amber-50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-bold text-slate-900">{highlight.label}</p>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          p.{highlight.page}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">"{highlight.quote}"</p>
                    </button>
                  );
                })}
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
              <div className="space-y-2">
                {caseRecord.actionPlan.map((step, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-50 rounded-md border border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                      <p className="text-xs text-slate-500">Owner: {step.owner}</p>
                    </div>
                    <span className="mt-2 sm:mt-0 px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto">
                      Due: {step.due}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel rounded-xl bg-slate-50 border border-slate-200 shadow-sm p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                onClick={() => setDecision("Approved")}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                <CheckCircle2 size={16} />
                {t("review_panel.buttons.approve" as any)}
              </button>
              <button
                onClick={() => setDecision("Edited")}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <Pencil size={16} />
                {t("review_panel.buttons.save" as any)}
              </button>
              <button
                onClick={() => setDecision("Rejected")}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
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
