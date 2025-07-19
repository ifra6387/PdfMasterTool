#!/usr/bin/env python3
"""
Professional PDF Rotation Tool for Replit
Rotates PDF pages by specified angles with page selection support
Compatible with Linux environments
"""

import sys
import json
import os
from pathlib import Path

def rotate_pdf_professional(input_path, output_path, rotation_angle, page_numbers=None):
    """
    Rotate PDF pages using PyMuPDF
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        rotation_angle: Rotation angle (90, 180, 270)
        page_numbers: List of page numbers to rotate (1-indexed), None for all pages
    """
    try:
        import fitz  # PyMuPDF
        
        # Validate rotation angle
        if rotation_angle not in [90, 180, 270]:
            raise ValueError(f"Invalid rotation angle: {rotation_angle}. Must be 90, 180, or 270 degrees.")
        
        # Open PDF document
        pdf_doc = fitz.open(input_path)
        total_pages = pdf_doc.page_count
        
        if total_pages == 0:
            raise ValueError("PDF document contains no pages")
        
        # Determine which pages to rotate
        if page_numbers is None:
            # Rotate all pages
            pages_to_rotate = list(range(total_pages))
            rotation_description = f"all {total_pages} pages"
        else:
            # Validate and convert page numbers (1-indexed to 0-indexed)
            pages_to_rotate = []
            invalid_pages = []
            
            for page_num in page_numbers:
                if 1 <= page_num <= total_pages:
                    pages_to_rotate.append(page_num - 1)  # Convert to 0-indexed
                else:
                    invalid_pages.append(page_num)
            
            if invalid_pages:
                raise ValueError(f"Invalid page numbers: {invalid_pages}. PDF has {total_pages} pages.")
            
            if not pages_to_rotate:
                raise ValueError("No valid pages specified for rotation")
            
            rotation_description = f"{len(pages_to_rotate)} specified pages"
        
        # Apply rotation to selected pages
        for page_index in pages_to_rotate:
            page = pdf_doc[page_index]
            page.set_rotation(rotation_angle)
        
        # Save the rotated PDF
        pdf_doc.save(output_path)
        pdf_doc.close()
        
        print(json.dumps({
            "success": True,
            "message": f"PDF successfully rotated {rotation_angle}° for {rotation_description}."
        }))
        return True
        
    except Exception as e:
        print(f"Professional rotation failed: {e}", file=sys.stderr)
        return False

def parse_page_numbers(page_string):
    """
    Parse page numbers string like "1,3,5-7,10" into list of integers
    
    Args:
        page_string: String containing page numbers and ranges
    
    Returns:
        List of page numbers (1-indexed)
    """
    if not page_string or not page_string.strip():
        return None
    
    pages = set()
    
    # Split by commas and process each part
    parts = page_string.strip().split(',')
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
            
        if '-' in part:
            # Handle range like "5-7"
            try:
                start, end = part.split('-', 1)
                start_num = int(start.strip())
                end_num = int(end.strip())
                
                if start_num > end_num:
                    raise ValueError(f"Invalid range: {part} (start > end)")
                
                pages.update(range(start_num, end_num + 1))
            except ValueError as e:
                raise ValueError(f"Invalid page range: {part}")
        else:
            # Handle single page number
            try:
                page_num = int(part)
                if page_num < 1:
                    raise ValueError(f"Page numbers must be positive: {page_num}")
                pages.add(page_num)
            except ValueError:
                raise ValueError(f"Invalid page number: {part}")
    
    return sorted(list(pages))

def main():
    if len(sys.argv) < 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python rotate_pdf_converter.py <input.pdf> <output.pdf> <rotation_angle> [page_numbers]"
        }))
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    try:
        rotation_angle = int(sys.argv[3])
    except ValueError:
        print(json.dumps({
            "success": False,
            "error": "Rotation angle must be a number (90, 180, or 270)"
        }))
        sys.exit(1)
    
    # Parse page numbers if provided
    page_numbers = None
    if len(sys.argv) > 4 and sys.argv[4].strip():
        try:
            page_numbers = parse_page_numbers(sys.argv[4])
        except ValueError as e:
            print(json.dumps({
                "success": False,
                "error": f"Invalid page specification: {str(e)}"
            }))
            sys.exit(1)
    
    # Validate input file
    if not os.path.exists(input_path):
        print(json.dumps({
            "success": False,
            "error": "Input file not found"
        }))
        sys.exit(1)
    
    if not input_path.lower().endswith('.pdf'):
        print(json.dumps({
            "success": False,
            "error": "Input file must be a .pdf file"
        }))
        sys.exit(1)
    
    try:
        # Rotate PDF
        if rotate_pdf_professional(input_path, output_path, rotation_angle, page_numbers):
            sys.exit(0)
        
        # If rotation fails
        print(json.dumps({
            "success": False,
            "error": "PDF rotation failed. Please ensure the PDF is not corrupted."
        }))
        sys.exit(1)
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Rotation failed: {str(e)}"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()