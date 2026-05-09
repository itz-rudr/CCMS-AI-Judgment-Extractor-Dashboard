# 🛠️ Installation and Setup Guide

Follow these instructions to get the **CCMS AI Judgment Desk** running on your local machine.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Git**: [Download Git](https://git-scm.com/)
- **Python 3.10+**: [Download Python](https://www.python.org/)
- **Node.js 18+**: [Download Node.js](https://nodejs.org/) (includes npm)
- **Gemini API Key**: Obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Supabase Account**: Create a project at [Supabase](https://supabase.com/)

---

## 🔧 1. Clone the Repository

```bash
git clone https://github.com/your-repo/ccms-ai-judgment-desk.git
cd ccms-ai-judgment-desk
```

---

## 🐍 2. Backend Setup (FastAPI)

1. **Navigate to the backend directory**:
   ```bash
   cd ccms-backend-updated
   ```

2. **Create and activate a virtual environment**:
   - **Windows**:
     ```bash
     python -m venv .venv
     .venv\Scripts\activate
     ```
   - **macOS/Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   - Create a `.env` file in the `ccms-backend-updated` folder (copy from `.env.example`).
   - Add your keys:
     ```env
     GEMINI_API_KEY=your_gemini_api_key
     SUPABASE_URL=your_supabase_project_url
     SUPABASE_KEY=your_supabase_anon_key
     ```

5. **Start the Backend Server**:
   ```bash
   python -m uvicorn backend.main:app --reload --port 8000
   ```
   The backend will be available at `http://localhost:8000`.

---

## ⚛️ 3. Frontend Setup (Next.js)

1. **Navigate to the frontend directory**:
   ```bash
   cd ../ccms-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables** (Optional):
   - If you need to point to a custom backend URL, create a `.env.local` file:
     ```env
     NEXT_PUBLIC_API_URL=http://localhost:8000
     ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

---

## 🗄️ 4. Database Setup (Supabase)

To fully utilize the application, you need to set up the following tables in your Supabase SQL Editor:

```sql
-- Cases table
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number TEXT,
  parties_involved TEXT,
  judge_name TEXT,
  next_hearing_date DATE,
  summary TEXT,
  legal_sections JSONB,
  status TEXT DEFAULT 'pending',
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actions table
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  department TEXT,
  responsible_officer TEXT,
  action_required TEXT,
  deadline DATE,
  priority TEXT,
  confidence_score FLOAT,
  source_text TEXT,
  status TEXT DEFAULT 'pending'
);

-- AI Responses table (for logs)
CREATE TABLE ai_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_used TEXT,
  prompt_version TEXT,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🚀 Usage

1. Open your browser and go to `http://localhost:3000`.
2. Navigate to the **Upload** section.
3. Select a Karnataka High Court Judgment PDF.
4. Wait for the AI extraction to complete.
5. Review the extracted data in the **Verification** queue.
6. Once approved, view the analytics in the **Dashboard**.
