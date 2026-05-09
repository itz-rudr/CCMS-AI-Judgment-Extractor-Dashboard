# 🏛️ CCMS AI Judgment Desk - Project Overview

The **CCMS AI Judgment Desk** is an enterprise-grade, AI-assisted legal workflow and compliance management platform designed for government usage. It streamlines the processing of court judgment PDFs, turning raw legal documents into structured, actionable intelligence and tracking compliance across various departments.

---

## 🚀 Core Features

### 1. 🧠 Intelligent Legal Extraction
- **AI-Powered OCR**: Processes complex court judgment PDFs to extract high-fidelity legal data.
- **Structured Intelligence**: Automatically identifies:
  - **Case ID**: Official court citations (e.g., WP-21472-2025).
  - **Departments**: Maps cases to responsible government bodies (Revenue, BBMP, PWD, etc.).
  - **Directives**: Identifies specific court orders and requirements.
  - **Deadlines**: Extracts time-bound compliance requirements from legal text.
- **Confidence Scoring**: Multi-layer confidence metrics (OCR & AI) to ensure data reliability.

### 2. 📋 Automated Action Plan Generation
- **Administrative Tasking**: Converts verbose legal directives into concise, actionable administrative tasks.
- **Priority Mapping**: Automatically assigns priority levels (High/Medium/Low) based on court urgency (e.g., "forthwith" vs. "within 8 weeks").
- **Officer Assignment**: Identifies specific designations or offices named in the order for direct accountability.

### 3. ⚖️ Human-in-the-Loop Verification
- **Reviewer-Friendly Workflow**: A dedicated verification interface where legal officers can review AI-extracted data.
- **Source-to-Extraction Traceability**: Integrated PDF viewer allows reviewers to inspect the exact source text within the judgment for every extracted action.
- **Edit & Approve**: Enables manual refinement of AI outputs before they are finalized in the system.

### 4. 📊 Departmental Compliance Dashboard
- **Unified Analytics**: Real-time tracking of case statuses (Pending, Approved, Overdue).
- **Departmental Insights**: Aggregated data showing compliance performance across different government sectors.
- **Operational Intelligence**: Visualizes workload, urgency, and compliance timelines to support decision-making.

### 5. 🏗️ Enterprise-Grade Architecture
- **Parallel Processing**: Handles large documents by splitting them into chunks for concurrent AI extraction.
- **Robust Fallbacks**: Integrated regex-based extraction system that takes over if AI quotas or rate limits are reached.
- **Scalable Backend**: Built with FastAPI and Supabase (PostgreSQL) for high-performance data handling.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)
- **PDF Handling**: `react-pdf` and `pdfjs-dist`

### Backend
- **Language**: Python 3.10+
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **AI Engine**: [Google Gemini AI](https://ai.google.dev/) (GenAI SDK)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Document Processing**: Custom PDF parsing and heuristic filtering pipeline

---

## 📄 Intended Workflow

1. **Upload**: User uploads a court judgment PDF.
2. **Extract**: The system performs OCR and multi-stage AI extraction to build a structured case profile.
3. **Queue**: The case enters the "Extraction Queue" for human verification.
4. **Verify**: A legal officer reviews the data against the source PDF and approves the record.
5. **Dashboard**: Finalized data populates the trusted dashboard for compliance tracking and administrative action.
