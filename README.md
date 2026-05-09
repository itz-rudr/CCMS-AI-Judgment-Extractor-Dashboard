# Judgement Desk AI ⚖️

<div align="center">
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white" />
</div>

## Theme 11: From Court Judgments to Verified Action Plans (AI for Bharat)

**Judgement Desk AI** is an advanced GovTech platform designed to ingest complex, multi-lingual Indian court judgments (English, Hindi, Kannada) and automatically distill them into highly structured, verifiable action plans for government departments. 

Instead of officials manually reading 50-page PDF rulings to find compliance deadlines, our AI does it instantly and provides a Human-in-the-Loop verification dashboard for Judges.

---

## 🏛️ Core Architecture

This project is built with a strictly decoupled, production-grade architecture:

### 1. The AI Extraction Engine (Python/FastAPI)
- Uses `pdf2image` to reliably parse raw, scanned PDF court judgments, bypassing the limitations of standard text extractors.
- Leverages the **Google Gemini Vision API** combined with strict Pydantic schemas (`ExtractedAction`, `ExtractedJudgment`) to guarantee structured JSON output.
- Automatically identifies: `Department`, `Required Action`, `Deadline`, `Priority Level`, and the exact `Source Text Quote` with bounding box coordinates for explainability.

### 2. The Database Layer (Supabase PostgreSQL)
- Relational schema tracking `cases` and compliance `actions`.
- Protected by Row Level Security (RLS) concepts. The FastAPI backend securely communicates via the `service_role` key to seamlessly store the structured AI outputs.

### 3. Human Verification Dashboard (Next.js)
- A beautiful, responsive frontend built with Next.js, TailwindCSS, and Framer Motion.
- **Human-in-the-loop (HITL):** A dual-role dashboard where "Officers" can review extracted deadlines, and "Judges" can view the exact bounding box of the source text on the original PDF before clicking **Approve** or **Reject** to write the verified status back to the database.

---

## 🚀 Quick Start Guide

### Frontend (Next.js Dashboard)
```bash
cd ccms-frontend
npm install
npm run dev
```

### Backend (FastAPI AI Engine)
```bash
cd ccms-backend-updated
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

*Note: Environment variables for Supabase and Gemini API keys must be configured in `.env.local` and `.env` respectively.*

---
*Built with ❤️ for the AI for Bharat Hackathon.*
