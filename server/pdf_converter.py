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
                # Try to extract with character-level information for better formatting detection
                chars = page.chars
                if not chars:
                    continue
                
                # Group characters into lines and detect formatting
                lines_data = extract_formatted_lines(chars)
                
                current_paragraph = []
                
                for line_data in lines_data:
                    if not line_data['text'].strip():
                        # Empty line - paragraph break
                        if current_paragraph:
                            para_text = ' '.join([l['text'] for l in current_paragraph])
                            if len(para_text.strip()) > 8:
                                # Analyze the paragraph for type and formatting
                                para_info = analyze_paragraph(current_paragraph, para_text)
                                structured_content.append(para_info)
                            current_paragraph = []
                        continue
                    
                    # Check if this line should start a new paragraph
                    should_break = should_start_new_paragraph(line_data, current_paragraph)
                    
                    if should_break and current_paragraph:
                        para_text = ' '.join([l['text'] for l in current_paragraph])
                        if len(para_text.strip()) > 8:
                            para_info = analyze_paragraph(current_paragraph, para_text)
                            structured_content.append(para_info)
                        current_paragraph = [line_data]
                    else:
                        current_paragraph.append(line_data)
                
                # Add remaining content
                if current_paragraph:
                    para_text = ' '.join([l['text'] for l in current_paragraph])
                    if len(para_text.strip()) > 8:
                        para_info = analyze_paragraph(current_paragraph, para_text)
                        structured_content.append(para_info)
        
        return structured_content
    
    except Exception as e:
        print(f"pdfplumber extraction failed: {e}", file=sys.stderr)
        return None

def extract_formatted_lines(chars):
    """Extract lines with formatting information from character data"""
    if not chars:
        return []
    
    # Group characters by line (y-coordinate)
    lines = {}
    for char in chars:
        y = round(char['y0'], 1)  # Round to avoid floating point issues
        if y not in lines:
            lines[y] = []
        lines[y].append(char)
    
    # Sort lines by y-coordinate (top to bottom)
    sorted_lines = []
    for y in sorted(lines.keys(), reverse=True):  # Reverse because y increases downward in PDFs
        line_chars = sorted(lines[y], key=lambda c: c['x0'])  # Sort characters left to right
        
        # Combine characters into text with formatting info
        line_text = ''.join([c['text'] for c in line_chars])
        
        # Analyze formatting
        font_sizes = [c.get('size', 12) for c in line_chars if c.get('size')]
        font_names = [c.get('fontname', '') for c in line_chars if c.get('fontname')]
        
        avg_font_size = sum(font_sizes) / len(font_sizes) if font_sizes else 12
        is_bold = any('bold' in str(name).lower() for name in font_names)
        
        sorted_lines.append({
            'text': line_text.strip(),
            'font_size': avg_font_size,
            'is_bold': is_bold,
            'y_position': y,
            'char_count': len(line_chars)
        })
    
    return sorted_lines

def should_start_new_paragraph(line_data, current_paragraph):
    """More conservative paragraph break detection"""
    if not current_paragraph:
        return False
    
    last_line = current_paragraph[-1]
    
    # Only break on significant formatting changes
    significant_font_size_change = abs(line_data['font_size'] - last_line['font_size']) > 2
    bold_change = line_data['is_bold'] != last_line['is_bold']
    
    # Check for content patterns
    text = line_data['text']
    last_text = last_line['text']
    
    # Clear sentence ending followed by new topic
    sentence_end = last_text.rstrip().endswith(('.', '!', '?'))
    starts_capital = text and text[0].isupper()
    
    # Only break for clear new sections
    is_clear_new_section = (
        any(section in text.lower() for section in ['work experience', 'education', 'skills', 'projects']) or
        (contains_date_pattern(text) and any(word in text.lower() for word in ['designer', 'developer', 'engineer'])) or
        (text.endswith(':') and len(text.split()) <= 5)
    )
    
    # Be more conservative - only break on clear indicators
    return (significant_font_size_change or 
            (bold_change and is_clear_new_section) or
            (sentence_end and starts_capital and len(current_paragraph) > 2))

def analyze_paragraph(paragraph_lines, text):
    """Analyze a paragraph to determine its type and formatting"""
    if not paragraph_lines:
        return {'text': text, 'type': 'paragraph', 'formatting': {}}
    
    # Analyze formatting across the paragraph
    font_sizes = [line['font_size'] for line in paragraph_lines]
    is_bold = any(line['is_bold'] for line in paragraph_lines)
    avg_font_size = sum(font_sizes) / len(font_sizes)
    
    # Determine paragraph type
    is_heading = detect_advanced_heading(text, paragraph_lines)
    
    return {
        'text': text,
        'type': 'heading' if is_heading else 'paragraph',
        'level': get_heading_level(text) if is_heading else None,
        'formatting': {
            'is_bold': is_bold,
            'font_size': avg_font_size,
            'line_count': len(paragraph_lines)
        }
    }

def detect_advanced_heading(text, lines):
    """More conservative heading detection to match PDF structure better"""
    if not text or len(text) > 150:  # Long text is unlikely to be a heading
        return False
    
    # Get formatting info
    avg_font_size = sum(line['font_size'] for line in lines) / len(lines)
    is_bold = any(line['is_bold'] for line in lines)
    
    # Major section headers (these should definitely be headings)
    major_sections = ['work experience', 'experience', 'education', 'skills', 'projects', 'summary', 'objective']
    is_major_section = any(section in text.lower() for section in major_sections)
    
    # Name and contact info (top of resume)
    is_name_or_title = (
        len(text.split()) <= 3 and  # Short text
        (text.istitle() or text.isupper()) and  # Proper case or all caps
        len(text) < 50 and  # Not too long
        not any(word in text.lower() for word in ['with', 'and', 'the', 'for', 'in', 'at'])  # Not descriptive text
    )
    
    # Job titles with dates (should be headings)
    has_recent_date = any(str(year) in text for year in range(2020, 2025))
    is_job_title = (
        has_recent_date and 
        any(word in text.lower() for word in ['designer', 'developer', 'manager', 'engineer', 'analyst']) and
        len(text.split()) <= 12
    )
    
    # Very strict criteria - only clear headings
    definite_heading = (
        is_major_section or  # Major resume sections
        is_name_or_title or  # Name/title at top
        is_job_title or      # Job titles with dates
        (text.endswith(':') and len(text.split()) <= 5)  # Short text ending with colon
    )
    
    # Additional check - must have some formatting distinction
    has_formatting_distinction = (
        is_bold or 
        avg_font_size > 12.5 or
        text.isupper()
    )
    
    return definite_heading and has_formatting_distinction

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
    """Create professionally formatted Word document with advanced formatting preservation"""
    try:
        doc = Document()
        
        # Set document margins and page layout to match typical resume format
        section = doc.sections[0]
        section.page_height = Inches(11)
        section.page_width = Inches(8.5)
        section.left_margin = Inches(0.7)
        section.right_margin = Inches(0.7)
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        
        # Configure styles
        configure_document_styles(doc)
        
        # Add content with advanced formatting
        for item in structured_content:
            if not item['text'].strip():
                continue
                
            clean_text = item['text'].strip()
            clean_text = ' '.join(clean_text.split())  # Remove extra whitespace
            
            if len(clean_text) < 3:  # Skip very short fragments
                continue
            
            formatting = item.get('formatting', {})
            
            if item['type'] == 'heading':
                create_formatted_heading(doc, clean_text, item.get('level', 2), formatting)
            else:
                create_formatted_paragraph(doc, clean_text, formatting)
        
        # Ensure we have content
        if len(doc.paragraphs) == 0:
            doc.add_paragraph("No text content could be extracted from the PDF.")
        
        # Save the document
        doc.save(output_path)
        
        # Count elements
        heading_count = len([item for item in structured_content if item['type'] == 'heading'])
        para_count = len([item for item in structured_content if item['type'] == 'paragraph'])
        print(f"Word document created with {len(doc.paragraphs)} elements ({heading_count} headings, {para_count} paragraphs)", file=sys.stderr)
        return True
        
    except Exception as e:
        print(f"Word document creation failed: {e}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return False

def configure_document_styles(doc):
    """Configure document styles for professional appearance"""
    from docx.enum.style import WD_STYLE_TYPE
    
    # Normal style
    normal_style = doc.styles['Normal']
    normal_font = normal_style.font
    normal_font.name = 'Calibri'  # More modern font
    normal_font.size = Pt(11)
    
    normal_paragraph_format = normal_style.paragraph_format
    normal_paragraph_format.space_after = Pt(6)
    normal_paragraph_format.line_spacing = 1.15
    normal_paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT

def create_formatted_heading(doc, text, level, formatting):
    """Create a heading with proper formatting"""
    # Determine heading level and styling
    if level == 1 or any(word in text.lower() for word in ['experience', 'education', 'skills', 'summary']):
        heading_level = 1
        space_before = Pt(16)
        space_after = Pt(8)
    else:
        heading_level = 2
        space_before = Pt(10)
        space_after = Pt(4)
    
    para = doc.add_heading(text, level=heading_level)
    para.paragraph_format.space_before = space_before
    para.paragraph_format.space_after = space_after
    
    # Apply additional formatting based on original
    for run in para.runs:
        run.font.name = 'Calibri'
        run.bold = True
        
        # Adjust font size based on original
        original_size = formatting.get('font_size', 14)
        if original_size > 14:
            run.font.size = Pt(16)
        elif original_size > 12:
            run.font.size = Pt(14)
        else:
            run.font.size = Pt(13)

def create_formatted_paragraph(doc, text, formatting):
    """Create a paragraph with preserved formatting"""
    para = doc.add_paragraph()
    
    # Less aggressive formatting - focus on readability
    if text.isupper() and len(text) < 50:
        # Short all caps - likely important text
        run = para.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(11)
        run.bold = True
    elif formatting.get('is_bold', False):
        # Actually bold in original
        run = para.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(11)
        run.bold = True
    else:
        # Regular text - keep it simple for better readability
        run = para.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(11)
    
    # Better paragraph spacing for readability
    para.paragraph_format.space_after = Pt(6)
    para.paragraph_format.line_spacing = 1.15
    para.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY



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