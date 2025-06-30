import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import re
import nltk
import gc
import tempfile
import os
from fastapi import UploadFile, HTTPException
from typing import Optional
import aiofiles

# Download punkt only if needed, quietly
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

class NoteProcessor:
    """Service for processing uploaded files and extracting text content"""
    
    def __init__(self):
        self.supported_types = {
            'application/pdf': self._process_pdf,
            'image/jpeg': self._process_image,
            'image/jpg': self._process_image,
            'image/png': self._process_image,
            'text/plain': self._process_text,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': self._process_docx
        }
    
    async def process_file(self, file: UploadFile) -> str:
        """Process uploaded file and return extracted text"""
        if file.content_type not in self.supported_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {file.content_type}"
            )
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            try:
                # Read and save file content
                content = await file.read()
                temp_file.write(content)
                temp_file.flush()
                
                # Process based on file type
                processor = self.supported_types[file.content_type]
                extracted_text = await processor(temp_file.name)
                
                # Clean the extracted text
                cleaned_text = self._clean_notes(extracted_text)
                return cleaned_text
                
            finally:
                # Clean up temp file
                os.unlink(temp_file.name)
                await file.seek(0)  # Reset file pointer
    
    async def _process_pdf(self, file_path: str) -> str:
        """Process PDF file - try text extraction first, then OCR if needed"""
        try:
            # First try to extract text directly
            text = self._extract_pdf_text(file_path)
            
            # If no text or very little text, use OCR
            if not text or len(text.strip()) < 100:
                text = self._extract_text_from_scanned_pdf(file_path)
            
            return text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF processing error: {str(e)}")
    
    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text directly from PDF (for text-based PDFs)"""
        text = []
        with fitz.open(file_path) as pdf_document:
            for page in pdf_document:
                text.append(page.get_text())
        return "\n".join(text)
    
    def _extract_text_from_scanned_pdf(self, file_path: str) -> str:
        """Extract text from scanned PDF using OCR"""
        full_text = []
        with fitz.open(file_path) as pdf_document:
            for page in pdf_document:
                full_text.append(self._process_page_ocr(page))
        return "\n".join(full_text)
    
    def _process_page_ocr(self, page) -> str:
        """Process a single PDF page with OCR"""
        try:
            pix = page.get_pixmap()
            img_bytes = pix.tobytes("ppm")
            img = Image.open(io.BytesIO(img_bytes)).convert('L')
            text = pytesseract.image_to_string(img, timeout=30)
            return text
        finally:
            del pix, img_bytes, img
            gc.collect()
    
    async def _process_image(self, file_path: str) -> str:
        """Process image file with OCR"""
        try:
            img = Image.open(file_path).convert('L')
            text = pytesseract.image_to_string(img, timeout=30)
            return text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image processing error: {str(e)}")
    
    async def _process_text(self, file_path: str) -> str:
        """Process plain text file"""
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                return await f.read()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Text file processing error: {str(e)}")
    
    async def _process_docx(self, file_path: str) -> str:
        """Process Word document"""
        try:
            from docx import Document
            doc = Document(file_path)
            text = []
            for paragraph in doc.paragraphs:
                text.append(paragraph.text)
            return "\n".join(text)
        except ImportError:
            raise HTTPException(status_code=500, detail="python-docx not installed")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DOCX processing error: {str(e)}")
    
    def _clean_notes(self, raw_text: str) -> str:
        """Clean extracted text using your existing cleaning functions"""
        text = self._remove_empty_lines(raw_text)
        text = self._fix_line_breaks(text)
        text = self._remove_page_artifacts(text)
        text = self._normalize_whitespace(text)
        text = self._tokenize_sentences(text)
        return text
    
    def _remove_empty_lines(self, text: str) -> str:
        lines = text.split('\n')
        return '\n'.join([line.strip() for line in lines if line.strip()])
    
    def _fix_line_breaks(self, text: str) -> str:
        return re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    
    def _remove_page_artifacts(self, text: str) -> str:
        lines = text.split('\n')
        cleaned = []
        for line in lines:
            if re.match(r'Page \d+', line):
                continue
            if "Confidential" in line or "Lecture Notes" in line:
                continue
            cleaned.append(line)
        return '\n'.join(cleaned)
    
    def _normalize_whitespace(self, text: str) -> str:
        return re.sub(r'\s+', ' ', text).strip()
    
    def _tokenize_sentences(self, text: str) -> str:
        sentences = nltk.sent_tokenize(text)
        return ' '.join(sentences)