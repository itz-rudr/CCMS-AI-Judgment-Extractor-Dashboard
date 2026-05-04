"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function ReviewPanel() {
  const ORIGINAL_WIDTH = 1000; // assume for now
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(600);
  const scale = pageWidth / ORIGINAL_WIDTH;

  // 🔥 Example bounding box from backend
  const bbox = {
    page: 1,
    x: 100,
    y: 150,
    width: 200,
    height: 50,
  };

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
        </div>

        <div className="relative mt-4 overflow-hidden rounded-3xl bg-slate-50 p-4">
          <Document file="/sample.pdf" onLoadSuccess={onDocumentLoadSuccess}>
            <Page pageNumber={pageNumber} width={pageWidth} />
          </Document>

          {pageNumber === bbox.page && (
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
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-100">Live</span>
        </div>

        <p className="mt-4 text-sm text-slate-300">
          View model recommendations, highlight assessment, and next-step proposals without leaving the review workspace.
        </p>

        <div className="mt-6 grid gap-4">
          <div className="rounded-3xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Detected issue</p>
            <p className="mt-2 text-lg font-semibold text-white">Potential evidence mismatch</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              The AI flagged a possible inconsistency in the document extraction that should be reviewed manually.
            </p>
          </div>

          <div className="rounded-3xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Next step</p>
            <p className="mt-2 text-lg font-semibold text-white">Assign reviewer</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Assign this case to a specialist for validation and follow up with the evidence team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}