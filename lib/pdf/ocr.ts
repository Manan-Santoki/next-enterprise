// @ts-nocheck
import Tesseract from "tesseract.js";
import * as pdfParse from "pdf-parse";

const PDFParser = (pdfParse as any).default || pdfParse;

/**
 * Extract text from PDF using OCR
 * Falls back to direct text extraction if text is already present
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // First try direct text extraction
    const pdfData = await PDFParser(buffer);

    // If we got substantial text, use it
    if (pdfData.text && pdfData.text.length > 100) {
      return pdfData.text;
    }

    // Otherwise, use OCR
    console.log("PDF has minimal text, using OCR...");

    // Convert PDF to image and run OCR
    // Note: In production, you'd want to convert each page to image
    // For now, we'll use a simplified approach

    const { data } = await Tesseract.recognize(buffer, "eng", {
      logger: (m) => console.log(m),
    });

    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
}

/**
 * Clean OCR text by fixing common OCR errors
 */
export function cleanOCRText(text: string): string {
  return text
    .replace(/[|]/g, "I") // Common OCR mistake
    .replace(/\s+/g, " ") // Multiple spaces to single
    .replace(/\n{3,}/g, "\n\n") // Multiple newlines to double
    .trim();
}
