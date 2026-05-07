"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Document, Page, pdfjs } from "react-pdf";
import { motion } from "framer-motion";
import { useTranslation } from "../hooks/useTranslation";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const ORIGINAL_WIDTH = 860;
const PAGE_WIDTH = 620;

export default function ReviewPanel() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");
  return <ReviewWorkspace key={requestedId || "new"} requestedId={requestedId} />;
}

function ReviewWorkspace({ requestedId }: { requestedId: string | null }) {
  const { t } = useTranslation();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [role, setRole] = useState("officer");
  
  const [actions, setActions] = useState<any[]>([]);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  
  const pdfFile = useMemo(() => ({ url: "/sample.pdf" }), []);
  const safePageNumber = numPages ? Math.min(pageNumber, numPages) : pageNumber;
  const scale = PAGE_WIDTH / ORIGINAL_WIDTH;

  useEffect(() => {
    async function fetchActions() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        // If requestedId exists, we fetch for that case.
        // Otherwise fallback to first case.
        let targetId = requestedId;
        if (!targetId) {
            const casesRes = await fetch(`${apiUrl}/api/cases`);
            const casesData = await casesRes.json();
            if (casesData && casesData.length > 0) {
              targetId = casesData[0].id;
            }
        }
        
        if (targetId) {
          const actionsRes = await fetch(`${apiUrl}/api/cases/${targetId}/actions?role=${role}`);
          const actionsData = await actionsRes.json();
          setActions(actionsData);
          if (actionsData.length > 0) {
              setSelectedHighlightId(actionsData[0].id);
              if (actionsData[0].bbox_page) {
                  setPageNumber(actionsData[0].bbox_page);
              }
          }
        }
      } catch (err) {
        console.error("Failed to fetch actions:", err);
      }
    }
    fetchActions();
  }, [requestedId, role]);

  const selectedAction = actions.find(a => a.id === selectedHighlightId) || actions[0] || null;
  const bbox = selectedAction?.bounding_box ? {
    page: selectedAction.bbox_page || 1,
    x: selectedAction.bounding_box[0],
    y: selectedAction.bounding_box[1],
    width: selectedAction.bounding_box[2] - selectedAction.bounding_box[0],
    height: selectedAction.bounding_box[3] - selectedAction.bounding_box[1],
  } : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            Case Review: {requestedId || "Default"}
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
              {t("review_panel.confidence" as any) || "Confidence"}: {selectedAction ? Math.round((selectedAction.confidence_score || 0)*100) : 0}%
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-slate-500">View as:</span>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              className="text-sm border border-slate-200 rounded px-2 py-1"
            >
              <option value="officer">Officer (Sees Highlights)</option>
              <option value="judge">Judge (Hidden Highlights)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(460px,0.9fr)]">
        
        {/* Left Side: Document Viewer & Evidence */}
        <section className="flex flex-col gap-4">
          <div className="panel rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <FileText size={16} className="text-teal-600" />
                {t("review_panel.source_doc" as any) || "Source Document"}
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

                {bbox && bbox.page === safePageNumber && (
                  <div
                    className="absolute rounded-md border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_0_9999px_rgba(255,255,255,0.6)]"
                    style={{
                      top: bbox.y * scale,
                      left: bbox.x * scale,
                      width: bbox.width * scale,
                      height: bbox.height * scale,
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
                {t("review_panel.extracted_evidence" as any) || "Extracted Evidence"}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {actions.map((act) => {
                  const selected = selectedHighlightId === act.id;
                  return (
                    <button
                      key={act.id}
                      onClick={() => {
                          setSelectedHighlightId(act.id);
                          if(act.bbox_page) setPageNumber(act.bbox_page);
                      }}
                      className={`focus-ring shrink-0 w-64 rounded-lg border p-3 text-left transition ${
                        selected
                          ? "border-amber-400 bg-amber-50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-bold text-slate-900">{act.department}</p>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          p.{act.bbox_page || 1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">"{act.source_text_quote || "No quote"}"</p>
                    </button>
                  );
                })}
              </div>
          </div>
        </section>

        {/* Right Side: AI Actions */}
        <section className="space-y-4 flex flex-col h-full">
          <div className="panel rounded-xl bg-white border border-slate-200 shadow-sm p-5 flex-1">
            
            <div className="mt-6 pt-4 border-t border-slate-100">
               <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <CalendarClock size={16} className="text-blue-600" />
                Proposed Action Plan
              </div>
              <div className="space-y-4">
                {actions.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No actions found for this case.</p>
                ) : actions.map((act) => (
                  <div key={act.id} className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-700">{act.department}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${act.priority === 'high' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {act.priority} priority
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{act.action_required}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Deadline: {act.deadline}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </section>
      </div>
    </motion.div>
  );
}
