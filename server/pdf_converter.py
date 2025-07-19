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
    """Extract text using pdfplumber with advanced formatting and structure preservation"""
    try:
        structured_content = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                # Extract text with layout preservation
                text = page.extract_text(layout=True, x_tolerance=3, y_tolerance=3)
                if not text:
                    continue
                
                lines = text.split('\n')
                current_paragraph = []
                
                for i, line in enumerate(lines):
                    line = line.strip()
                    
                    if not line:
                        # Empty line indicates paragraph break
                        if current_paragraph:
                            paragraph_text = ' '.join(current_paragraph)
                            if len(paragraph_text.strip()) > 10:
                                # Detect if this might be a heading based on characteristics
                                is_heading = detect_heading(paragraph_text, current_paragraph)
                                structured_content.append({
                                    'text': paragraph_text,
                                    'type': 'heading' if is_heading else 'paragraph',
                                    'level': get_heading_level(paragraph_text) if is_heading else None
                                })
                            current_paragraph = []
                    else:
                        # Check for natural paragraph breaks
                        should_break = False
                        
                        if current_paragraph:
                            last_line = current_paragraph[-1]
                            # Detect paragraph breaks by sentence endings and capitalization
                            if (last_line.endswith('.') or last_line.endswith('!') or 
                                last_line.endswith('?') or last_line.endswith(':')):
                                if line[0].isupper() and len(line) > 5:
                                    should_break = True
                            
                            # Detect job titles, dates, or section headers
                            if (is_likely_heading_or_title(line) or 
                                contains_date_pattern(line) or
                                is_section_break(line, last_line)):
                                should_break = True
                        
                        if should_break:
                            paragraph_text = ' '.join(current_paragraph)
                            if len(paragraph_text.strip()) > 10:
                                is_heading = detect_heading(paragraph_text, current_paragraph)
                                structured_content.append({
                                    'text': paragraph_text,
                                    'type': 'heading' if is_heading else 'paragraph',
                                    'level': get_heading_level(paragraph_text) if is_heading else None
                                })
                            current_paragraph = [line]
                        else:
                            current_paragraph.append(line)
                
                # Add remaining content
                if current_paragraph:
                    paragraph_text = ' '.join(current_paragraph)
                    if len(paragraph_text.strip()) > 10:
                        is_heading = detect_heading(paragraph_text, current_paragraph)
                        structured_content.append({
                            'text': paragraph_text,
                            'type': 'heading' if is_heading else 'paragraph',
                            'level': get_heading_level(paragraph_text) if is_heading else None
                        })
        
        return structured_content
    
    except Exception as e:
        print(f"pdfplumber extraction failed: {e}", file=sys.stderr)
        return None

def detect_heading(text, lines):
    """Detect if text is likely a heading based on various criteria"""
    if not text or len(text) > 200:  # Very long text is unlikely to be a heading
        return False
    
    # Check for common heading patterns
    heading_indicators = [
        text.isupper(),  # ALL CAPS
        len(text.split()) <= 8,  # Short phrases
        any(word in text.lower() for word in ['experience', 'education', 'skills', 'projects', 'work', 'employment']),
        text.endswith(':'),  # Ends with colon
        any(char.isdigit() for char in text) and ('20' in text),  # Contains years
    ]
    
    return sum(heading_indicators) >= 2

def get_heading_level(text):
    """Determine heading level based on content"""
    if any(word in text.lower() for word in ['experience', 'education', 'skills']):
        return 1
    elif any(char.isdigit() for char in text) and ('20' in text):
        return 2
    else:
        return 2

def is_likely_heading_or_title(line):
    """Check if line looks like a job title or section header"""
    title_patterns = [
        'designer', 'developer', 'engineer', 'manager', 'analyst', 'specialist',
        'experience', 'education', 'skills', 'projects', 'work history'
    ]
    return any(pattern in line.lower() for pattern in title_patterns)

def contains_date_pattern(line):
    """Check if line contains date patterns"""
    import re
    date_patterns = [
        r'\b(19|20)\d{2}\b',  # Years
        r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b',  # Months
        r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'  # Date formats
    ]
    return any(re.search(pattern, line, re.IGNORECASE) for pattern in date_patterns)

def is_section_break(current_line, previous_line):
    """Determine if there should be a section break"""
    if len(current_line) < len(previous_line) * 0.5:  # Much shorter line
        return True
    if current_line.isupper() and len(current_line) < 50:
        return True
    return False

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

def create_word_document(structured_content, output_path):
    """Create professionally formatted Word document with proper styling and structure"""
    try:
        doc = Document()
        
        # Set document margins and page layout
        section = doc.sections[0]
        section.page_height = Inches(11)
        section.page_width = Inches(8.5)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        
        # Configure Normal style
        normal_style = doc.styles['Normal']
        normal_font = normal_style.font
        normal_font.name = 'Times New Roman'
        normal_font.size = Pt(12)
        
        normal_paragraph_format = normal_style.paragraph_format
        normal_paragraph_format.space_after = Pt(6)
        normal_paragraph_format.line_spacing = 1.15
        normal_paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        
        # Add content with proper formatting based on type
        for item in structured_content:
            if not item['text'].strip():
                continue
                
            clean_text = item['text'].strip()
            clean_text = ' '.join(clean_text.split())  # Remove extra whitespace
            
            if len(clean_text) < 5:  # Skip very short fragments
                continue
            
            if item['type'] == 'heading':
                # Create heading with appropriate formatting
                level = item.get('level', 2)
                if level == 1:
                    # Main section headings
                    para = doc.add_heading(clean_text, level=1)
                    para.paragraph_format.space_before = Pt(18)
                    para.paragraph_format.space_after = Pt(12)
                else:
                    # Subsection headings or job titles
                    para = doc.add_heading(clean_text, level=2)
                    para.paragraph_format.space_before = Pt(12)
                    para.paragraph_format.space_after = Pt(6)
                
                # Make sure heading font is consistent
                for run in para.runs:
                    run.font.name = 'Times New Roman'
                    run.bold = True
            else:
                # Regular paragraph
                para = doc.add_paragraph()
                
                # Check if paragraph contains formatting cues
                if clean_text.isupper() and len(clean_text) < 100:
                    # Short all-caps text - make it bold
                    run = para.add_run(clean_text)
                    run.font.name = 'Times New Roman'
                    run.font.size = Pt(12)
                    run.bold = True
                else:
                    # Regular text with potential bold keywords
                    run = para.add_run(clean_text)
                    run.font.name = 'Times New Roman'
                    run.font.size = Pt(12)
                
                # Paragraph formatting
                para.paragraph_format.space_after = Pt(6)
                para.paragraph_format.line_spacing = 1.15
                para.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        
        # Ensure we have content
        if len(doc.paragraphs) == 0:
            doc.add_paragraph("No text content could be extracted from the PDF.")
        
        # Save the document
        doc.save(output_path)
        print(f"Word document created with {len(doc.paragraphs)} elements ({len([item for item in structured_content if item['type'] == 'heading'])} headings)", file=sys.stderr)
        return True
        
    except Exception as e:
        print(f"Word document creation failed: {e}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return False

def convert_pdf_to_word(input_path, output_path):
    """Main conversion function with enhanced structure preservation"""
    try:
        # Check if file exists and is readable
        if not os.path.exists(input_path):
            return {"success": False, "error": "PDF file not found"}
        
        # Try pdfplumber first (better for structured text extraction)
        structured_content = extract_text_with_pdfplumber(input_path)
        
        if not structured_content:
            # Fallback to PyMuPDF - convert to structured format
            paragraphs = extract_text_with_pymupdf(input_path)
            if paragraphs:
                structured_content = []
                for para in paragraphs:
                    structured_content.append({
                        'text': para,
                        'type': 'heading' if detect_heading(para, [para]) else 'paragraph',
                        'level': 2
                    })
        
        if not structured_content:
            return {"success": False, "error": "No text found in PDF. The PDF may be image-based or encrypted."}
        
        # Filter out very short content
        meaningful_content = []
        for item in structured_content:
            if len(item['text'].strip()) > 8:  # Include substantial content
                meaningful_content.append(item)
        
        if not meaningful_content:
            return {"success": False, "error": "No substantial text content found in PDF"}
        
        # Create Word document with structure
        if create_word_document(meaningful_content, output_path):
            headings_count = len([item for item in meaningful_content if item['type'] == 'heading'])
            paragraphs_count = len([item for item in meaningful_content if item['type'] == 'paragraph'])
            return {
                "success": True, 
                "message": f"Successfully converted PDF to Word. Created {headings_count} headings and {paragraphs_count} paragraphs."
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