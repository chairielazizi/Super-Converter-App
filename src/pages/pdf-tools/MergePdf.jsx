import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import { Download, X, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";

const MergePdf = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);

  const handleFilesSelected = (newFiles) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setMergedPdfUrl(null);
    setDownloadResult(null);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const mergePdfs = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    setDownloadResult(null);

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

      // Use the cross-platform download helper
      const result = await downloadPdf(pdfBytes, "merged-document.pdf");
      setDownloadResult(result);
      setMergedPdfUrl("completed"); // Just a flag to show success UI
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("Failed to merge PDFs. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-container">
      <button className="back-btn" onClick={() => navigate("/pdf-editor")}>
        <ArrowLeft size={18} /> Back
      </button>

      <header style={{ marginBottom: "20px", textAlign: "center" }}>
        <h2 className="neon-text">Merge PDF</h2>
        <p style={{ color: "#888" }}>Combine multiple PDF files into one</p>
      </header>

      <div className="tool-content">
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
            {isProcessing ? "Merging..." : `Merge ${files.length} PDFs`}
          </button>
        )}

        {mergedPdfUrl && (
          <div className="result-section">
            <div className="success-icon-wrapper">
              <div className="success-icon-ring"></div>
              <Download size={32} className="success-icon" />
            </div>

            <h3 className="success-title">Merged Successfully!</h3>
            <p className="success-subtitle">
              Your files have been combined into one PDF.
            </p>

            {downloadResult?.isBrowser ? (
              <div className="download-action-area">
                <div className="file-preview-card">
                  <FileText
                    size={24}
                    style={{ color: "var(--accent-color)" }}
                  />
                  <span className="file-name-display">
                    {downloadResult.filename}
                  </span>
                </div>

                <button
                  className="btn-download-primary"
                  onClick={() => {
                    // Programmatic download to ensure filename is respected
                    const link = document.createElement("a");
                    link.href = downloadResult.uri;
                    link.download = downloadResult.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download size={20} />
                  Download Merged PDF
                </button>

                <p className="download-hint">
                  Clicking will save the file to your device
                </p>
              </div>
            ) : (
              <p style={{ marginTop: "15px", color: "#00FFC8" }}>
                {downloadResult?.message || "PDF saved to your device!"}
              </p>
            )}

            <button
              className="btn-secondary"
              onClick={() => {
                if (downloadResult?.uri && downloadResult?.isBrowser) {
                  URL.revokeObjectURL(downloadResult.uri);
                }
                setFiles([]);
                setMergedPdfUrl(null);
                setDownloadResult(null);
              }}
            >
              Merge Another PDF
            </button>
          </div>
        )}
      </div>

      <style>{`
        .back-btn {
          background: transparent;
          border: 1px solid #333;
          color: var(--primary-color);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(64, 224, 208, 0.1);
          border-color: var(--primary-color);
        }

        .tool-content {
          max-width: 600px;
          margin: 0 auto;
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
          padding: 40px 30px;
          background: linear-gradient(145deg, rgba(0, 255, 200, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%);
          border-radius: 16px;
          border: 1px solid rgba(0, 255, 200, 0.2);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .success-icon-wrapper {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-icon-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid var(--accent-color);
          opacity: 0.5;
          animation: pulse-ring 2s infinite;
        }

        .success-icon {
          color: var(--accent-color);
          z-index: 2;
          filter: drop-shadow(0 0 10px var(--accent-color));
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .success-title {
          color: #fff;
          font-size: 1.5rem;
          margin-bottom: 8px;
          text-shadow: 0 0 10px rgba(0, 255, 200, 0.3);
        }

        .success-subtitle {
          color: #888;
          margin-bottom: 30px;
        }

        .download-action-area {
          background: rgba(255, 255, 255, 0.03);
          padding: 25px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 25px;
        }

        .file-preview-card {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .file-name-display {
          color: #ddd;
          font-family: monospace;
          font-size: 0.9rem;
        }

        .btn-download-primary {
          background: var(--accent-color);
          color: #000;
          border: none;
          padding: 14px 32px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          transition: all 0.3s ease;
          box-shadow: 0 0 20px rgba(0, 255, 200, 0.3);
        }

        .btn-download-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(0, 255, 200, 0.5);
          background: #00ffc8;
        }

        .btn-download-primary:active {
          transform: translateY(0);
        }

        .download-hint {
          font-size: 0.8rem;
          color: #666;
          margin-top: 12px;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid #444;
          color: #888;
          padding: 10px 24px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          border-color: #666;
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
};

export default MergePdf;
