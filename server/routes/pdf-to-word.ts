import express from 'express';
import multer from 'multer';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const router = express.Router();
const unlink = promisify(fs.unlink);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `pdf-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Helper function to clean up files
async function cleanupFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      await unlink(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Failed to cleanup file ${filePath}:`, error);
  }
}

// PDF to Word conversion endpoint
router.post('/api/pdf-to-word', upload.single('pdf'), async (req, res) => {
  let uploadedFilePath: string | undefined;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    uploadedFilePath = req.file.path;
    console.log(`Processing PDF: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    // Dynamic import to avoid initialization issues
    let pdfParse;
    try {
      pdfParse = (await import('pdf-parse')).default;
    } catch (importError) {
      console.error('Failed to import pdf-parse:', importError);
      return res.status(500).json({ error: 'PDF processing library unavailable' });
    }

    // Read and parse PDF file
    const pdfBuffer = fs.readFileSync(uploadedFilePath);
    let pdfData;
    
    try {
      pdfData = await pdfParse(pdfBuffer);
    } catch (parseError) {
      console.error('PDF parsing error:', parseError);
      return res.status(400).json({ 
        error: 'Failed to parse PDF. The file may be corrupted or heavily encrypted.' 
      });
    }

    const extractedText = pdfData.text?.trim() || '';
    
    // Check if text was extracted
    if (!extractedText || extractedText.length < 10) {
      return res.status(400).json({ 
        error: 'This PDF contains only images and cannot be converted to Word.' 
      });
    }

    console.log(`Extracted ${extractedText.length} characters from PDF`);

    // Create Word document using docx library
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: createParagraphsFromText(extractedText),
        },
      ],
    });

    // Generate Word document buffer
    const docxBuffer = await Packer.toBuffer(doc);

    // Set response headers for file download
    const filename = `${path.parse(req.file.originalname).name}_converted.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', docxBuffer.length);

    // Send the Word document
    res.send(docxBuffer);
    
    console.log(`Successfully converted PDF to Word: ${filename}`);

  } catch (error) {
    console.error('PDF to Word conversion error:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 20MB limit' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Internal server error during PDF conversion' 
    });
  } finally {
    // Clean up uploaded file
    if (uploadedFilePath) {
      setTimeout(() => cleanupFile(uploadedFilePath!), 1000); // Cleanup after 1 second
    }
  }
});

// Helper function to create paragraphs from text
function createParagraphsFromText(text: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  // Split text into paragraphs (by double newlines or single newlines)
  const textParagraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  if (textParagraphs.length === 0) {
    // If no paragraph breaks found, split by single newlines
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    for (const line of lines) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.trim(),
            }),
          ],
        })
      );
    }
  } else {
    // Process each paragraph
    for (const paragraphText of textParagraphs) {
      const lines = paragraphText.split('\n').filter(line => line.trim().length > 0);
      
      // Create a paragraph with multiple text runs for line breaks
      const textRuns: TextRun[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        textRuns.push(new TextRun({ text: lines[i].trim() }));
        
        // Add line break if not the last line
        if (i < lines.length - 1) {
          textRuns.push(new TextRun({ text: '', break: 1 }));
        }
      }
      
      paragraphs.push(
        new Paragraph({
          children: textRuns,
        })
      );
    }
  }
  
  return paragraphs.length > 0 ? paragraphs : [
    new Paragraph({
      children: [
        new TextRun({
          text: text || 'No text content found in the PDF.',
        }),
      ],
    }),
  ];
}

export default router;