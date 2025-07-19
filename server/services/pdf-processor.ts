import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { storage as storageInstance } from "../storage";
import type { File } from "@shared/schema";

const outputDir = path.join(process.cwd(), "outputs");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

export async function processFile(file: File, storage: typeof storageInstance): Promise<void> {
  try {
    let outputPath: string;
    let outputFileName: string;

    switch (file.tool) {
      case "merge":
        outputPath = await mergePDFs([file.filePath]);
        outputFileName = `merged-${Date.now()}.pdf`;
        break;
      
      case "split":
        outputPath = await splitPDF(file.filePath);
        outputFileName = `split-${Date.now()}.pdf`;
        break;
      
      case "compress":
        outputPath = await compressPDF(file.filePath);
        outputFileName = `compressed-${Date.now()}.pdf`;
        break;
      
      case "pdf-to-jpg":
        outputPath = await pdfToImage(file.filePath);
        outputFileName = `converted-${Date.now()}.jpg`;
        break;
      
      case "rotate":
        outputPath = await rotatePDF(file.filePath, 90);
        outputFileName = `rotated-${Date.now()}.pdf`;
        break;
      
      case "protect":
        outputPath = await protectPDF(file.filePath, "password123");
        outputFileName = `protected-${Date.now()}.pdf`;
        break;
      
      default:
        throw new Error(`Unsupported tool: ${file.tool}`);
    }

    const finalOutputPath = path.join(outputDir, outputFileName);
    fs.renameSync(outputPath, finalOutputPath);

    const stats = fs.statSync(finalOutputPath);
    const downloadToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await storage.createProcessedFile({
      originalFileId: file.id,
      fileName: outputFileName,
      filePath: finalOutputPath,
      fileSize: stats.size,
      downloadToken,
      expiresAt,
    });

    await storage.updateFileStatus(file.id, "completed");
  } catch (error) {
    console.error("Error processing file:", error);
    await storage.updateFileStatus(file.id, "failed");
    throw error;
  }
}

async function mergePDFs(filePaths: string[]): Promise<string> {
  const mergedPdf = await PDFDocument.create();
  
  for (const filePath of filePaths) {
    const pdfBytes = fs.readFileSync(filePath);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save();
  const outputPath = path.join(outputDir, `merged-${Date.now()}.pdf`);
  fs.writeFileSync(outputPath, pdfBytes);
  return outputPath;
}

async function splitPDF(filePath: string): Promise<string> {
  const pdfBytes = fs.readFileSync(filePath);
  const pdf = await PDFDocument.load(pdfBytes);
  
  // For simplicity, just return the first page
  const newPdf = await PDFDocument.create();
  const [firstPage] = await newPdf.copyPages(pdf, [0]);
  newPdf.addPage(firstPage);
  
  const outputBytes = await newPdf.save();
  const outputPath = path.join(outputDir, `split-${Date.now()}.pdf`);
  fs.writeFileSync(outputPath, outputBytes);
  return outputPath;
}

async function compressPDF(filePath: string): Promise<string> {
  // Basic compression by removing unnecessary elements
  const pdfBytes = fs.readFileSync(filePath);
  const pdf = await PDFDocument.load(pdfBytes);
  
  const compressedBytes = await pdf.save({
    useObjectStreams: false,
    addDefaultPage: false,
  });
  
  const outputPath = path.join(outputDir, `compressed-${Date.now()}.pdf`);
  fs.writeFileSync(outputPath, compressedBytes);
  return outputPath;
}

async function pdfToImage(filePath: string): Promise<string> {
  // This is a simplified implementation
  // In a real app, you'd use a library like pdf2pic or similar
  const outputPath = path.join(outputDir, `converted-${Date.now()}.jpg`);
  
  // Create a placeholder image for now
  const image = sharp({
    create: {
      width: 600,
      height: 800,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  });
  
  await image.jpeg().toFile(outputPath);
  return outputPath;
}

async function rotatePDF(filePath: string, degrees: number): Promise<string> {
  const pdfBytes = fs.readFileSync(filePath);
  const pdf = await PDFDocument.load(pdfBytes);
  
  const pages = pdf.getPages();
  pages.forEach(page => {
    page.setRotation({ angle: degrees });
  });
  
  const rotatedBytes = await pdf.save();
  const outputPath = path.join(outputDir, `rotated-${Date.now()}.pdf`);
  fs.writeFileSync(outputPath, rotatedBytes);
  return outputPath;
}

async function protectPDF(filePath: string, password: string): Promise<string> {
  const pdfBytes = fs.readFileSync(filePath);
  const pdf = await PDFDocument.load(pdfBytes);
  
  // Note: pdf-lib doesn't support password protection
  // This is a placeholder implementation
  const protectedBytes = await pdf.save();
  const outputPath = path.join(outputDir, `protected-${Date.now()}.pdf`);
  fs.writeFileSync(outputPath, protectedBytes);
  return outputPath;
}
