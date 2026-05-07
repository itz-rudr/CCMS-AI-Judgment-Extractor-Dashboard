"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Highlighter,
  ShieldAlert,
  XCircle,
  Pencil
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const pdfFile = useMemo(() => ({ url: "/sample.pdf" }), []);
  const safePageNumber = numPages ? Math.min(pageNumber, numPages) : pageNumber;
  const scale = PAGE_WIDTH / ORIGINAL_WIDTH;

  useEffect(() => {
    async function fetchActions() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
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

  const handleVerify = async (status: 'approve' | 'reject') => {
    if (!selectedAction) return;
    setIsVerifying(true);
    setVerificationMessage(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      // Using POST /api/actions/{action_id}/approve or reject
      const res = await fetch(`${apiUrl}/api/actions/${selectedAction.id}/${status}?role=${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (res.ok) {
        setVerificationMessage({ type: 'success', text: `Action successfully ${status}d!` });
        // Update local state to reflect the new status
        setActions(actions.map(a => 
          a.id === selectedAction.id ? { ...a, status: status === 'approve' ? 'approved' : 'rejected' } : a
        ));
      } else {
        const errData = await res.json();
        setVerificationMessage({ type: 'error', text: errData.detail || "You do not have permission. Try changing role to Judge." });
      }
    } catch (err: any) {
      setVerificationMessage({ type: 'error', text: err.message || "Failed to connect to backend." });
    } finally {
      setIsVerifying(false);
    }
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
              <option value="judge">Judge (Can Approve/Reject)</option>
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

        {/* Right Side: AI Actions & Verification */}
        <section className="space-y-4 flex flex-col h-full">
          <div className="panel rounded-xl bg-white border border-slate-200 shadow-sm p-5 flex-1">
            
            <div className="mt-2 pt-2 border-t border-slate-100">
               <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <CalendarClock size={16} className="text-blue-600" />
                Proposed Action Plan
              </div>
              <div className="space-y-4">
                {actions.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No actions found for this case.</p>
                ) : actions.map((act) => (
                  <div key={act.id} className={`rounded-xl p-4 border transition-all ${selectedHighlightId === act.id ? 'bg-amber-50/50 border-amber-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-700">{act.department}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${act.priority === 'high' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {act.priority} priority
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{act.action_required}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Deadline: {act.deadline} • Status: <strong className="uppercase">{act.status}</strong>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VERIFICATION BUTTONS PANEL */}
          <div className="panel rounded-xl bg-slate-50 border border-slate-200 shadow-sm p-4">
             <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Human Verification
             </div>

             {verificationMessage && (
               <div className={`mb-4 p-3 rounded-md text-sm font-semibold border ${verificationMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                 {verificationMessage.text}
               </div>
             )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => handleVerify('approve')}
                disabled={isVerifying || !selectedAction}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                {isVerifying ? "Verifying..." : "Approve Action"}
              </button>
              
              <button
                onClick={() => handleVerify('reject')}
                disabled={isVerifying || !selectedAction}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
              >
                <XCircle size={16} />
                {isVerifying ? "Verifying..." : "Reject"}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              Requires Judge role. Selecting "Approve" will update the database.
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
