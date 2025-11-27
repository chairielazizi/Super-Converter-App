import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import {
  Download,
  ArrowLeft,
  FileText,
  RefreshCw,
  Trash2,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { getTimestampedFilename } from "../../utils/fileUtils";

const DeletePdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);

  const handleFileSelected = async (files) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setPreviewUrl(null);
    setPdfBytes(null);
    setDownloadResult(null);
    setSelectedPages(new Set());

    // Load PDF and get page count
    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pageCount = pdfDoc.getPageCount();

      // Create page array
      const pagesArray = Array.from({ length: pageCount }, (_, i) => ({
        pageNumber: i + 1,
        index: i,
      }));
      setPages(pagesArray);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Failed to load PDF. Please try again.");
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const togglePageSelection = (index) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPages(newSelected);
  };

  const selectAll = () => {
    const allPages = new Set(pages.map((p) => p.index));
    setSelectedPages(allPages);
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
  };

  const deletePages = async () => {
    if (!file || selectedPages.size === 0) return;

    // Prevent deleting all pages
    if (selectedPages.size === pages.length) {
      alert("Cannot delete all pages. At least one page must remain.");
      return;
    }

    setIsProcessing(true);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const newPdfDoc = await PDFDocument.create();

      // Copy only non-selected pages
      for (let i = 0; i < pages.length; i++) {
        if (!selectedPages.has(i)) {
          const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
          newPdfDoc.addPage(copiedPage);
        }
      }

      const pdfBytesArray = await newPdfDoc.save();
      setPdfBytes(pdfBytesArray);

      const blob = new Blob([pdfBytesArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error deleting pages:", error);
      alert("Failed to delete pages. Please try again.");
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
        <h2 className="neon-text">Delete PDF Pages</h2>
        <p style={{ color: "#888" }}>Remove specific pages from your PDF</p>
      </header>

      <div className="tool-content">
        {!file ? (
          <FileUploader
            onFilesSelected={handleFileSelected}
            accept={{ "application/pdf": [".pdf"] }}
            multiple={false}
            label="Drop a PDF file here"
          />
        ) : (
          <>
            {!previewUrl && !downloadResult ? (
              <>
                <div className="file-info">
                  <div className="file-info-content">
                    <FileText
                      size={24}
                      style={{ color: "var(--accent-color)" }}
                    />
                    <div className="file-details">
                      <span className="file-label">Selected File:</span>
                      <strong className="file-name-text">{file.name}</strong>
                    </div>
                  </div>
                  <button
                    className="change-file-btn"
                    onClick={() => setFile(null)}
                  >
                    <RefreshCw size={16} />
                    Change File
                  </button>
                </div>

                <div className="selection-controls">
                  <div className="page-counter">
                    <span className="counter-badge">
                      {selectedPages.size} / {pages.length}
                    </span>
                    <span className="counter-label">pages selected</span>
                  </div>
                  <div className="control-buttons">
                    <button className="control-btn" onClick={selectAll}>
                      Select All
                    </button>
                    <button className="control-btn" onClick={deselectAll}>
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="pages-grid">
                  {pages.map((page) => (
                    <div
                      key={page.index}
                      className={`page-card ${
                        selectedPages.has(page.index) ? "selected" : ""
                      }`}
                      onClick={() => togglePageSelection(page.index)}
                    >
                      <div className="page-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedPages.has(page.index)}
                          onChange={() => {}}
                        />
                      </div>
                      <div className="page-number">Page {page.pageNumber}</div>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-delete"
                  onClick={deletePages}
                  disabled={isProcessing || selectedPages.size === 0}
                  style={{ width: "100%", marginTop: "20px" }}
                >
                  <Trash2 size={18} />
                  {isProcessing
                    ? "Deleting..."
                    : `Delete ${selectedPages.size} Page${
                        selectedPages.size !== 1 ? "s" : ""
                      }`}
                </button>
              </>
            ) : previewUrl && !downloadResult ? (
              <div className="preview-section">
                <div className="preview-header">
                  <Eye size={20} style={{ color: "var(--accent-color)" }} />
                  <h3>Preview PDF with Deleted Pages</h3>
                </div>

                <div className="pdf-viewer-container">
                  <iframe
                    src={previewUrl}
                    className="pdf-viewer"
                    title="PDF Preview"
                  />
                </div>

                <div className="preview-actions">
                  <button
                    className="btn-neon"
                    onClick={async () => {
                      const result = await downloadPdf(
                        pdfBytes,
                        getTimestampedFilename("deleted-pages")
                      );
                      setDownloadResult(result);
                    }}
                    style={{ flex: 1 }}
                  >
                    <Download size={18} />
                    Download PDF
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      setPreviewUrl(null);
                      setPdfBytes(null);
                    }}
                    style={{ flex: 1 }}
                  >
                    <RefreshCw size={18} />
                    Try Again
                  </button>
                </div>
              </div>
            ) : downloadResult ? (
              <div className="result-section">
                <div className="success-icon-wrapper">
                  <div className="success-icon-ring"></div>
                  <Download size={32} className="success-icon" />
                </div>

                <h3 className="success-title">Pages Deleted Successfully!</h3>
                <p className="success-subtitle">
                  {selectedPages.size} page{selectedPages.size !== 1 ? "s" : ""}{" "}
                  removed. Your PDF is ready.
                </p>

                <div className="download-action-area">
                  <div className="file-preview-card">
                    <FileText
                      size={24}
                      style={{ color: "var(--accent-color)" }}
                    />
                    <span className="file-name-display">
                      {downloadResult?.filename || "deleted-pages.pdf"}
                    </span>
                  </div>

                  {downloadResult?.isBrowser ? (
                    <a
                      className="btn-download-primary"
                      href={downloadResult.uri}
                      download={downloadResult.filename}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download size={18} />
                      <span>Download PDF</span>
                    </a>
                  ) : (
                    <p
                      style={{
                        marginTop: "15px",
                        color: "#00FFC8",
                        textAlign: "center",
                      }}
                    >
                      ✅ PDF saved to your device!
                    </p>
                  )}

                  <p className="download-hint">
                    {downloadResult?.isBrowser ? "" : "Check your Files app"}
                  </p>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (downloadResult?.uri && downloadResult?.isBrowser) {
                      URL.revokeObjectURL(downloadResult.uri);
                    }
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                    }
                    setFile(null);
                    setPages([]);
                    setSelectedPages(new Set());
                    setPreviewUrl(null);
                    setPdfBytes(null);
                    setDownloadResult(null);
                  }}
                >
                  Delete More Pages
                </button>
              </div>
            ) : null}
          </>
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
        }

        .tool-content {
        }

        .file-info {
          padding: 20px;
          background: var(--surface-color);
          border-radius: 12px;
          border: 1px solid #333;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .file-info-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .file-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .file-label {
          font-size: 0.75rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .file-name-text {
          font-size: 0.95rem;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .change-file-btn {
          background: transparent;
          border: 1px solid var(--primary-color);
          color: var(--primary-color);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .change-file-btn:hover {
          background: rgba(64, 224, 208, 0.1);
          border-color: var(--accent-color);
          color: var(--accent-color);
        }

        .selection-controls {
          margin-top: 20px;
          padding: 16px 20px;
          background: var(--surface-color);
          border-radius: 12px;
          border: 1px solid #333;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .page-counter {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .counter-badge {
          background: var(--accent-color);
          color: #000;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .counter-label {
          color: #888;
          font-size: 0.9rem;
        }

        .control-buttons {
          display: flex;
          gap: 10px;
        }

        .control-btn {
          background: transparent;
          border: 1px solid #444;
          color: #888;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.3s ease;
        }

        .control-btn:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
          background: rgba(64, 224, 208, 0.05);
        }

        .pages-grid {
          margin-top: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 16px;
        }

        .page-card {
          background: var(--surface-color);
          border: 2px solid #333;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          aspect-ratio: 0.7;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page-card:hover {
          border-color: var(--primary-color);
          transform: translateY(-2px);
        }

        .page-card.selected {
          border-color: var(--accent-color);
          background: rgba(0, 255, 200, 0.1);
        }

        .page-checkbox {
          position: absolute;
          top: 8px;
          right: 8px;
        }

        .page-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--accent-color);
        }

        .page-number {
          color: #fff;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .btn-delete {
          background: #ff4444;
          color: #fff;
          border: none;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 0 20px rgba(255, 68, 68, 0.3);
        }

        .btn-delete:hover:not(:disabled) {
          background: #ff6666;
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(255, 68, 68, 0.5);
        }

        .btn-delete:disabled {
          background: #333;
          color: #666;
          cursor: not-allowed;
          box-shadow: none;
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
          padding: 12px 1px;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          max-width: 100%;
          transition: all 0.3s ease;
          box-shadow: 0 0 20px rgba(0, 255, 200, 0.3);
          text-decoration: none;
          overflow: hidden;
          white-space: nowrap;
        }

        .btn-download-primary span {
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
          flex-shrink: 1;
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

        .preview-section {
          margin-top: 20px;
        }

        .preview-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
          padding: 16px;
          background: var(--surface-color);
          border-radius: 12px;
          border: 1px solid rgba(0, 255, 200, 0.2);
        }

        .preview-header h3 {
          color: #fff;
          margin: 0;
          font-size: 1.1rem;
        }

        .pdf-viewer-container {
          background: var(--surface-color);
          border: 1px solid #333;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          margin-bottom: 20px;
        }

        .pdf-viewer {
          width: 100%;
          height: calc(100vh - 450px);
          min-height: 600px;
          border: none;
          background: #1a1a1a;
        }

        .preview-actions {
          display: flex;
          gap: 16px;
        }

        .preview-actions .btn-neon,
        .preview-actions .btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .pdf-viewer {
            height: calc(100vh - 500px);
            min-height: 400px;
          }

          .preview-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default DeletePdf;
