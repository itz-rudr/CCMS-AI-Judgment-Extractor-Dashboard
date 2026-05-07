from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes import upload, jobs, extractions, verification, dashboard, cases

app = FastAPI(title="CCMS Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    from backend.config import get_settings
    settings = get_settings()
    print(f"--- CCMS AI Startup ---")
    print(f"Model: {settings.gemini_model}")
    print(f"Max Pages: {settings.max_pages_for_llm}")
    print(f"-----------------------")

app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(extractions.router, prefix="/api/extractions", tags=["Extractions"])
app.include_router(verification.router, prefix="/api/verify", tags=["Verification"])
app.include_router(cases.router, prefix="/api/cases", tags=["Cases"])
app.include_router(dashboard.dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(dashboard.analytics_router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
