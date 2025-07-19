#!/usr/bin/env python3
"""
Professional PDF Page Management Tool for Replit
Handles rotation, removal, and addition of PDF pages
Compatible with Linux environments using PyMuPDF
"""

import sys
import json
import os
from pathlib import Path

def parse_page_range(page_range_str, total_pages):
    """
    Parse page range string into list of page numbers (0-indexed)
    
    Args:
        page_range_str: String like "1,3,5-7,10" (1-indexed)
        total_pages: Total number of pages in PDF
        
    Returns:
        List of 0-indexed page numbers
    """
    if not page_range_str or not page_range_str.strip():
        return list(range(total_pages))
    
    pages = set()
    parts = page_range_str.replace(' ', '').split(',')
    
    for part in parts:
        if '-' in part:
            # Handle range like "5-7"
            try:
                start, end = map(int, part.split('-'))
                for i in range(start, end + 1):
                    if 1 <= i <= total_pages:
                        pages.add(i - 1)  # Convert to 0-indexed
            except ValueError:
                continue
        else:
            # Handle single page
            try:
                page = int(part)
                if 1 <= page <= total_pages:
                    pages.add(page - 1)  # Convert to 0-indexed
            except ValueError:
                continue
    
    return sorted(list(pages))

def rotate_pdf_pages(input_path, output_path, rotation_angle, page_numbers=None):
    """
    Rotate specific pages in a PDF
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        rotation_angle: Rotation angle (90, 180, 270)
        page_numbers: String of page numbers to rotate (1-indexed), None for all pages
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
        
        # Parse page numbers
        pages_to_rotate = parse_page_range(page_numbers, total_pages)
        
        if not pages_to_rotate:
            raise ValueError("No valid pages specified for rotation")
        
        # Rotate specified pages
        for page_idx in pages_to_rotate:
            if 0 <= page_idx < total_pages:
                page = pdf_doc[page_idx]
                page.set_rotation(rotation_angle)
        
        # Save the modified PDF
        pdf_doc.save(output_path)
        pdf_doc.close()
        
        return {
            "success": True,
            "message": f"PDF successfully rotated {rotation_angle}° for {len(pages_to_rotate)} pages."
        }
        
    except ImportError:
        raise ImportError("PyMuPDF (fitz) library not available")
    except Exception as e:
        raise Exception(f"PDF rotation failed: {str(e)}")

def remove_pdf_pages(input_path, output_path, pages_to_remove):
    """
    Remove specific pages from a PDF
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        pages_to_remove: String of page numbers to remove (1-indexed)
    """
    try:
        import fitz  # PyMuPDF
        
        # Open PDF document
        pdf_doc = fitz.open(input_path)
        total_pages = pdf_doc.page_count
        
        if total_pages == 0:
            raise ValueError("PDF document contains no pages")
        
        # Parse pages to remove
        remove_pages = parse_page_range(pages_to_remove, total_pages)
        
        if not remove_pages:
            raise ValueError("No valid pages specified for removal")
        
        if len(remove_pages) >= total_pages:
            raise ValueError("Cannot remove all pages from PDF")
        
        # Remove pages in reverse order to maintain correct indices
        for page_idx in sorted(remove_pages, reverse=True):
            if 0 <= page_idx < total_pages:
                pdf_doc.delete_page(page_idx)
        
        # Save the modified PDF
        pdf_doc.save(output_path)
        pdf_doc.close()
        
        return {
            "success": True,
            "message": f"Successfully removed {len(remove_pages)} pages from PDF."
        }
        
    except ImportError:
        raise ImportError("PyMuPDF (fitz) library not available")
    except Exception as e:
        raise Exception(f"PDF page removal failed: {str(e)}")

def add_pdf_pages(main_pdf_path, pages_to_add_path, output_path, insertion_point="end"):
    """
    Add pages from one PDF to another
    
    Args:
        main_pdf_path: Path to main PDF file
        pages_to_add_path: Path to PDF containing pages to add
        output_path: Path to output PDF
        insertion_point: Where to insert pages ("start", "end", or page number)
    """
    try:
        import fitz  # PyMuPDF
        
        # Open both PDF documents
        main_doc = fitz.open(main_pdf_path)
        add_doc = fitz.open(pages_to_add_path)
        
        main_pages = main_doc.page_count
        add_pages = add_doc.page_count
        
        if add_pages == 0:
            raise ValueError("No pages to add from second PDF")
        
        # Determine insertion point
        if insertion_point == "start":
            insert_at = 0
        elif insertion_point == "end":
            insert_at = main_pages
        else:
            try:
                insert_at = int(insertion_point)
                if insert_at < 1:
                    insert_at = 0
                elif insert_at > main_pages:
                    insert_at = main_pages
                else:
                    insert_at = insert_at - 1  # Convert to 0-indexed
            except ValueError:
                insert_at = main_pages  # Default to end
        
        # Insert pages from second PDF
        main_doc.insert_pdf(add_doc, start_at=insert_at)
        
        # Save the merged PDF
        main_doc.save(output_path)
        main_doc.close()
        add_doc.close()
        
        return {
            "success": True,
            "message": f"Successfully added {add_pages} pages to PDF at position {insert_at + 1}."
        }
        
    except ImportError:
        raise ImportError("PyMuPDF (fitz) library not available")
    except Exception as e:
        raise Exception(f"PDF page addition failed: {str(e)}")

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Invalid arguments"}))
        sys.exit(1)
    
    operation = sys.argv[1]
    
    try:
        if operation == "rotate":
            if len(sys.argv) < 5:
                raise ValueError("Usage: python pdf_page_manager.py rotate <input> <output> <angle> [pages]")
            
            input_path = sys.argv[2]
            output_path = sys.argv[3]
            rotation_angle = int(sys.argv[4])
            page_numbers = sys.argv[5] if len(sys.argv) > 5 else None
            
            result = rotate_pdf_pages(input_path, output_path, rotation_angle, page_numbers)
            print(json.dumps(result))
            
        elif operation == "remove":
            if len(sys.argv) < 5:
                raise ValueError("Usage: python pdf_page_manager.py remove <input> <output> <pages>")
            
            input_path = sys.argv[2]
            output_path = sys.argv[3]
            pages_to_remove = sys.argv[4]
            
            result = remove_pdf_pages(input_path, output_path, pages_to_remove)
            print(json.dumps(result))
            
        elif operation == "add":
            if len(sys.argv) < 5:
                raise ValueError("Usage: python pdf_page_manager.py add <main_pdf> <add_pdf> <output> [position]")
            
            main_pdf_path = sys.argv[2]
            add_pdf_path = sys.argv[3]
            output_path = sys.argv[4]
            insertion_point = sys.argv[5] if len(sys.argv) > 5 else "end"
            
            result = add_pdf_pages(main_pdf_path, add_pdf_path, output_path, insertion_point)
            print(json.dumps(result))
            
        else:
            raise ValueError(f"Unknown operation: {operation}")
            
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()