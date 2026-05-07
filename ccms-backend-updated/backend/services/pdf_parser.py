"""PDF parser service."""

import os
import logging
from dataclasses import dataclass
from typing import List, Dict, Tuple
from multiprocessing import Pool

import fitz  # PyMuPDF

try:
    import pytesseract
    _TESSERACT_AVAILABLE = True
except ImportError:
    _TESSERACT_AVAILABLE = False

from backend.config import get_settings

logger = logging.getLogger(__name__)

class PDFParseError(Exception):
    """Custom exception raised when PDF parsing fails."""
    pass

@dataclass
class ParsedDocument:
    text: str
    method_used: str        # "pymupdf" | "tesseract"
    page_count: int
    word_count: int
    bboxes: List[Dict]      # [{page, x0, y0, x1, y1, matched_text}]

def extract_text_pymupdf(pdf_path: str) -> Tuple[str, bool]:
    """
    Extracts text from a PDF using PyMuPDF (fast path).
    
    Args:
        pdf_path (str): The path to the PDF file.
        
    Returns:
        Tuple[str, bool]: A tuple containing the combined text and a boolean indicating
                          if the text is valid (avg words per page > threshold).
    """
    settings = get_settings()
    threshold = settings.ocr_word_threshold
    
    text_content = []
    total_words = 0
    
    try:
        with fitz.open(pdf_path) as doc:
            page_count = len(doc)
            if page_count == 0:
                return "", False
                
            for page in doc:
                page_text = page.get_text("text")
                text_content.append(page_text)
                total_words += len(page_text.split())
                
        avg_words = total_words / page_count
        is_valid = avg_words > threshold
        
        return "\n".join(text_content), is_valid
    except Exception as e:
        logger.error(f"PyMuPDF text extraction failed for {pdf_path}: {e}")
        raise PDFParseError(f"Failed to extract text with PyMuPDF: {str(e)}") from e

def _ocr_page(image) -> str:
    """Helper function to run OCR on a single page image."""
    if not _TESSERACT_AVAILABLE:
        return ""
    try:
        return pytesseract.image_to_string(image)
    except Exception as e:
        logger.error(f"pytesseract failed on page: {e}")
        return ""

def run_ocr_fallback(pdf_path: str) -> str:
    """
    Runs OCR on the PDF pages using pdf2image and pytesseract.
    Falls back gracefully if dependencies are not installed.
    """
    try:
        from pdf2image import convert_from_path
    except ImportError:
        logger.warning("pdf2image not installed, skipping OCR fallback.")
        raise PDFParseError("OCR dependencies not installed (pdf2image/tesseract).")

    try:
        images = convert_from_path(pdf_path)
        pool_size = min(4, os.cpu_count() or 1)
        
        with Pool(processes=pool_size) as pool:
            page_texts = pool.map(_ocr_page, images)
            
        return "\n".join(page_texts)
    except Exception as e:
        logger.error(f"OCR fallback failed for {pdf_path}: {e}")
        raise PDFParseError(f"Failed to run OCR fallback: {str(e)}") from e

def extract_bboxes(pdf_path: str, keywords: List[str]) -> List[Dict]:
    """
    Extracts bounding boxes for given keywords using PyMuPDF.
    
    Args:
        pdf_path (str): The path to the PDF file.
        keywords (List[str]): A list of keywords to search for.
        
    Returns:
        List[Dict]: A list of bounding box dictionaries with keys:
                    page, x0, y0, x1, y1, matched_text.
    """
    bboxes = []
    try:
        with fitz.open(pdf_path) as doc:
            for page_num, page in enumerate(doc):
                for keyword in keywords:
                    text_instances = page.search_for(keyword)
                    for inst in text_instances:
                        bboxes.append({
                            "page": page_num + 1,  # 1-indexed page
                            "x0": inst.x0,
                            "y0": inst.y0,
                            "x1": inst.x1,
                            "y1": inst.y1,
                            "matched_text": keyword
                        })
        return bboxes
    except Exception as e:
        logger.error(f"BBox extraction failed for {pdf_path}: {e}")
        raise PDFParseError(f"Failed to extract bounding boxes: {str(e)}") from e

def parse_pdf(pdf_path: str) -> ParsedDocument:
    """
    Orchestrates the fast path and OCR fallback for PDF parsing, and extracts bboxes.
    
    Args:
        pdf_path (str): The path to the PDF file.
        
    Returns:
        ParsedDocument: A dataclass containing the extracted text, method used, and bboxes.
    """
    keywords = [ "Therefore", "Ordered", "Directed to", "Decree", "Compliance",
                "Issue notice", "Submit report", "File affidavit", "Compliance report",
                "shall comply", "is directed", "are directed", "hereby directed",
                "Next date", "adjourned to", "Stand over", "petition is allowed",
                "petition is dismissed", "interim order", "stay granted"]
    
    try:
        # Step 1: Fast path
        text, is_valid = extract_text_pymupdf(pdf_path)
        method_used = "pymupdf"
        
        # Step 2: OCR Fallback if fast path fails
        if not is_valid:
            logger.info(f"Fast path invalid for {pdf_path}. Falling back to OCR.")
            text = run_ocr_fallback(pdf_path)
            method_used = "tesseract"
        
        logger.info(f"Successfully parsed {pdf_path} using {method_used}.")
        
        # Step 3: BBox Extraction
        bboxes = extract_bboxes(pdf_path, keywords)
        
        # Determine page_count and word_count
        try:
            with fitz.open(pdf_path) as doc:
                page_count = len(doc)
        except Exception:
            page_count = 0
            
        word_count = len(text.split())
        
        return ParsedDocument(
            text=text,
            method_used=method_used,
            page_count=page_count,
            word_count=word_count,
            bboxes=bboxes
        )
    except PDFParseError:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during PDF parsing of {pdf_path}: {e}")
        raise PDFParseError(f"Unexpected error: {str(e)}") from e
