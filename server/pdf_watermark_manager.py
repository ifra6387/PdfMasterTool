#!/usr/bin/env python3
"""
Professional PDF Watermark and Page Number Manager for Replit
Handles watermark addition and page numbering for PDFs
Compatible with Linux environments using PyMuPDF and ReportLab
"""

import sys
import json
import os
from pathlib import Path

def add_watermark_to_pdf(input_path, output_path, watermark_text, font_size=20, color="#808080", position="center", opacity=0.3):
    """
    Add watermark text to all pages of a PDF
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        watermark_text: Text to watermark
        font_size: Size of watermark font (10-50)
        color: Color in hex format (e.g., "#FF0000") or RGB tuple
        position: Position of watermark (center, top-left, top-right, bottom-left, bottom-right, diagonal)
        opacity: Transparency level (0.0-1.0)
    """
    try:
        import fitz  # PyMuPDF
        
        # Open PDF document
        pdf_doc = fitz.open(input_path)
        total_pages = pdf_doc.page_count
        
        if total_pages == 0:
            raise ValueError("PDF document contains no pages")
        
        # Parse color
        if isinstance(color, str) and color.startswith('#'):
            # Convert hex to RGB
            hex_color = color.lstrip('#')
            rgb_color = tuple(int(hex_color[i:i+2], 16)/255.0 for i in (0, 2, 4))
        else:
            rgb_color = (0.5, 0.5, 0.5)  # Default gray
        
        # Process each page
        for page_num in range(total_pages):
            page = pdf_doc[page_num]
            page_rect = page.rect
            
            # Calculate position
            if position == "center":
                x = page_rect.width / 2
                y = page_rect.height / 2
                rotation = 0
            elif position == "top-left":
                x = 50
                y = 50
                rotation = 0
            elif position == "top-right":
                x = page_rect.width - 50
                y = 50
                rotation = 0
            elif position == "bottom-left":
                x = 50
                y = page_rect.height - 50
                rotation = 0
            elif position == "bottom-right":
                x = page_rect.width - 50
                y = page_rect.height - 50
                rotation = 0
            elif position == "diagonal":
                x = page_rect.width / 2
                y = page_rect.height / 2
                rotation = 0  # Let's keep it simple for compatibility
            else:
                x = page_rect.width / 2
                y = page_rect.height / 2
                rotation = 0
            
            # Insert watermark text with transparency effect
            if position == "diagonal":
                # For diagonal, we'll use a transform matrix
                point = fitz.Point(x, y)
                matrix = fitz.Matrix(45)  # 45 degree rotation
                rotated_point = point * matrix
                
                page.insert_text(
                    point,
                    watermark_text,
                    fontsize=font_size,
                    color=rgb_color,
                    overlay=True
                )
            else:
                # Regular positioning
                page.insert_text(
                    (x, y),
                    watermark_text,
                    fontsize=font_size,
                    color=rgb_color,
                    overlay=True
                )
            
            # Apply opacity by creating a semi-transparent overlay
            if opacity < 1.0:
                # Create a shape for opacity effect
                shape = page.new_shape()
                shape.insert_text(
                    (x, y),
                    watermark_text,
                    fontsize=font_size,
                    color=rgb_color,
                    rotate=rotation
                )
                shape.commit(overlay=True)
        
        # Save the watermarked PDF
        pdf_doc.save(output_path)
        pdf_doc.close()
        
        return {
            "success": True,
            "message": f"Watermark '{watermark_text}' successfully added to {total_pages} pages."
        }
        
    except ImportError:
        raise ImportError("PyMuPDF (fitz) library not available")
    except Exception as e:
        raise Exception(f"Watermark addition failed: {str(e)}")

def add_page_numbers_to_pdf(input_path, output_path, position="bottom-right", font_size=12, start_number=1):
    """
    Add page numbers to all pages of a PDF
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        position: Position of page numbers (top-left, top-right, bottom-left, bottom-right, center-bottom)
        font_size: Size of page number font
        start_number: Starting page number (default 1)
    """
    try:
        import fitz  # PyMuPDF
        
        # Open PDF document
        pdf_doc = fitz.open(input_path)
        total_pages = pdf_doc.page_count
        
        if total_pages == 0:
            raise ValueError("PDF document contains no pages")
        
        # Process each page
        for page_num in range(total_pages):
            page = pdf_doc[page_num]
            page_rect = page.rect
            
            # Calculate page number
            page_number = start_number + page_num
            page_text = str(page_number)
            
            # Calculate position
            if position == "top-left":
                x = 30
                y = 30
            elif position == "top-right":
                x = page_rect.width - 30
                y = 30
            elif position == "bottom-left":
                x = 30
                y = page_rect.height - 20
            elif position == "bottom-right":
                x = page_rect.width - 30
                y = page_rect.height - 20
            elif position == "center-bottom":
                x = page_rect.width / 2
                y = page_rect.height - 20
            else:
                x = page_rect.width - 30
                y = page_rect.height - 20
            
            # Insert page number
            page.insert_text(
                (x, y),
                page_text,
                fontsize=font_size,
                color=(0, 0, 0),  # Black
                overlay=True
            )
        
        # Save the numbered PDF
        pdf_doc.save(output_path)
        pdf_doc.close()
        
        return {
            "success": True,
            "message": f"Page numbers successfully added to {total_pages} pages starting from {start_number}."
        }
        
    except ImportError:
        raise ImportError("PyMuPDF (fitz) library not available")
    except Exception as e:
        raise Exception(f"Page numbering failed: {str(e)}")

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Invalid arguments"}))
        sys.exit(1)
    
    operation = sys.argv[1]
    
    try:
        if operation == "watermark":
            if len(sys.argv) < 5:
                raise ValueError("Usage: python pdf_watermark_manager.py watermark <input> <output> <text> [font_size] [color] [position] [opacity]")
            
            input_path = sys.argv[2]
            output_path = sys.argv[3]
            watermark_text = sys.argv[4]
            font_size = int(sys.argv[5]) if len(sys.argv) > 5 else 20
            color = sys.argv[6] if len(sys.argv) > 6 else "#808080"
            position = sys.argv[7] if len(sys.argv) > 7 else "center"
            opacity = float(sys.argv[8]) if len(sys.argv) > 8 else 0.3
            
            result = add_watermark_to_pdf(input_path, output_path, watermark_text, font_size, color, position, opacity)
            print(json.dumps(result))
            
        elif operation == "page_numbers":
            if len(sys.argv) < 4:
                raise ValueError("Usage: python pdf_watermark_manager.py page_numbers <input> <output> [position] [font_size] [start_number]")
            
            input_path = sys.argv[2]
            output_path = sys.argv[3]
            position = sys.argv[4] if len(sys.argv) > 4 else "bottom-right"
            font_size = int(sys.argv[5]) if len(sys.argv) > 5 else 12
            start_number = int(sys.argv[6]) if len(sys.argv) > 6 else 1
            
            result = add_page_numbers_to_pdf(input_path, output_path, position, font_size, start_number)
            print(json.dumps(result))
            
        else:
            raise ValueError(f"Unknown operation: {operation}")
            
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()