import { pdfjs } from "react-pdf";
import * as mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun } from "docx";
import pptxgen from "pptxgenjs";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- Helpers ---
const extractTextFromPdf = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(" ");
    fullText += pageText + "\n\n";
  }
  return fullText;
};

const extractImagesFromPdf = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const images = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
    images.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.8), width: viewport.width, height: viewport.height });
  }
  return images;
};

// --- Conversions ---

export const convertPdfToDocx = async (file) => {
  const text = await extractTextFromPdf(file);
  const doc = new Document({
    sections: [{
      children: text.split("\n\n").map(paragraph => new Paragraph({
        children: [new TextRun(paragraph)]
      }))
    }]
  });
  return await Packer.toBlob(doc);
};

export const convertPdfToPptx = async (file) => {
  const images = await extractImagesFromPdf(file);
  const text = await extractTextFromPdf(file);
  const pres = new pptxgen();
  
  images.forEach(img => {
    const slide = pres.addSlide();
    slide.addImage({ data: img.dataUrl, x: 0, y: 0, w: "100%", h: "100%", sizing: { type: "contain" } });
  });

  const textSlide = pres.addSlide();
  // Simple text dump limit to prevent PowerPoint crash from massive text strings on one slide
  textSlide.addText(text.substring(0, 5000) + (text.length > 5000 ? "..." : ""), { 
    x: 0.5, y: 0.5, w: "90%", h: "90%", align: "left", fontSize: 10, valign: "top" 
  });

  const blob = await pres.write({ outputType: "blob" });
  return blob;
};

export const convertPdfToXlsx = async (file) => {
  const text = await extractTextFromPdf(file);
  const lines = text.split("\n");
  const data = lines.map(line => [line]);
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Converted PDF");
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};

export const convertPdfToJpg = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({ canvasContext: context, viewport }).promise;
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  
  // convert dataurl to blob
  const res = await fetch(dataUrl);
  return await res.blob();
};

export const convertDocxToPdf = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;
  
  const container = document.createElement("div");
  container.innerHTML = html || "<p>Blank Document</p>";
  container.style.width = "800px";
  container.style.padding = "40px";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.background = "white";
  container.style.color = "black";
  container.style.position = "absolute";
  container.style.left = "-9999px";
  document.body.appendChild(container);
  
  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    
    const pdf = new jsPDF("p", "pt", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    if (pdfHeight > pageHeight) {
        let heightLeft = pdfHeight;
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) {
            position -= pageHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
        }
    } else {
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    }
    
    document.body.removeChild(container);
    return pdf.output("blob");
  } catch (err) {
    document.body.removeChild(container);
    throw err;
  }
};
