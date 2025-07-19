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
    """Extract text using pdfplumber with advanced formatting preservation"""
    try:
        paragraphs = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                # Extract text with layout information
                text = page.extract_text(layout=True)
                if not text:
                    continue
                
                # Process text more intelligently for paragraph detection
                lines = text.split('\n')
                current_paragraph = []
                
                for i, line in enumerate(lines):
                    line = line.strip()
                    
                    if not line:
                        # Empty line - definitely a paragraph break
                        if current_paragraph:
                            paragraph_text = ' '.join(current_paragraph)
                            if len(paragraph_text.strip()) > 15:  # Ignore very short lines
                                paragraphs.append(paragraph_text)
                            current_paragraph = []
                    else:
                        # Check if this line should start a new paragraph
                        should_break = False
                        
                        # Look for sentence endings that suggest paragraph breaks
                        if current_paragraph and (
                            current_paragraph[-1].endswith('.') or 
                            current_paragraph[-1].endswith('!') or 
                            current_paragraph[-1].endswith('?') or
                            current_paragraph[-1].endswith(':')
                        ):
                            # Check if current line looks like start of new paragraph
                            if (line[0].isupper() and len(line) > 10) or line.startswith('•') or line.startswith('-'):
                                should_break = True
                        
                        if should_break:
                            paragraph_text = ' '.join(current_paragraph)
                            if len(paragraph_text.strip()) > 15:
                                paragraphs.append(paragraph_text)
                            current_paragraph = [line]
                        else:
                            current_paragraph.append(line)
                
                # Add remaining paragraph
                if current_paragraph:
                    paragraph_text = ' '.join(current_paragraph)
                    if len(paragraph_text.strip()) > 15:
                        paragraphs.append(paragraph_text)
        
        # Clean up paragraphs - remove duplicates and very short ones
        cleaned_paragraphs = []
        for para in paragraphs:
            para = para.strip()
            if len(para) > 20 and para not in cleaned_paragraphs:  # Avoid duplicates
                cleaned_paragraphs.append(para)
        
        return cleaned_paragraphs
    
    except Exception as e:
        print(f"pdfplumber extraction failed: {e}", file=sys.stderr)
        return None

def extract_text_with_pymupdf(pdf_path):
    """Advanced fallback extraction using PyMuPDF with better block detection"""
    try:
        paragraphs = []
        doc = fitz.open(pdf_path)
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            
            # Get text blocks with positioning - this preserves layout better
            blocks = page.get_text("dict")["blocks"]
            
            for block in blocks:
                if "lines" in block and block.get("type") == 0:  # Text blocks only
                    block_lines = []
                    
                    for line in block["lines"]:
                        line_text = ""
                        for span in line["spans"]:
                            if span.get("text", "").strip():
                                line_text += span["text"]
                        
                        if line_text.strip():
                            block_lines.append(line_text.strip())
                    
                    if block_lines:
                        # Each block is typically a paragraph in PyMuPDF
                        paragraph_text = ' '.join(block_lines)
                        if len(paragraph_text.strip()) > 20:  # Only substantial paragraphs
                            paragraphs.append(paragraph_text)
        
        doc.close()
        
        # Remove duplicates while preserving order
        seen = set()
        unique_paragraphs = []
        for para in paragraphs:
            if para not in seen:
                seen.add(para)
                unique_paragraphs.append(para)
        
        return unique_paragraphs
    
    except Exception as e:
        print(f"PyMuPDF extraction failed: {e}", file=sys.stderr)
        return None

def create_word_document(paragraphs, output_path):
    """Create professionally formatted Word document with proper styling"""
    try:
        doc = Document()
        
        # Set document margins and page layout like a professional document
        section = doc.sections[0]
        section.page_height = Inches(11)
        section.page_width = Inches(8.5)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        
        # Create a professional document style
        style = doc.styles['Normal']
        font = style.font
        font.name = 'Times New Roman'
        font.size = Pt(12)
        
        paragraph_format = style.paragraph_format
        paragraph_format.space_after = Pt(12)  # Space after paragraphs
        paragraph_format.line_spacing = 1.15    # Line spacing
        paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT  # Left align (more readable than justify)
        
        # Add paragraphs with proper formatting
        for i, paragraph_text in enumerate(paragraphs):
            if not paragraph_text.strip():
                continue
            
            # Clean up the paragraph text
            clean_text = paragraph_text.strip()
            clean_text = ' '.join(clean_text.split())  # Remove extra whitespace
            
            if len(clean_text) < 10:  # Skip very short fragments
                continue
                
            # Add paragraph
            para = doc.add_paragraph(clean_text)
            
            # Apply consistent formatting
            para.paragraph_format.space_after = Pt(12)
            para.paragraph_format.line_spacing = 1.15
            para.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
            
            # Ensure proper font for all runs
            for run in para.runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(12)
        
        # Ensure we have content
        if len(doc.paragraphs) == 0:
            doc.add_paragraph("No text content could be extracted from the PDF.")
        
        # Save the document
        doc.save(output_path)
        print(f"Word document created with {len(doc.paragraphs)} paragraphs", file=sys.stderr)
        return True
        
    except Exception as e:
        print(f"Word document creation failed: {e}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
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