"""AI extractor service.

Segment 4 of the CCMS backend pipeline.

Responsibilities:
  - heuristic_filter  : prune irrelevant pages before sending to the LLM
  - extract_case_data : call Gemini with native structured output (response_schema)
  - chunk_and_extract : handle oversized documents via parallel chunked extraction
"""

from __future__ import annotations

import asyncio
import logging
import math
import re
import uuid
from datetime import datetime, timezone
from typing import Literal

from google import genai
from google.genai import types as genai_types
from pydantic import BaseModel, Field
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from backend.config import get_settings
from backend.db import get_supabase

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------

class ExtractionError(Exception):
    """Raised when Gemini extraction fails after all retries."""


# ---------------------------------------------------------------------------
# Pydantic schemas — Gemini returns these directly via response_json_schema
# ---------------------------------------------------------------------------

class ExtractedAction(BaseModel):
    """A single court-directed action extracted from a Karnataka HC judgment."""

    department: str = Field(
        description=(
            "The responsible government department or authority. "
            "Use 'BBMP Legal Cell' when BBMP is named, "
            "'Court Registry' for registry instructions, "
            "'Revenue Department' when revenue dept is named, "
            "and 'Concerned Authority' when no explicit dept is mentioned."
        )
    )
    action_required: str = Field(
        description="The precise action the department must perform as directed by the court."
    )
    deadline: str | None = Field(
        default=None,
        description="ISO-8601 date string (YYYY-MM-DD) for the compliance deadline, or null if none stated.",
    )
    priority: Literal["high", "medium", "low"] = Field(
        description=(
            "Urgency level. 'high' for 'forthwith', 'shall forthwith', immediate compliance; "
            "'medium' for deadlines within 4 weeks; 'low' for longer timelines or routine reporting."
        )
    )
    confidence_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence that this action was genuinely directed by the court (0.0–1.0).",
    )
    limitation_period: str | None = Field(
        default=None,
        description="e.g. '90 days from date of order' or null if not mentioned"
    )
    source_text: str = Field(
        description="The exact verbatim sentence or clause from the judgment that triggered this action."
    )


class ExtractedCase(BaseModel):
    """All structured data extracted from a single Karnataka HC judgment."""

    case_number: str = Field(description="The full case number, e.g. WP/1234/2024.")
    parties_involved: str | None = Field(
        default=None,
        description="Petitioner and respondent names, e.g. 'John Doe vs State of Karnataka'.",
    )
    judge_name: str | None = Field(
        default=None, description="Full name of the presiding judge(s)."
    )
    next_hearing_date: str | None = Field(
        default=None,
        description="ISO-8601 date (YYYY-MM-DD) of the next scheduled hearing, or null.",
    )
    legal_sections: list[str] = Field(
        default_factory=list,
        description="List of Acts/Sections cited, e.g. ['Article 226 of Constitution', 'Section 18 Land Acquisition Act'].",
    )
    summary: str = Field(
        description="A concise 2–4 sentence summary of the judgment's key findings and directions."
    )
    actions: list[ExtractedAction] = Field(
        default_factory=list,
        description="All court-directed actions identified in the judgment.",
    )


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

def build_system_prompt(output_language: str = "English") -> str:
    """Build the system prompt for the AI extractor."""
    prompt = """You are a senior legal analyst specialising in Karnataka High Court judgments.

Your task is to extract ALL court-directed actions and structured metadata from the judgment text
provided by the user. The Karnataka HC uses specific language to issue directions — you must detect
every instance of the following action keywords:

  "Ordered", "Directed", "Disposed", "Issue notice", "Submit report",
  "File affidavit", "Shall forthwith", "Within weeks", "Compliance",
  "Registry shall", "Let", "Placed before", "Next date of hearing"

DEPARTMENT MAPPING RULES (apply in order):
1. If the direction starts with or names "BBMP" → department = "BBMP Legal Cell"
2. If the direction refers to "Registry" or "Registry shall" → department = "Court Registry"
3. If the direction explicitly names "Revenue Department" → department = "Revenue Department"
4. If no explicit department or authority is named → department = "Concerned Authority"

DEADLINE RULES:
- Convert relative expressions like "within four weeks", "within 6 weeks" to ISO dates relative
  to the judgment date if stated; otherwise leave deadline = null.
- "Forthwith" and "immediately" → priority = "high", deadline = null.

OUTPUT RULES:
- Extract source_text verbatim — do NOT paraphrase.
- confidence_score = 1.0 for unambiguous court directions; reduce toward 0.5 for implied actions.
- Deduplicate: do not emit the same action twice.
- If no case number is found, use "UNKNOWN".
"""
    prompt += f"""
LANGUAGE INSTRUCTION:
Your entire JSON response must be in {output_language}.
Translate: action_required, department, summary, source_text.
Do NOT translate: case_number, dates, legal section codes, 
confidence_score, priority values (keep as high/medium/low).
Supported languages: English, Hindi, Kannada.

JSON SCHEMA ADDITIONS:
- "limitation_period": "e.g. '90 days from date of order' or null if not mentioned"
"""
    return prompt

# ---------------------------------------------------------------------------
# Constants — all read from config/environment
# ---------------------------------------------------------------------------

# Maximum characters per page chunk when splitting oversized documents
_CHUNK_SIZE = 12_000  # ~3 000 tokens at 4 chars/token


def _get_gemini_client() -> genai.Client:
    """Return a configured google-genai Client.

    The google-genai SDK does NOT auto-read GEMINI_API_KEY from the environment
    in all versions — we pass it explicitly from settings to be safe.
    """
    settings = get_settings()
    api_key = settings.gemini_api_key
    if not api_key:
        raise ExtractionError(
            "GEMINI_API_KEY is not set in .env. "
            "Add it as: GEMINI_API_KEY=your_key_here"
        )
    return genai.Client(api_key=api_key)


# ---------------------------------------------------------------------------
# Heuristic filter
# ---------------------------------------------------------------------------

#: Karnataka HC action keywords used for page scoring
_ACTION_KEYWORDS: list[str] = [
    "ordered",
    "directed",
    "disposed",
    "issue notice",
    "submit report",
    "file affidavit",
    "shall forthwith",
    "within weeks",
    "compliance",
    "registry shall",
    " let ",
    "placed before",
    "next date of hearing",
    "bbmp",
    "revenue department",
]


def heuristic_filter(text: str) -> str:
    """Reduce document size by keeping only the most relevant pages.

    Algorithm:
      1. Split the full text into pages on the form-feed character ``\\f``;
         if no form-feeds are present, split on every 3 000 characters.
      2. Score each page by counting keyword hits (case-insensitive).
      3. Always keep the last ``min(3, page_count)`` pages (they usually
         contain the operative order).
      4. From the remaining pages, keep the top ``MAX_PAGES_FOR_LLM`` pages
         by score.
      5. Reconstruct the text in the original page order.

    Args:
        text: The raw extracted document text.

    Returns:
        Filtered text containing only the selected pages.
    """
    settings = get_settings()
    max_pages = getattr(settings, "max_pages_for_llm", 20)

    # --- 1. Split into pages ---
    if "\f" in text:
        pages = text.split("\f")
    else:
        chunk_size = 3_000
        pages = [
            text[i : i + chunk_size] for i in range(0, len(text), chunk_size)
        ]

    if not pages:
        return text

    # --- 2. Score pages ---
    scores: list[tuple[int, int]] = []  # (original_index, score)
    lower_keywords = [kw.lower() for kw in _ACTION_KEYWORDS]
    for idx, page in enumerate(pages):
        page_lower = page.lower()
        score = sum(page_lower.count(kw) for kw in lower_keywords)
        scores.append((idx, score))

    # --- 3. Always keep the last 3 pages ---
    tail_count = min(3, len(pages))
    tail_indices = set(range(len(pages) - tail_count, len(pages)))

    # --- 4. Pick top max_pages from the rest ---
    non_tail = [(idx, sc) for idx, sc in scores if idx not in tail_indices]
    non_tail_sorted = sorted(non_tail, key=lambda x: x[1], reverse=True)
    top_indices = {idx for idx, _ in non_tail_sorted[:max_pages]}

    # --- 5. Merge and reconstruct in order ---
    kept_indices = sorted(top_indices | tail_indices)
    logger.info(
        "heuristic_filter: keeping %d/%d pages (indices: %s)",
        len(kept_indices),
        len(pages),
        kept_indices,
    )

    return "\f".join(pages[i] for i in kept_indices)


# ---------------------------------------------------------------------------
# Core extraction
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Retry predicate — only retry on transient/rate-limit errors
# ---------------------------------------------------------------------------

class _RateLimitError(Exception):
    """Sentinel wrapping a 429 so tenacity can target it specifically."""


class _DailyQuotaExhausted(Exception):
    """Raised when limit:0 detected — daily quota gone, no point retrying."""


def _is_daily_quota_exhausted(err_str: str) -> bool:
    """Return True when the 429 response contains limit: 0 (daily cap hit).

    A per-minute limit shows limit: 5 or limit: 15.  A daily cap shows
    limit: 0 inside the quota violations array.
    """
    return "'limit': 0" in err_str or '"limit": 0' in err_str or "limit: 0" in err_str


# ---------------------------------------------------------------------------
# Regex-based fallback extractor
# ---------------------------------------------------------------------------

# Karnataka HC case number patterns: WP/1234/2024, WA 123/2024, CRL.P 456/2024
_CASE_NUMBER_RE = re.compile(
    r"(?:W\.?P\.?|W\.?A\.?|CRL\.?P\.?|CRL\.?A\.?|MFA|RSA|ICA|CRP|WPS|SLP)"
    r"[\s./]*(?:No\.?)?[\s]*[\d]+[/\-][\d]{4}",
    re.IGNORECASE,
)
_VS_RE = re.compile(r"(.{5,80})\s+(?:vs?\.?|versus)\s+(.{5,80})", re.IGNORECASE)
_JUDGE_RE = re.compile(
    r"(?:HON'?BLE|BEFORE|CORAM)[:\s]+(?:MR\.?\s+JUSTICE|MS\.?\s+JUSTICE|JUSTICE)?\s*([A-Z][A-Z .]+)",
    re.IGNORECASE,
)
_DATE_RE = re.compile(
    r"\b(\d{1,2})[\s/-](\w+|\d{1,2})[\s/-](\d{4})\b"
)
_ISO_DATE_RE = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")
_SECTION_RE = re.compile(
    r"(?:Article|Section|Order|Rule|Schedule)\s+\d+[\w\(\)\s,]{{0,40}}"
    r"(?:of the |of |under the )?[A-Z][\w\s]{{3,50}}",
    re.IGNORECASE,
)
_ACTION_TRIGGERS = [
    ("Ordered", "high"), ("Directed", "high"), ("Shall forthwith", "high"),
    ("Issue notice", "medium"), ("Submit report", "medium"), ("File affidavit", "medium"),
    ("Compliance", "medium"), ("Registry shall", "low"), ("Disposed", "low"),
    ("Stand over", "low"), ("Adjourned", "low"),
]
_DEPT_HINTS = {
    "bbmp": "BBMP Legal Cell",
    "revenue": "Revenue Department",
    "registry": "Court Registry",
    "municipal": "Municipal Corporation",
    "police": "Police Department",
    "education": "Education Department",
    "health": "Health Department",
}


def _extract_date_iso(text: str) -> str | None:
    """Return the first recognisable date as ISO-8601, or None."""
    m = _ISO_DATE_RE.search(text)
    if m:
        return m.group(0)
    m = _DATE_RE.search(text)
    if m:
        try:
            return datetime.strptime(m.group(0), "%d %B %Y").strftime("%Y-%m-%d")
        except ValueError:
            pass
    return None


def _guess_department(sentence: str) -> str:
    low = sentence.lower()
    for hint, dept in _DEPT_HINTS.items():
        if hint in low:
            return dept
    return "Concerned Authority"


def _fallback_extract(text: str) -> "ExtractedCase":
    """Regex-based extraction used when Gemini quota is exhausted.

    Produces a low-confidence ExtractedCase so the pipeline can continue.
    Human reviewers should treat these records as drafts.
    """
    print(f"\n[AI] Gemini Quota hit. Activating Regex Fallback Extractor for document...")
    logger.warning(
        "Gemini unavailable — using regex fallback extractor. "
        "Results will have low confidence and require careful human review."
    )

    # --- Case number ---
    case_match = _CASE_NUMBER_RE.search(text)
    case_number = case_match.group(0).strip() if case_match else f"UNKNOWN-{uuid.uuid4().hex[:6].upper()}"

    # --- Parties ---
    parties_involved: str | None = None
    vs_match = _VS_RE.search(text)
    if vs_match:
        parties_involved = f"{vs_match.group(1).strip()} vs {vs_match.group(2).strip()}"

    # --- Judge ---
    judge_name: str | None = None
    judge_match = _JUDGE_RE.search(text)
    if judge_match:
        judge_name = judge_match.group(1).strip()[:80]

    # --- Dates ---
    next_hearing_date = _extract_date_iso(text)

    # --- Legal sections (deduplicated, max 8) ---
    legal_sections = list(dict.fromkeys(
        m.group(0).strip()[:100]
        for m in _SECTION_RE.finditer(text)
    ))[:8]

    # --- Actions: scan for trigger sentences ---
    sentences = re.split(r"(?<=[.;])\s+", text)
    actions: list[ExtractedAction] = []
    seen: set[str] = set()
    for sentence in sentences:
        for trigger, priority in _ACTION_TRIGGERS:
            if trigger.lower() in sentence.lower() and sentence not in seen:
                seen.add(sentence)
                dept = _guess_department(sentence)
                source = sentence.strip()[:300]
                actions.append(ExtractedAction(
                    department=dept,
                    action_required=sentence.strip()[:200],
                    deadline=None,
                    priority=priority,  # type: ignore[arg-type]
                    confidence_score=0.35,
                    limitation_period=None,
                    source_text=source,
                ))
                break  # one action per sentence
        if len(actions) >= 6:
            break

    # Guarantee at least one action
    if not actions:
        actions.append(ExtractedAction(
            department="Concerned Authority",
            action_required="Review judgment and identify required compliance actions.",
            deadline=None,
            priority="medium",
            confidence_score=0.2,
            limitation_period=None,
            source_text=text[:300],
        ))

    word_count = len(text.split())
    summary = (
        f"[Regex extraction — Gemini quota exhausted] "
        f"Document: {word_count} words. Case: {case_number}. "
        f"{len(actions)} potential action(s) identified via keyword matching. "
        "Human review required before approval."
    )

    return ExtractedCase(
        case_number=case_number,
        parties_involved=parties_involved,
        judge_name=judge_name,
        next_hearing_date=next_hearing_date,
        legal_sections=legal_sections,
        summary=summary,
        actions=actions,
    )


@retry(
    retry=retry_if_exception_type((ExtractionError, _RateLimitError)),
    stop=stop_after_attempt(4),
    # max=90s covers the 40s retryDelay the API returns on free tier 429s
    wait=wait_exponential(multiplier=2, min=5, max=90),
    reraise=True,
)
def extract_case_data(text: str, output_language: str = "English") -> ExtractedCase:
    """Extract structured case data from judgment text using Gemini.

    Steps:
      1. Apply :func:`heuristic_filter` to prune irrelevant pages.
      2. Call Gemini with ``response_json_schema=ExtractedCase.model_json_schema()``
         to obtain a natively structured response (no manual JSON parsing).
      3. Log token usage at INFO level.
      4. Persist the raw Gemini response to the ``ai_responses`` Supabase table.

    The function is decorated with ``@retry`` (3 attempts, exponential back-off)
    so transient API errors are handled transparently.

    Args:
        text: Full raw document text (will be filtered internally).

    Returns:
        :class:`ExtractedCase` populated from Gemini's structured output.

    Raises:
        ExtractionError: If all retry attempts fail or the response is invalid.
    """
    settings = get_settings()
    model_name: str = getattr(settings, "gemini_model", "gemini-2.5-flash")

    # Step 1 — heuristic filter
    filtered_text = heuristic_filter(text)
    logger.debug("extract_case_data: filtered text length = %d chars", len(filtered_text))

    # Step 2 — call Gemini with native structured output
    # google-genai v1.x: use response_schema (not response_json_schema),
    # pass the Pydantic class directly (not .model_json_schema() dict)
    client = _get_gemini_client()
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=filtered_text,
            config=genai_types.GenerateContentConfig(
                system_instruction=build_system_prompt(output_language),
                response_mime_type="application/json",
                response_schema=ExtractedCase,
            ),
        )
    except Exception as exc:
        err_str = str(exc)
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            if _is_daily_quota_exhausted(err_str):
                logger.warning(
                    "Gemini daily quota exhausted (limit:0) on model '%s'. "
                    "Activating regex fallback extractor — no retries.",
                    model_name,
                )
                raise _DailyQuotaExhausted(err_str) from exc
            logger.warning(
                "Gemini 429 rate-limit hit on model '%s'. "
                "Tenacity will retry after back-off.",
                model_name,
            )
            raise _RateLimitError(f"Rate limit: {exc}") from exc
        logger.error("Gemini API call failed: %s", exc)
        raise ExtractionError(f"Gemini API error: {exc}") from exc

    # Step 3 — log token usage
    usage = getattr(response, "usage_metadata", None)
    if usage:
        logger.info(
            "Gemini token usage — prompt: %s, candidates: %s, total: %s",
            getattr(usage, "prompt_token_count", "?"),
            getattr(usage, "candidates_token_count", "?"),
            getattr(usage, "total_token_count", "?"),
        )

    # Step 4 — parse structured response
    raw_text: str = response.text or ""
    try:
        case_data = ExtractedCase.model_validate_json(raw_text)
    except Exception as exc:
        logger.error("Failed to parse Gemini response into ExtractedCase: %s\nRaw: %.500s", exc, raw_text)
        raise ExtractionError(f"Schema validation error: {exc}") from exc

    # Step 5 — persist raw response to Supabase (best-effort, non-blocking)
    _persist_ai_response(
        model=model_name,
        raw_response=raw_text,
        case_number=case_data.case_number,
        token_count=getattr(usage, "total_token_count", None) if usage else None,
    )

    return case_data


def _persist_ai_response(
    *,
    model: str,
    raw_response: str,
    case_number: str,
    token_count: int | None,
) -> None:
    """Save the raw Gemini response to the ``ai_responses`` table in Supabase.

    This is a best-effort operation — failures are logged but do NOT bubble up
    so they cannot break the extraction pipeline.

    Args:
        model: Name of the Gemini model used.
        raw_response: The raw JSON string returned by the model.
        case_number: Extracted case number (for correlation).
        token_count: Total tokens consumed, if available.
    """
    try:
        db = get_supabase()
        # Column names must match schema.sql exactly:
        # model_used TEXT, prompt_version TEXT, raw_response JSONB
        import json
        db.table("ai_responses").insert(
            {
                "model_used": model,
                "prompt_version": f"case:{case_number}|tokens:{token_count}",
                "raw_response": json.loads(raw_response) if raw_response else {},
            }
        ).execute()
        logger.debug("Persisted AI response for case %s to Supabase.", case_number)
    except Exception as exc:
        logger.warning("Could not persist AI response to Supabase: %s", exc)


# ---------------------------------------------------------------------------
# Chunked / async extraction for oversized documents
# ---------------------------------------------------------------------------

async def chunk_and_extract(text: str, output_language: str = "English") -> ExtractedCase:
    """Handle oversized documents by splitting into chunks and merging results.

    If ``text`` fits within ``_CHUNK_SIZE`` characters it is processed directly
    by :func:`extract_case_data` (no chunking overhead).  Otherwise the text is
    split and all chunks are processed **concurrently** with ``asyncio.gather``.

    Merging strategy:
      - Metadata (case_number, parties_involved, judge_name, next_hearing_date,
        legal_sections, summary) is taken from the chunk with the highest number
        of extracted actions (most informative chunk).
      - ``actions`` lists are concatenated, then deduplicated on ``source_text``
        to remove any cross-chunk repeats.

    Args:
        text: Full raw document text (may be very large).
        output_language: Language to translate outputs into.

    Returns:
        A single merged :class:`ExtractedCase`.

    Raises:
        ExtractionError: If all chunk extractions fail.
    """
    if len(text) <= _CHUNK_SIZE:
        loop = asyncio.get_event_loop()
        try:
            # 120s timeout to prevent hanging on large documents or slow API
            return await asyncio.wait_for(
                loop.run_in_executor(None, extract_case_data, text, output_language),
                timeout=120.0
            )
        except (asyncio.TimeoutError, _DailyQuotaExhausted, _RateLimitError):
            logger.warning("Gemini timeout/quota/rate-limit exhausted — activating regex fallback.")
            return _fallback_extract(text)

    # Split into chunks without cutting mid-sentence where possible
    chunks = _split_text(text, _CHUNK_SIZE)
    logger.info(
        "chunk_and_extract: document too large (%d chars), splitting into %d chunks",
        len(text),
        len(chunks),
    )

    loop = asyncio.get_event_loop()

    async def _extract_chunk(chunk: str) -> ExtractedCase:
        try:
            return await asyncio.wait_for(
                loop.run_in_executor(None, extract_case_data, chunk, output_language),
                timeout=120.0
            )
        except asyncio.TimeoutError:
            logger.warning("Chunk extraction timed out — will trigger fallback in gather")
            raise _RateLimitError("Timeout")
        except _DailyQuotaExhausted:
            raise  # bubble up to caller below

    try:
        results: list[ExtractedCase] = await asyncio.gather(
            *[_extract_chunk(chunk) for chunk in chunks],
            return_exceptions=False,
        )
        return _merge_results(results)
    except (_DailyQuotaExhausted, _RateLimitError):
        logger.warning("Daily quota/rate-limit exhausted during chunked extraction — using regex fallback on full text.")
        return _fallback_extract(text)


def _split_text(text: str, chunk_size: int) -> list[str]:
    """Split text into chunks of at most ``chunk_size`` characters.

    Attempts to split on paragraph boundaries (``\\n\\n``) first; falls back
    to a hard split if no suitable boundary is found within the last 10 % of
    the chunk window.

    Args:
        text: The full text to split.
        chunk_size: Maximum characters per chunk.

    Returns:
        List of non-empty text chunks.
    """
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        if end < len(text):
            # Try to find a paragraph break near the end of the window
            search_start = max(start, end - chunk_size // 10)
            boundary = text.rfind("\n\n", search_start, end)
            if boundary != -1:
                end = boundary + 2  # include the newlines in the preceding chunk
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end
    return chunks


def _merge_results(results: list[ExtractedCase]) -> ExtractedCase:
    """Merge multiple :class:`ExtractedCase` objects into one.

    Args:
        results: Non-empty list of ExtractedCase instances from parallel chunks.

    Returns:
        A single merged ExtractedCase.

    Raises:
        ExtractionError: If ``results`` is empty.
    """
    if not results:
        raise ExtractionError("No extraction results to merge.")

    # Primary chunk: the one with the most actions (most info-dense)
    primary = max(results, key=lambda r: len(r.actions))

    # Merge legal_sections — deduplicate preserving order
    seen_sections: set[str] = set()
    merged_sections: list[str] = []
    for result in results:
        for section in result.legal_sections:
            if section not in seen_sections:
                seen_sections.add(section)
                merged_sections.append(section)

    # Merge actions — deduplicate on source_text
    seen_sources: set[str] = set()
    merged_actions: list[ExtractedAction] = []
    for result in results:
        for action in result.actions:
            if action.source_text not in seen_sources:
                seen_sources.add(action.source_text)
                merged_actions.append(action)

    logger.info(
        "chunk_and_extract: merged %d chunks → %d unique actions, %d legal sections",
        len(results),
        len(merged_actions),
        len(merged_sections),
    )

    return ExtractedCase(
        case_number=primary.case_number,
        parties_involved=primary.parties_involved,
        judge_name=primary.judge_name,
        next_hearing_date=primary.next_hearing_date,
        legal_sections=merged_sections,
        summary=primary.summary,
        actions=merged_actions,
    )
