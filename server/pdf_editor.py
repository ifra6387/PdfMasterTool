#!/usr/bin/env python3
"""
Professional PDF Editor for Replit
Handles PDF editing operations including text, shapes, highlights, images, and annotations
Compatible with Linux environments using PyMuPDF and PIL
"""

import sys
import json
import os
import base64
from pathlib import Path
from io import BytesIO

def add_text_to_pdf(input_path, output_path, edits):
    """
    Add text elements to PDF pages
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        edits: List of edit operations with text, position, styling
    """
    try:
        import fitz  # PyMuPDF
        
        # Open PDF document
        pdf_doc = fitz.open(input_path)
        
        for edit in edits:
            if edit.get('type') == 'text':
                page_num = edit.get('page', 0)
                if page_num < pdf_doc.page_count:
                    page = pdf_doc[page_num]
                    
                    # Extract text properties
                    text = edit.get('text', '')
                    x = float(edit.get('x', 100))
                    y = float(edit.get('y', 100))
                    font_size = int(edit.get('fontSize', 12))
                    color = edit.get('color', '#000000')
                    
                    # Convert hex color to RGB
                    if color.startswith('#'):
                        hex_color = color.lstrip('#')
                        rgb_color = tuple(int(hex_color[i:i+2], 16)/255.0 for i in (0, 2, 4))
                    else:
                        rgb_color = (0, 0, 0)  # Default black
                    
                    # Insert text
                    page.insert_text(
                        (x, y),
                        text,
                        fontsize=font_size,
                        color=rgb_color,
                        overlay=True
                    )
        
        # Save the edited PDF
        pdf_doc.save(output_path)
        pdf_doc.close()
        
        return {"success": True, "message": "Text elements added successfully"}
        
    except ImportError:
        raise ImportError("PyMuPDF (fitz) library not available")
    except Exception as e:
        raise Exception(f"Text addition failed: {str(e)}")

def add_shapes_to_pdf(input_path, output_path, edits):
    """
    Add shapes (rectangles, circles, lines) to PDF pages
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        edits: List of shape edit operations
    """
    try:
        import fitz  # PyMuPDF
        
        # Open PDF document
        pdf_doc = fitz.open(input_path)
        
        for edit in edits:
            edit_type = edit.get('type')
            if edit_type in ['rectangle', 'circle', 'line']:
                page_num = edit.get('page', 0)
                if page_num < pdf_doc.page_count:
                    page = pdf_doc[page_num]
                    shape = page.new_shape()
                    
                    # Extract shape properties
                    x1 = float(edit.get('x1', 100))
                    y1 = float(edit.get('y1', 100))
                    x2 = float(edit.get('x2', 200))
                    y2 = float(edit.get('y2', 200))
                    color = edit.get('color', '#000000')
                    width = float(edit.get('width', 1))
                    
                    # Convert hex color to RGB
                    if color.startswith('#'):
                        hex_color = color.lstrip('#')
                        rgb_color = tuple(int(hex_color[i:i+2], 16)/255.0 for i in (0, 2, 4))
                    else:
                        rgb_color = (0, 0, 0)
                    
                    if edit_type == 'rectangle':
                        rect = fitz.Rect(x1, y1, x2, y2)
                        shape.draw_rect(rect)
                    elif edit_type == 'circle':
                        center = fitz.Point((x1 + x2) / 2, (y1 + y2) / 2)
                        radius = min(abs(x2 - x1), abs(y2 - y1)) / 2
                        shape.draw_circle(center, radius)
                    elif edit_type == 'line':
                        point1 = fitz.Point(x1, y1)
                        point2 = fitz.Point(x2, y2)
                        shape.draw_line(point1, point2)
                    
                    # Apply styling
                    shape.finish(color=rgb_color, width=width)
                    shape.commit()
        
        # Save the edited PDF
        pdf_doc.save(output_path)
        pdf_doc.close()
        
        return {"success": True, "message": "Shapes added successfully"}
        
    except ImportError:
        raise ImportError("PyMuPDF (fitz) library not available")
    except Exception as e:
        raise Exception(f"Shape addition failed: {str(e)}")

def add_highlights_to_pdf(input_path, output_path, edits):
    """
    Add highlights to existing text in PDF
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        edits: List of highlight operations
    """
    try:
        import fitz  # PyMuPDF
        
        # Open PDF document
        pdf_doc = fitz.open(input_path)
        
        for edit in edits:
            if edit.get('type') == 'highlight':
                page_num = edit.get('page', 0)
                if page_num < pdf_doc.page_count:
                    page = pdf_doc[page_num]
                    
                    # Extract highlight properties
                    x1 = float(edit.get('x1', 100))
                    y1 = float(edit.get('y1', 100))
                    x2 = float(edit.get('x2', 200))
                    y2 = float(edit.get('y2', 120))
                    color = edit.get('color', '#FFFF00')  # Default yellow
                    
                    # Convert hex color to RGB
                    if color.startswith('#'):
                        hex_color = color.lstrip('#')
                        rgb_color = tuple(int(hex_color[i:i+2], 16)/255.0 for i in (0, 2, 4))
                    else:
                        rgb_color = (1, 1, 0)  # Default yellow
                    
                    # Create highlight rectangle
                    highlight_rect = fitz.Rect(x1, y1, x2, y2)
                    highlight = page.add_highlight_annot(highlight_rect)
                    highlight.set_colors(stroke=rgb_color, fill=rgb_color)
                    highlight.update()
        
        # Save the edited PDF
        pdf_doc.save(output_path)
        pdf_doc.close()
        
        return {"success": True, "message": "Highlights added successfully"}
        
    except ImportError:
        raise ImportError("PyMuPDF (fitz) library not available")
    except Exception as e:
        raise Exception(f"Highlight addition failed: {str(e)}")

def add_images_to_pdf(input_path, output_path, edits):
    """
    Add images to PDF pages
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        edits: List of image operations with base64 encoded images
    """
    try:
        import fitz  # PyMuPDF
        from PIL import Image
        
        # Open PDF document
        pdf_doc = fitz.open(input_path)
        
        for edit in edits:
            if edit.get('type') == 'image':
                page_num = edit.get('page', 0)
                if page_num < pdf_doc.page_count:
                    page = pdf_doc[page_num]
                    
                    # Extract image properties
                    image_data = edit.get('imageData', '')
                    x = float(edit.get('x', 100))
                    y = float(edit.get('y', 100))
                    width = float(edit.get('width', 100))
                    height = float(edit.get('height', 100))
                    
                    # Decode base64 image
                    if image_data.startswith('data:image'):
                        # Remove data URL prefix
                        image_data = image_data.split(',')[1]
                    
                    image_bytes = base64.b64decode(image_data)
                    
                    # Create image rectangle
                    image_rect = fitz.Rect(x, y, x + width, y + height)
                    
                    # Insert image
                    page.insert_image(image_rect, stream=image_bytes)
        
        # Save the edited PDF
        pdf_doc.save(output_path)
        pdf_doc.close()
        
        return {"success": True, "message": "Images added successfully"}
        
    except ImportError:
        raise ImportError("PyMuPDF (fitz) or PIL library not available")
    except Exception as e:
        raise Exception(f"Image addition failed: {str(e)}")

def add_freehand_to_pdf(input_path, output_path, edits):
    """
    Add freehand drawings to PDF pages
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        edits: List of freehand drawing operations
    """
    try:
        import fitz  # PyMuPDF
        
        # Open PDF document
        pdf_doc = fitz.open(input_path)
        
        for edit in edits:
            if edit.get('type') == 'freehand':
                page_num = edit.get('page', 0)
                if page_num < pdf_doc.page_count:
                    page = pdf_doc[page_num]
                    shape = page.new_shape()
                    
                    # Extract drawing properties
                    points = edit.get('points', [])
                    color = edit.get('color', '#000000')
                    width = float(edit.get('width', 2))
                    
                    # Convert hex color to RGB
                    if color.startswith('#'):
                        hex_color = color.lstrip('#')
                        rgb_color = tuple(int(hex_color[i:i+2], 16)/255.0 for i in (0, 2, 4))
                    else:
                        rgb_color = (0, 0, 0)
                    
                    # Draw path from points
                    if len(points) > 1:
                        for i in range(len(points) - 1):
                            point1 = fitz.Point(points[i]['x'], points[i]['y'])
                            point2 = fitz.Point(points[i+1]['x'], points[i+1]['y'])
                            shape.draw_line(point1, point2)
                    
                    # Apply styling
                    shape.finish(color=rgb_color, width=width)
                    shape.commit()
        
        # Save the edited PDF
        pdf_doc.save(output_path)
        pdf_doc.close()
        
        return {"success": True, "message": "Freehand drawings added successfully"}
        
    except ImportError:
        raise ImportError("PyMuPDF (fitz) library not available")
    except Exception as e:
        raise Exception(f"Freehand drawing failed: {str(e)}")

def add_erasers_to_pdf(input_path, output_path, edits):
    """
    Add white boxes to "erase" content from PDF
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        edits: List of eraser operations
    """
    try:
        import fitz  # PyMuPDF
        
        # Open PDF document
        pdf_doc = fitz.open(input_path)
        
        for edit in edits:
            if edit.get('type') == 'eraser':
                page_num = edit.get('page', 0)
                if page_num < pdf_doc.page_count:
                    page = pdf_doc[page_num]
                    shape = page.new_shape()
                    
                    # Extract eraser properties
                    x1 = float(edit.get('x1', 100))
                    y1 = float(edit.get('y1', 100))
                    x2 = float(edit.get('x2', 200))
                    y2 = float(edit.get('y2', 200))
                    
                    # Create white rectangle to cover content
                    rect = fitz.Rect(x1, y1, x2, y2)
                    shape.draw_rect(rect)
                    shape.finish(color=(1, 1, 1), fill=(1, 1, 1))  # White fill and border
                    shape.commit()
        
        # Save the edited PDF
        pdf_doc.save(output_path)
        pdf_doc.close()
        
        return {"success": True, "message": "Content erased successfully"}
        
    except ImportError:
        raise ImportError("PyMuPDF (fitz) library not available")
    except Exception as e:
        raise Exception(f"Content erasing failed: {str(e)}")

def edit_pdf_comprehensive(input_path, output_path, edit_operations):
    """
    Apply comprehensive edits to PDF including all edit types
    
    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF
        edit_operations: List of all edit operations to apply
    """
    try:
        import fitz  # PyMuPDF
        from PIL import Image
        
        # Open PDF document
        pdf_doc = fitz.open(input_path)
        total_pages = pdf_doc.page_count
        
        if total_pages == 0:
            raise ValueError("PDF document contains no pages")
        
        # Group operations by type for efficient processing
        text_ops = [op for op in edit_operations if op.get('type') == 'text']
        shape_ops = [op for op in edit_operations if op.get('type') in ['rectangle', 'circle', 'line']]
        highlight_ops = [op for op in edit_operations if op.get('type') == 'highlight']
        image_ops = [op for op in edit_operations if op.get('type') == 'image']
        freehand_ops = [op for op in edit_operations if op.get('type') == 'freehand']
        eraser_ops = [op for op in edit_operations if op.get('type') == 'eraser']
        
        # Process each type of operation
        operations_applied = 0
        
        # Apply erasers first (to cover existing content)
        for edit in eraser_ops:
            page_num = edit.get('page', 0)
            if page_num < total_pages:
                page = pdf_doc[page_num]
                shape = page.new_shape()
                
                x1 = float(edit.get('x1', 100))
                y1 = float(edit.get('y1', 100))
                x2 = float(edit.get('x2', 200))
                y2 = float(edit.get('y2', 200))
                
                rect = fitz.Rect(x1, y1, x2, y2)
                shape.draw_rect(rect)
                shape.finish(color=(1, 1, 1), fill=(1, 1, 1))
                shape.commit()
                operations_applied += 1
        
        # Apply highlights
        for edit in highlight_ops:
            page_num = edit.get('page', 0)
            if page_num < total_pages:
                page = pdf_doc[page_num]
                
                x1 = float(edit.get('x1', 100))
                y1 = float(edit.get('y1', 100))
                x2 = float(edit.get('x2', 200))
                y2 = float(edit.get('y2', 120))
                color = edit.get('color', '#FFFF00')
                
                if color.startswith('#'):
                    hex_color = color.lstrip('#')
                    rgb_color = tuple(int(hex_color[i:i+2], 16)/255.0 for i in (0, 2, 4))
                else:
                    rgb_color = (1, 1, 0)
                
                highlight_rect = fitz.Rect(x1, y1, x2, y2)
                highlight = page.add_highlight_annot(highlight_rect)
                highlight.set_colors(stroke=rgb_color, fill=rgb_color)
                highlight.update()
                operations_applied += 1
        
        # Apply shapes
        for edit in shape_ops:
            page_num = edit.get('page', 0)
            if page_num < total_pages:
                page = pdf_doc[page_num]
                shape = page.new_shape()
                
                x1 = float(edit.get('x1', 100))
                y1 = float(edit.get('y1', 100))
                x2 = float(edit.get('x2', 200))
                y2 = float(edit.get('y2', 200))
                color = edit.get('color', '#000000')
                width = float(edit.get('width', 1))
                
                if color.startswith('#'):
                    hex_color = color.lstrip('#')
                    rgb_color = tuple(int(hex_color[i:i+2], 16)/255.0 for i in (0, 2, 4))
                else:
                    rgb_color = (0, 0, 0)
                
                edit_type = edit.get('type')
                if edit_type == 'rectangle':
                    rect = fitz.Rect(x1, y1, x2, y2)
                    shape.draw_rect(rect)
                elif edit_type == 'circle':
                    center = fitz.Point((x1 + x2) / 2, (y1 + y2) / 2)
                    radius = min(abs(x2 - x1), abs(y2 - y1)) / 2
                    shape.draw_circle(center, radius)
                elif edit_type == 'line':
                    point1 = fitz.Point(x1, y1)
                    point2 = fitz.Point(x2, y2)
                    shape.draw_line(point1, point2)
                
                shape.finish(color=rgb_color, width=width)
                shape.commit()
                operations_applied += 1
        
        # Apply freehand drawings
        for edit in freehand_ops:
            page_num = edit.get('page', 0)
            if page_num < total_pages:
                page = pdf_doc[page_num]
                shape = page.new_shape()
                
                points = edit.get('points', [])
                color = edit.get('color', '#000000')
                width = float(edit.get('width', 2))
                
                if color.startswith('#'):
                    hex_color = color.lstrip('#')
                    rgb_color = tuple(int(hex_color[i:i+2], 16)/255.0 for i in (0, 2, 4))
                else:
                    rgb_color = (0, 0, 0)
                
                if len(points) > 1:
                    for i in range(len(points) - 1):
                        point1 = fitz.Point(points[i]['x'], points[i]['y'])
                        point2 = fitz.Point(points[i+1]['x'], points[i+1]['y'])
                        shape.draw_line(point1, point2)
                
                shape.finish(color=rgb_color, width=width)
                shape.commit()
                operations_applied += 1
        
        # Apply text
        for edit in text_ops:
            page_num = edit.get('page', 0)
            if page_num < total_pages:
                page = pdf_doc[page_num]
                
                text = edit.get('text', '')
                x = float(edit.get('x', 100))
                y = float(edit.get('y', 100))
                font_size = int(edit.get('fontSize', 12))
                color = edit.get('color', '#000000')
                
                if color.startswith('#'):
                    hex_color = color.lstrip('#')
                    rgb_color = tuple(int(hex_color[i:i+2], 16)/255.0 for i in (0, 2, 4))
                else:
                    rgb_color = (0, 0, 0)
                
                page.insert_text(
                    (x, y),
                    text,
                    fontsize=font_size,
                    color=rgb_color,
                    overlay=True
                )
                operations_applied += 1
        
        # Apply images
        for edit in image_ops:
            page_num = edit.get('page', 0)
            if page_num < total_pages:
                page = pdf_doc[page_num]
                
                image_data = edit.get('imageData', '')
                x = float(edit.get('x', 100))
                y = float(edit.get('y', 100))
                width = float(edit.get('width', 100))
                height = float(edit.get('height', 100))
                
                if image_data:
                    try:
                        if image_data.startswith('data:image'):
                            image_data = image_data.split(',')[1]
                        
                        image_bytes = base64.b64decode(image_data)
                        image_rect = fitz.Rect(x, y, x + width, y + height)
                        page.insert_image(image_rect, stream=image_bytes)
                        operations_applied += 1
                    except Exception:
                        continue  # Skip invalid images
        
        # Save the edited PDF
        pdf_doc.save(output_path)
        pdf_doc.close()
        
        return {
            "success": True,
            "message": f"PDF edited successfully with {operations_applied} operations applied to {total_pages} pages."
        }
        
    except ImportError:
        raise ImportError("PyMuPDF (fitz) library not available")
    except Exception as e:
        raise Exception(f"PDF editing failed: {str(e)}")

def main():
    if len(sys.argv) < 4:
        print(json.dumps({"success": False, "error": "Invalid arguments"}))
        sys.exit(1)
    
    operation = sys.argv[1]
    input_path = sys.argv[2]
    output_path = sys.argv[3]
    
    try:
        if operation == "edit":
            if len(sys.argv) < 5:
                raise ValueError("Usage: python pdf_editor.py edit <input> <output> <edits_file>")
            
            edits_file = sys.argv[4]
            with open(edits_file, 'r') as f:
                edit_operations = json.load(f)
            
            result = edit_pdf_comprehensive(input_path, output_path, edit_operations)
            print(json.dumps(result))
            
        else:
            raise ValueError(f"Unknown operation: {operation}")
            
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()