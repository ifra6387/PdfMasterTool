#!/usr/bin/env python3
"""
Advanced PDF to HTML converter with OCR support for scanned documents
Preserves layout, images, fonts, and formatting like professional tools
"""

import sys
import json
import os
import base64
import io
from pathlib import Path
import tempfile
import traceback

def convert_pdf_to_html_professional(input_path, output_path):
    """
    Convert PDF to HTML with professional layout preservation and OCR support
    """
    try:
        import fitz  # PyMuPDF
        import pytesseract
        from PIL import Image
        import cv2
        import numpy as np
        
        # Open PDF document
        pdf_doc = fitz.open(input_path)
        
        # Get page count before processing
        total_pages = len(pdf_doc)
        
        # Generate HTML content
        html_content = generate_html_structure()
        page_contents = []
        
        for page_num in range(total_pages):
            page = pdf_doc[page_num]
            page_html = process_page_advanced(page, page_num)
            page_contents.append(page_html)
        
        # Close document after processing
        pdf_doc.close()
        
        # Combine all pages
        html_content += "\n".join(page_contents)
        html_content += generate_html_footer()
        
        # Save HTML file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(json.dumps({
            "success": True,
            "message": f"PDF converted to HTML with {total_pages} pages. Layout and images preserved."
        }))
        return True
        
    except ImportError as e:
        # Fallback to alternative method
        return convert_with_pdfplumber_fallback(input_path, output_path)
    
    except Exception as e:
        print(f"Professional conversion failed: {e}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return convert_with_pdfplumber_fallback(input_path, output_path)

def process_page_advanced(page, page_num):
    """
    Process individual page with advanced text and image extraction
    """
    try:
        import fitz
        import pytesseract
        from PIL import Image
        import cv2
        import numpy as np
        
        page_html = f'<div class="pdf-page" id="page-{page_num + 1}">\n'
        page_html += f'<h2 class="page-header">Page {page_num + 1}</h2>\n'
        
        # Get page dimensions
        rect = page.rect
        page_width = rect.width
        page_height = rect.height
        
        # Extract text blocks with positioning
        text_blocks = page.get_text("dict")
        
        # Check if page has readable text
        has_text = any(block.get("lines", []) for block in text_blocks.get("blocks", []))
        
        if has_text:
            # Process text-based content
            page_html += process_text_blocks(text_blocks, page_width, page_height)
        else:
            # Handle scanned/image-based PDF with OCR
            page_html += process_scanned_page_ocr(page, page_num)
        
        # Extract and embed images
        page_html += extract_page_images(page, page_num)
        
        page_html += '</div>\n'
        return page_html
        
    except Exception as e:
        print(f"Page processing failed: {e}", file=sys.stderr)
        return f'<div class="pdf-page"><p>Error processing page {page_num + 1}</p></div>\n'

def process_text_blocks(text_blocks, page_width, page_height):
    """
    Process text blocks with position and formatting preservation
    """
    html_content = '<div class="text-content">\n'
    
    for block in text_blocks.get("blocks", []):
        if "lines" not in block:
            continue
            
        for line in block["lines"]:
            if not line.get("spans"):
                continue
            
            # Calculate relative positioning
            bbox = line["bbox"]
            x_pos = (bbox[0] / page_width) * 100
            y_pos = (bbox[1] / page_height) * 100
            
            line_html = f'<div class="text-line" style="position: absolute; left: {x_pos:.1f}%; top: {y_pos:.1f}%;">'
            
            for span in line["spans"]:
                text = span.get("text", "").strip()
                if not text:
                    continue
                
                # Extract font information
                font_size = span.get("size", 12)
                font_family = span.get("font", "Arial")
                flags = span.get("flags", 0)
                
                # Determine styling
                styles = []
                styles.append(f"font-size: {font_size}px")
                styles.append(f"font-family: '{font_family}', Arial, sans-serif")
                
                if flags & 2**4:  # Bold
                    styles.append("font-weight: bold")
                if flags & 2**1:  # Italic
                    styles.append("font-style: italic")
                
                style_str = "; ".join(styles)
                line_html += f'<span style="{style_str}">{escape_html(text)}</span>'
            
            line_html += '</div>\n'
            html_content += line_html
    
    html_content += '</div>\n'
    return html_content

def process_scanned_page_ocr(page, page_num):
    """
    Process scanned PDF page using OCR with Tesseract
    """
    try:
        import fitz
        import pytesseract
        from PIL import Image
        import cv2
        import numpy as np
        
        # Convert page to image
        mat = fitz.Matrix(2.0, 2.0)  # High resolution for better OCR
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        
        # Convert to PIL Image
        pil_image = Image.open(io.BytesIO(img_data))
        
        # Convert to OpenCV format for preprocessing
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        # Preprocess image for better OCR
        gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
        
        # Apply threshold to get better text detection
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Noise removal
        kernel = np.ones((1, 1), np.uint8)
        opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # Convert back to PIL
        processed_image = Image.fromarray(opening)
        
        # Perform OCR with detailed configuration
        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?@#$%^&*()_+-=[]{}|;:"\<>?/~` '
        
        # Get OCR data with bounding boxes
        ocr_data = pytesseract.image_to_data(processed_image, config=custom_config, output_type=pytesseract.Output.DICT)
        
        html_content = '<div class="ocr-content">\n'
        html_content += f'<p class="ocr-notice"><em>Content extracted using OCR from scanned page {page_num + 1}</em></p>\n'
        
        # Process OCR results
        current_line = ""
        current_line_top = None
        
        for i in range(len(ocr_data['text'])):
            text = ocr_data['text'][i].strip()
            conf = int(ocr_data['conf'][i])
            
            if text and conf > 30:  # Only include text with reasonable confidence
                top = ocr_data['top'][i]
                
                # Group words into lines
                if current_line_top is None or abs(top - current_line_top) > 10:
                    if current_line:
                        html_content += f'<p class="ocr-line">{current_line.strip()}</p>\n'
                    current_line = text + " "
                    current_line_top = top
                else:
                    current_line += text + " "
        
        # Add final line
        if current_line:
            html_content += f'<p class="ocr-line">{current_line.strip()}</p>\n'
        
        html_content += '</div>\n'
        return html_content
        
    except Exception as e:
        print(f"OCR processing failed: {e}", file=sys.stderr)
        return f'<div class="error"><p>Failed to process scanned page {page_num + 1} with OCR</p></div>\n'

def extract_page_images(page, page_num):
    """
    Extract and embed images from PDF page
    """
    try:
        import fitz
        
        html_content = ""
        image_list = page.get_images()
        
        for img_index, img in enumerate(image_list):
            try:
                # Get image data
                xref = img[0]
                pix = fitz.Pixmap(page.parent, xref)
                
                # Convert to PNG if not already
                if pix.n - pix.alpha < 4:  # GRAY or RGB
                    img_data = pix.tobytes("png")
                    
                    # Convert to base64 for embedding
                    img_base64 = base64.b64encode(img_data).decode()
                    
                    # Add image to HTML
                    html_content += f'''
                    <div class="pdf-image">
                        <img src="data:image/png;base64,{img_base64}" 
                             alt="Image {img_index + 1} from page {page_num + 1}"
                             style="max-width: 100%; height: auto; margin: 10px 0;" />
                    </div>
                    '''
                
                pix = None  # Free memory
                
            except Exception as e:
                print(f"Image extraction failed for image {img_index}: {e}", file=sys.stderr)
                continue
        
        return html_content
        
    except Exception as e:
        print(f"Image extraction failed: {e}", file=sys.stderr)
        return ""

def convert_with_pdfplumber_fallback(input_path, output_path):
    """
    Enhanced fallback conversion using pdfplumber with structure preservation
    """
    try:
        import pdfplumber
        
        html_content = generate_html_structure()
        
        with pdfplumber.open(input_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                html_content += f'<div class="pdf-page" id="page-{page_num + 1}">\n'
                html_content += f'<h2 class="page-header">Page {page_num + 1}</h2>\n'
                
                # Extract text with layout awareness
                text = page.extract_text(layout=True, x_tolerance=2, y_tolerance=2)
                if text:
                    html_content += process_text_with_resume_structure(text, page_num == 0)
                
                # Extract tables with proper formatting
                tables = page.extract_tables()
                for table in tables:
                    if table and len(table) > 0:
                        html_content += '<table class="pdf-table">\n'
                        for row_idx, row in enumerate(table):
                            if row and any(cell and str(cell).strip() for cell in row):
                                html_content += '<tr>'
                                for cell in row:
                                    cell_text = str(cell).strip() if cell else ""
                                    tag = 'th' if row_idx == 0 else 'td'
                                    html_content += f'<{tag}>{escape_html(cell_text)}</{tag}>'
                                html_content += '</tr>\n'
                        html_content += '</table>\n'
                
                html_content += '</div>\n'
        
        html_content += generate_html_footer()
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(json.dumps({
            "success": True,
            "message": "PDF converted to HTML with enhanced structure preservation"
        }))
        return True
        
    except Exception as e:
        print(f"Enhanced fallback conversion failed: {e}", file=sys.stderr)
        print(json.dumps({
            "success": False,
            "error": f"PDF to HTML conversion failed: {str(e)}"
        }))
        return False

def process_text_with_resume_structure(text, is_first_page=False):
    """
    Process extracted text with resume-specific structure detection
    """
    lines = text.split('\n')
    html_content = '<div class="structured-content">\n'
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        
        # Classify line type for proper HTML structure
        line_type = classify_resume_line_for_html(line, i == 0 and is_first_page)
        
        if line_type == 'name':
            html_content += f'<h1 class="resume-name">{escape_html(line)}</h1>\n'
        elif line_type == 'contact':
            html_content += f'<p class="contact-info">{escape_html(line)}</p>\n'
        elif line_type == 'section_header':
            html_content += f'<h2 class="section-header">{escape_html(line)}</h2>\n'
        elif line_type == 'job_title':
            html_content += f'<h3 class="job-title">{escape_html(line)}</h3>\n'
        elif line_type == 'company_info':
            html_content += f'<p class="company-info">{escape_html(line)}</p>\n'
        elif line_type == 'bullet_point':
            clean_text = line.lstrip('•▪▫◦‣⁃-* ').strip()
            html_content += f'<li class="bullet-point">{escape_html(clean_text)}</li>\n'
        else:
            html_content += f'<p class="resume-paragraph">{escape_html(line)}</p>\n'
    
    html_content += '</div>\n'
    return html_content

def classify_resume_line_for_html(line, is_first_line=False):
    """
    Classify resume lines for proper HTML structure
    """
    import re
    
    # Name detection
    if (is_first_line or 
        (len(line.split()) <= 4 and line.istitle() and 
         not any(word.lower() in ['experience', 'education', 'skills', 'work'] for word in line.split()))):
        return 'name'
    
    # Contact information
    if (any(indicator in line.lower() for indicator in ['@', 'http', 'linkedin', 'behance']) or
        re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', line) or
        any(char.isdigit() for char in line) and len(line.split()) <= 10):
        return 'contact'
    
    # Section headers
    section_keywords = ['work experience', 'experience', 'education', 'skills', 'projects', 'summary']
    if any(section in line.lower() for section in section_keywords):
        return 'section_header'
    
    # Job titles
    if (any(title in line.lower() for title in ['designer', 'developer', 'engineer', 'manager']) and
        len(line.split()) <= 6 and
        not any(word.lower() in ['solutions', 'technologies', 'with'] for word in line.split())):
        return 'job_title'
    
    # Company information
    if (any(indicator in line.lower() for indicator in ['solutions', 'technologies', 'remote', 'bangladesh']) or
        re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}', line)):
        return 'company_info'
    
    # Bullet points
    if line.lstrip().startswith(('•', '▪', '▫', '◦', '‣', '⁃', '-', '*')):
        return 'bullet_point'
    
    return 'paragraph'

def generate_html_structure():
    """
    Generate HTML document structure with professional styling
    """
    return '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF to HTML Conversion</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .pdf-page {
            margin-bottom: 40px;
            padding: 30px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: white;
            position: relative;
            min-height: 500px;
            page-break-after: always;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .page-header {
            color: #3B82F6;
            border-bottom: 2px solid #3B82F6;
            padding-bottom: 10px;
            margin-bottom: 25px;
            font-size: 18px;
        }
        .structured-content {
            line-height: 1.6;
        }
        .resume-name {
            text-align: center;
            color: #1F2937;
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 10px 0;
            border-bottom: none;
        }
        .contact-info {
            text-align: center;
            color: #6B7280;
            font-size: 11px;
            margin: 5px 0;
            line-height: 1.4;
        }
        .section-header {
            color: #1F2937;
            font-size: 16px;
            font-weight: 600;
            margin: 25px 0 15px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #E5E7EB;
        }
        .job-title {
            color: #374151;
            font-size: 14px;
            font-weight: 600;
            margin: 15px 0 8px 0;
        }
        .company-info {
            color: #6B7280;
            font-size: 12px;
            font-style: italic;
            margin: 5px 0 10px 0;
        }
        .resume-paragraph {
            color: #374151;
            font-size: 12px;
            margin: 8px 0;
            line-height: 1.5;
            text-align: justify;
        }
        .bullet-point {
            color: #374151;
            font-size: 11px;
            margin: 4px 0;
            margin-left: 20px;
            line-height: 1.4;
            list-style-type: disc;
        }
        .text-content {
            position: relative;
            width: 100%;
            height: 100%;
        }
        .text-line {
            position: absolute;
            white-space: nowrap;
        }
        .ocr-content {
            padding: 20px;
            background: #f8f9fa;
            border-left: 4px solid #10B981;
            margin: 20px 0;
        }
        .ocr-notice {
            color: #6B7280;
            font-style: italic;
            margin-bottom: 15px;
        }
        .ocr-line {
            margin: 8px 0;
            line-height: 1.5;
        }
        .pdf-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .pdf-table th, .pdf-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .pdf-table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .pdf-image {
            text-align: center;
            margin: 20px 0;
        }
        .error {
            background: #FEE2E2;
            border: 1px solid #FECACA;
            color: #DC2626;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
            .pdf-page { page-break-after: always; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 style="color: #3B82F6; text-align: center; margin-bottom: 30px;">PDF to HTML Conversion</h1>
'''

def generate_html_footer():
    """
    Generate HTML document footer
    """
    return '''
    </div>
    <script>
        // Add interactive features
        document.addEventListener('DOMContentLoaded', function() {
            // Add smooth scrolling to page navigation
            const pages = document.querySelectorAll('.pdf-page');
            pages.forEach((page, index) => {
                page.style.opacity = '0';
                page.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    page.style.transition = 'all 0.5s ease';
                    page.style.opacity = '1';
                    page.style.transform = 'translateY(0)';
                }, index * 200);
            });
        });
    </script>
</body>
</html>'''

def escape_html(text):
    """
    Escape HTML special characters
    """
    if not text:
        return ""
    
    return (text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&#x27;'))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: python pdf_to_html_advanced.py <input_pdf> <output_html>"
        }))
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    if not os.path.exists(input_file):
        print(json.dumps({
            "success": False,
            "error": f"Input file not found: {input_file}"
        }))
        sys.exit(1)
    
    success = convert_pdf_to_html_professional(input_file, output_file)
    sys.exit(0 if success else 1)