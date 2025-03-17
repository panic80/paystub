import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for PDF.js using unpkg (more reliable than cdnjs)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

/**
 * Extract text from a PDF
 * @param {ArrayBuffer} pdfData - The PDF file data
 * @param {number} pageNumber - The page number to extract text from (1-indexed)
 * @returns {Promise<string>} The extracted text
 */
const extractTextFromPdf = async (pdfData, pageNumber) => {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    
    // Get the specified page
    const page = await pdf.getPage(pageNumber);
    
    // Extract text content
    const textContent = await page.getTextContent();
    
    // Concatenate the text items
    const text = textContent.items.map(item => item.str).join('\n');
    
    return text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return "";
  }
};

/**
 * Extract information from PDF text content (similar to Python's extract_info)
 * @param {string} text - The text content extracted from the PDF
 * @returns {Object} Object containing name, date, amount, and company
 */
export const extractInformation = (text) => {
  console.log("Full extracted text:", text);
  console.log("------------------------");
  
  // Split text similar to Python version
  const parts = text.split("4300", 1);
  const processText = parts.length > 1 ? parts[1] : text;
  
  // Extract name using regex
  const nameMatch = processText.match(/([A-Z][A-Za-z\s]+)\n/);
  const name = nameMatch ? nameMatch[1].trim() : "Unknown";
  
  // Extract date using regex
  const dateMatch = processText.match(/Cheque Date:?\s*(.*?)(?:\n|$)/i);
  let date = "Unknown_Date";
  
  if (dateMatch) {
    const dateStr = dateMatch[1].trim();
    console.log(`Extracted date string: '${dateStr}'`);
    
    // Try different date formats
    const dateFormats = [
      { regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/, format: (m) => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` }, // dd/mm/yyyy
      { regex: /(\d{1,2})-(\d{1,2})-(\d{4})/, format: (m) => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` }, // dd-mm-yyyy
      { regex: /(\d{1,2})\/(\d{1,2})\/(\d{2})/, format: (m) => `20${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` }, // dd/mm/yy
      { regex: /(\d{1,2})-(\d{1,2})-(\d{2})/, format: (m) => `20${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` }, // dd-mm-yy
      { regex: /(\w+)\s+(\d{1,2}),\s+(\d{4})/, format: (m) => {
        const months = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 
                         'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
        return `${m[3]}-${months[m[1]] || '01'}-${m[2].padStart(2, '0')}`;
      }}, // Month dd, yyyy
    ];
    
    for (const format of dateFormats) {
      const match = dateStr.match(format.regex);
      if (match) {
        date = format.format(match);
        console.log(`Parsed date: ${date}`);
        break;
      }
    }
  } else {
    console.log("No date found in the text");
  }
  
  // Extract amount (Net Pay)
  let amount = null;
  const amountMatch = processText.match(/Net Pay:?\s*\$?([\d,]+\.\d{2})/i);
  if (amountMatch) {
    const amountStr = amountMatch[1].replace(',', '');
    amount = parseFloat(amountStr);
    console.log(`Extracted amount: $${amount}`);
  } else {
    console.log("No amount found in the text");
  }
  
  // Extract company
  let company = "Unknown Company";
  const companyMatch = processText.match(/Company:?\s*(.*?)(?:\n|$)/i);
  if (companyMatch) {
    company = companyMatch[1].trim();
    console.log(`Extracted company: ${company}`);
  } else {
    console.log("No company found in the text");
  }
  
  console.log(`Final result - Name: ${name}, Date: ${date}, Amount: $${amount}, Company: ${company}`);
  return { name, date, amount, company };
};

/**
 * Create a copy of an ArrayBuffer
 * @param {ArrayBuffer} arrayBuffer - The ArrayBuffer to copy
 * @returns {ArrayBuffer} A new ArrayBuffer with the same content
 */
const copyArrayBuffer = (arrayBuffer) => {
  const copy = new ArrayBuffer(arrayBuffer.byteLength);
  new Uint8Array(copy).set(new Uint8Array(arrayBuffer));
  return copy;
};

/**
 * Split a PDF into individual pages and extract information
 * @param {ArrayBuffer} pdfData - The PDF file data
 * @param {Function} progressCallback - Callback for progress updates (0-100)
 * @returns {Promise<Array>} Array of objects with page data and extracted info
 */
export const splitPdf = async (pdfData, progressCallback = () => {}) => {
  try {
    // Make a copy of the array buffer for pdf.js
    const pdfJsBuffer = copyArrayBuffer(pdfData);
    
    // Load PDF document for processing pages
    progressCallback(5);
    const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfJsBuffer }).promise;
    const pageCount = pdfjsDoc.numPages;
    console.log(`PDF has ${pageCount} pages`);
    progressCallback(10);
    
    // Make another copy for pdf-lib
    const pdfLibBuffer = copyArrayBuffer(pdfData);
    
    // Load PDF document for creating individual PDFs
    const pdfDoc = await PDFDocument.load(pdfLibBuffer);
    progressCallback(15);
    
    const results = [];
    
    // Process each page - following the Python implementation's logic
    for (let i = 0; i < pageCount; i++) {
      const pageNumber = i + 1;
      const progressStart = 15;
      const progressPerPage = 80 / pageCount;
      const currentProgress = progressStart + (progressPerPage * i);
      
      progressCallback(currentProgress);
      console.log(`Processing page ${pageNumber}/${pageCount}`);
      
      try {
        // Extract text content
        const page = await pdfjsDoc.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join('\n');
        
        // Extract information
        const { name, date, amount, company } = extractInformation(text);
        
        // Create a new document with just this page
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(copiedPage);
        
        // Save the new PDF
        const pdfBytes = await newPdf.save();
        
        // Add to results
        results.push({
          pageNumber,
          name,
          date,
          amount,
          company,
          filename: `${name} ${date}.pdf`,
          pdfBytes: pdfBytes
        });
        
        progressCallback(currentProgress + (progressPerPage * 0.8));
      } catch (error) {
        console.error(`Error processing page ${pageNumber}:`, error);
        // Continue with next page despite errors
      }
    }
    
    progressCallback(100);
    return results;
  } catch (error) {
    console.error("Error splitting PDF:", error);
    throw new Error(`Failed to split PDF: ${error.message}`);
  }
};
