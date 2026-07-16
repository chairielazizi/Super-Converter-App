import React, { useState } from "react";
import FileUploader from "../../components/FileUploader";
import { ArrowLeft, FileType, FileText, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTimestampedFilename } from "../../utils/fileUtils";
import { pdfjs } from 'react-pdf';

// Ensure worker is set up for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PdfConverter = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [downloadResult, setDownloadResult] = useState(null);

  const handleFilesSelected = (newFiles) => {
    const selectedFile = newFiles[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setExtractedText("");
    setDownloadResult(null);
  };

  const extractTextFromPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      const fileBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: fileBuffer }).promise;
      
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }
      
      setExtractedText(fullText);
    } catch (error) {
      console.error("Error extracting text:", error);
      alert("Failed to extract text from this PDF. It may be a scanned image or protected.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTxt = () => {
    if (!extractedText) return;
    
    const blob = new Blob([extractedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const filename = getTimestampedFilename("extracted-text").replace('.pdf', '.txt');
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setDownloadResult({ isBrowser: true, filename });
  };

  return (
    <div className="page-container">
      <button className="back-btn" onClick={() => navigate("/pdf-editor")}>
        <ArrowLeft size={18} /> Back
      </button>

      <header style={{ marginBottom: "20px", textAlign: "center" }}>
        <h2 className="neon-text">PDF to Text Converter</h2>
        <p style={{ color: "#888" }}>Extract plain text from your PDF documents</p>
      </header>

      <div className="tool-content">
        {!file ? (
          <FileUploader
            onFilesSelected={handleFilesSelected}
            accept={{ "application/pdf": [".pdf"] }}
            multiple={false}
            label="Drop a PDF file here to extract text"
          />
        ) : !extractedText ? (
          <div className="options-panel">
            <div className="file-info-header">
              <FileType size={24} style={{ color: "var(--primary-color)" }} />
              <h3>{file.name}</h3>
            </div>
            
            <button
              className="btn-neon"
              onClick={extractTextFromPdf}
              disabled={isProcessing}
              style={{ width: "100%", padding: "14px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}
            >
              <FileText size={20} />
              {isProcessing ? "Extracting Text..." : "Extract Text"}
            </button>

            <button
              className="btn-secondary"
              onClick={() => setFile(null)}
              style={{ width: "100%", marginTop: "15px" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="preview-section">
            <div className="preview-header">
              <FileText size={20} style={{ color: "var(--accent-color)" }} />
              <h3>Extracted Text</h3>
            </div>
            
            <div className="text-viewer-container">
              <textarea 
                value={extractedText} 
                readOnly 
                className="text-viewer"
              />
            </div>

            <div className="preview-actions" style={{display: 'flex', gap: '15px'}}>
              <button
                className="btn-neon"
                onClick={handleDownloadTxt}
                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                <Download size={18} /> Download .txt
              </button>
              
              <button
                className="btn-secondary"
                onClick={() => {
                  setFile(null);
                  setExtractedText("");
                  setDownloadResult(null);
                }}
                style={{ flex: 1 }}
              >
                Convert Another
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .back-btn { background: transparent; border: 1px solid #333; color: var(--primary-color); padding: 8px 16px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-bottom: 20px; transition: all 0.3s ease; }
        .back-btn:hover { background: rgba(64, 224, 208, 0.1); border-color: var(--primary-color); }
        .options-panel { background: var(--surface-color); padding: 30px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); }
        .file-info-header { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        .file-info-header h3 { margin: 0; font-size: 1.2rem; color: #fff; text-align: center; word-break: break-all; }
        .preview-section { margin-top: 20px; }
        .preview-header { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px; padding: 16px; background: var(--surface-color); border-radius: 12px; border: 1px solid rgba(0, 255, 200, 0.2); }
        .text-viewer-container { background: var(--surface-color); border: 1px solid #333; border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
        .text-viewer { width: 100%; height: 400px; padding: 20px; background: #1a1a1a; color: #eee; border: none; font-family: monospace; font-size: 14px; line-height: 1.5; resize: vertical; box-sizing: border-box; }
        .text-viewer:focus { outline: none; }
        .btn-neon { background: var(--primary-color); color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; padding: 12px; }
        .btn-neon:hover { transform: translateY(-2px); box-shadow: 0 0 15px rgba(64, 224, 208, 0.4); }
        .btn-secondary { background: transparent; border: 1px solid #444; color: #888; padding: 12px 24px; border-radius: 6px; cursor: pointer; transition: all 0.3s ease; }
        .btn-secondary:hover { border-color: #666; color: #fff; background: rgba(255, 255, 255, 0.05); }
      `}</style>
    </div>
  );
};

export default PdfConverter;
