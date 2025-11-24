import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../components/FileUploader";
import { Download, Layers, PenTool, X, FileText } from "lucide-react";

const PdfEditor = () => {
  const [files, setFiles] = useState([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("merge"); // 'merge' | 'annotate'

  const handleFilesSelected = (newFiles) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setMergedPdfUrl(null); // Reset previous result
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const mergePdfs = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const fileBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("Failed to merge PDFs. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-container">
      <header style={{ marginBottom: "20px" }}>
        <h2 className="neon-text">PDF Editor</h2>
      </header>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "merge" ? "active" : ""}`}
          onClick={() => setActiveTab("merge")}
        >
          <Layers size={18} /> Merge
        </button>
        <button
          className={`tab-btn ${activeTab === "annotate" ? "active" : ""}`}
          onClick={() => setActiveTab("annotate")}
        >
          <PenTool size={18} /> Annotate
        </button>
      </div>

      <div className="content-area">
        {activeTab === "merge" && (
          <div className="merge-section">
            <FileUploader
              onFilesSelected={handleFilesSelected}
              accept={{ "application/pdf": [".pdf"] }}
              multiple={true}
              label="Drop PDF files here to merge"
            />

            {files.length > 0 && (
              <div className="file-list">
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <FileText size={20} className="file-icon" />
                    <span className="file-name">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="remove-btn"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length >= 2 && (
              <button
                className="btn-neon"
                onClick={mergePdfs}
                disabled={isProcessing}
                style={{ width: "100%", marginTop: "20px" }}
              >
                {isProcessing ? "Merging..." : "Merge PDFs"}
              </button>
            )}

            {mergedPdfUrl && (
              <div className="result-section">
                <h3 style={{ color: "#00FFC8" }}>Success!</h3>
                <a
                  href={mergedPdfUrl}
                  download="merged-document.pdf"
                  className="btn-neon"
                >
                  <Download size={18} style={{ marginRight: "8px" }} /> Download
                  Merged PDF
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === "annotate" && (
          <div className="annotate-section">
            <p
              style={{ color: "#888", textAlign: "center", marginTop: "40px" }}
            >
              Annotation tools coming soon!
            </p>
          </div>
        )}
      </div>

      <style>{`
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .tab-btn {
          background: transparent;
          border: 1px solid #333;
          color: #888;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .tab-btn.active {
          background: rgba(64, 224, 208, 0.1);
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        .file-list {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .file-item {
          background: var(--surface-color);
          padding: 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          border: 1px solid #333;
        }

        .file-icon {
          color: var(--primary-color);
          margin-right: 12px;
        }

        .file-name {
          flex: 1;
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .remove-btn {
          background: transparent;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 4px;
        }

        .remove-btn:hover {
          color: var(--danger-color);
        }

        .result-section {
          margin-top: 30px;
          text-align: center;
          padding: 20px;
          background: rgba(0, 255, 200, 0.05);
          border-radius: 12px;
          border: 1px dashed var(--accent-color);
        }
      `}</style>
    </div>
  );
};

export default PdfEditor;
