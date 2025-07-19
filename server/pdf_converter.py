#!/usr/bin/env python3
"""
Professional PDF to Word converter using pdfplumber and python-docx
Extracts text with proper formatting and structure preservation
"""

import os
import sys
import json
import pdfplumber
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
import fitz  # PyMuPDF
import tempfile
import traceback

def extract_text_with_pdfplumber(pdf_path):
    """Extract text using pdfplumber with formatting preservation"""
    try:
        paragraphs = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                # Extract text with layout information
                text = page.extract_text()
                if not text:
                    continue
                
                # Split into lines and process
                lines = text.split('\n')
                current_paragraph = []
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        # Empty line indicates paragraph break
                        if current_paragraph:
                            paragraphs.append(' '.join(current_paragraph))
                            current_paragraph = []
                    else:
                        current_paragraph.append(line)
                
                # Add remaining paragraph
                if current_paragraph:
                    paragraphs.append(' '.join(current_paragraph))
        
        return paragraphs
    
    except Exception as e:
        print(f"pdfplumber extraction failed: {e}", file=sys.stderr)
        return None

def extract_text_with_pymupdf(pdf_path):
    """Fallback extraction using PyMuPDF"""
    try:
        paragraphs = []
        doc = fitz.open(pdf_path)
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            
            # Get text blocks with positioning
            blocks = page.get_text("dict")["blocks"]
            
            for block in blocks:
                if "lines" in block:
                    block_text = []
                    for line in block["lines"]:
                        line_text = ""
                        for span in line["spans"]:
                            line_text += span["text"]
                        if line_text.strip():
                            block_text.append(line_text.strip())
                    
                    if block_text:
                        paragraphs.append(' '.join(block_text))
        
        doc.close()
        return paragraphs
    
    except Exception as e:
        print(f"PyMuPDF extraction failed: {e}", file=sys.stderr)
        return None

def create_word_document(paragraphs, output_path):
    """Create properly formatted Word document"""
    try:
        doc = Document()
        
        # Set document margins and style
        section = doc.sections[0]
        section.page_height = Inches(11)
        section.page_width = Inches(8.5)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        
        # Add paragraphs with proper formatting
        for i, paragraph_text in enumerate(paragraphs):
            if not paragraph_text.strip():
                continue
                
            para = doc.add_paragraph()
            run = para.add_run(paragraph_text.strip())
            
            # Set font and formatting
            run.font.name = 'Times New Roman'
            run.font.size = Pt(12)
            
            # Add spacing between paragraphs
            para.paragraph_format.space_after = Pt(6)
            para.paragraph_format.line_spacing = 1.15
            
            # Justify text
            para.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        
        # Save the document
        doc.save(output_path)
        return True
        
    except Exception as e:
        print(f"Word document creation failed: {e}", file=sys.stderr)
        return False

def convert_pdf_to_word(input_path, output_path):
    """Main conversion function"""
    try:
        # Check if file exists and is readable
        if not os.path.exists(input_path):
            return {"success": False, "error": "PDF file not found"}
        
        # Try pdfplumber first (better for text extraction)
        paragraphs = extract_text_with_pdfplumber(input_path)
        
        if not paragraphs:
            # Fallback to PyMuPDF
            paragraphs = extract_text_with_pymupdf(input_path)
        
        if not paragraphs:
            return {"success": False, "error": "No text found in PDF. The PDF may be image-based or encrypted."}
        
        # Filter out very short paragraphs (likely headers/footers)
        meaningful_paragraphs = []
        for para in paragraphs:
            if len(para.strip()) > 10:  # Only include substantial paragraphs
                meaningful_paragraphs.append(para)
        
        if not meaningful_paragraphs:
            return {"success": False, "error": "No substantial text content found in PDF"}
        
        # Create Word document
        if create_word_document(meaningful_paragraphs, output_path):
            return {
                "success": True, 
                "message": f"Successfully converted PDF to Word. Extracted {len(meaningful_paragraphs)} paragraphs."
            }
        else:
            return {"success": False, "error": "Failed to create Word document"}
    
    except Exception as e:
        error_msg = f"Conversion failed: {str(e)}"
        print(f"Error in convert_pdf_to_word: {error_msg}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return {"success": False, "error": error_msg}

def main():
    """Command line interface"""
    if len(sys.argv) != 3:
        print(json.dumps({"success": False, "error": "Usage: python pdf_converter.py <input.pdf> <output.docx>"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    result = convert_pdf_to_word(input_path, output_path)
    print(json.dumps(result))

if __name__ == "__main__":
    main()