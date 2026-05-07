"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function ReviewPanel() {
  const ORIGINAL_WIDTH = 1000;
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(600);
  const scale = pageWidth / ORIGINAL_WIDTH;

  const [actions, setActions] = useState<any[]>([]);
  const [role, setRole] = useState("officer");

  useEffect(() => {
    async function fetchActions() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const casesRes = await fetch(`${apiUrl}/api/cases`);
        const casesData = await casesRes.json();
        
        if (casesData && casesData.length > 0) {
          const caseId = casesData[0].id;
          const actionsRes = await fetch(`${apiUrl}/api/cases/${caseId}/actions?role=${role}`);
          const actionsData = await actionsRes.json();
          setActions(actionsData);
        }
      } catch (err) {
        console.error("Failed to fetch actions:", err);
      }
    }
    fetchActions();
  }, [role]);

  const firstAction = actions.length > 0 ? actions[0] : null;
  const bbox = firstAction?.bounding_box ? {
    page: firstAction.bbox_page || 1,
    x: firstAction.bounding_box[0],
    y: firstAction.bounding_box[1],
    width: firstAction.bounding_box[2] - firstAction.bounding_box[0],
    height: firstAction.bounding_box[3] - firstAction.bounding_box[1],
  } : null;

  const onDocumentLoadSuccess = ({ numPages }: any) => {
    setNumPages(numPages);
  };

  return (
    <div className="flex h-[80vh] flex-col gap-6 lg:flex-row">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-lg lg:w-1/2">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Document preview</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Sample PDF Review</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              Page {pageNumber}
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Use the controls below to review pages and inspect highlighted content.
          </p>
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

        <div className="relative mt-4 overflow-hidden rounded-3xl bg-slate-50 p-4">
          <Document file="/sample.pdf" onLoadSuccess={onDocumentLoadSuccess}>
            <Page pageNumber={pageNumber} width={pageWidth} />
          </Document>

          {bbox && pageNumber === bbox.page && (
            <div
              className="pointer-events-none absolute border-2 border-red-500 bg-red-500/15"
              style={{
                top: bbox.y * scale,
                left: bbox.x * scale,
                width: bbox.width * scale,
                height: bbox.height * scale,
              }}
            />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-3xl bg-slate-100 px-4 py-3">
          <button
            onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Prev
          </button>
          <p className="text-sm text-slate-600">
            Page {pageNumber} of {numPages || "..."}
          </p>
          <button
            onClick={() =>
              setPageNumber((p) =>
                numPages ? Math.min(p + 1, numPages) : p
              )
            }
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Next
          </button>
        </div>
      </div>

      <div className="w-full rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-white shadow-lg lg:w-1/2">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">AI Data Panel</p>
            <h2 className="mt-2 text-2xl font-semibold">Insights & Actions</h2>
          </div>
          <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-3 py-1 text-sm border border-emerald-500/30">
            Connected to API
          </span>
        </div>

        <p className="mt-4 text-sm text-slate-300">
          View model recommendations, highlight assessment, and next-step proposals without leaving the review workspace.
        </p>

        <div className="mt-6 grid gap-4">
          {actions.length === 0 ? (
             <p className="text-sm text-slate-400 italic">No actions found for this case.</p>
          ) : actions.map((act) => (
            <div key={act.id} className="rounded-3xl bg-white/5 p-4 border border-white/10">
              <div className="flex justify-between items-start">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-400">{act.department}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${act.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {act.priority} priority
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold text-white">{act.action_required}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Deadline: {act.deadline} • Confidence: {Math.round((act.confidence_score || 0) * 100)}%
              </p>
              {act.source_text_quote && (
                <blockquote className="mt-3 border-l-2 border-slate-600 pl-3 text-sm italic text-slate-400">
                  "{act.source_text_quote}"
                </blockquote>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
