import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import {
  Download,
  ArrowLeft,
  FileText,
  RefreshCw,
  GripVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { getTimestampedFilename } from "../../utils/fileUtils";

const OrganizePdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleFileSelected = async (files) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setDownloadResult(null);

    // Load PDF and get page count
    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pageCount = pdfDoc.getPageCount();

      // Create page array
      const pagesArray = Array.from({ length: pageCount }, (_, i) => ({
        pageNumber: i + 1,
        originalIndex: i,
        currentIndex: i,
      }));
      setPages(pagesArray);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Failed to load PDF. Please try again.");
    }
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newPages = [...pages];
    const draggedPage = newPages[draggedIndex];
    newPages.splice(draggedIndex, 1);
    newPages.splice(targetIndex, 0, draggedPage);

    // Update current indices
    newPages.forEach((page, index) => {
      page.currentIndex = index;
    });

    setPages(newPages);
    setDraggedIndex(null);
  };

  const resetOrder = () => {
    const sortedPages = [...pages].sort(
      (a, b) => a.originalIndex - b.originalIndex
    );
    sortedPages.forEach((page, index) => {
      page.currentIndex = index;
    });
    setPages(sortedPages);
  };

  const reverseOrder = () => {
    const reversedPages = [...pages].reverse();
    reversedPages.forEach((page, index) => {
      page.currentIndex = index;
    });
    setPages(reversedPages);
  };

  const organizePdf = async () => {
    if (!file || pages.length === 0) return;

    setIsProcessing(true);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const newPdfDoc = await PDFDocument.create();

      // Copy pages in the new order
      for (const page of pages) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [
          page.originalIndex,
        ]);
        newPdfDoc.addPage(copiedPage);
      }

      const pdfBytes = await newPdfDoc.save();

      // Download the result
      const result = await downloadPdf(
        pdfBytes,
        getTimestampedFilename("organized")
      );
      setDownloadResult(result);
    } catch (error) {
      console.error("Error organizing PDF:", error);
      alert("Failed to organize PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const hasChanges = pages.some((page, index) => page.originalIndex !== index);

  return (
    <div className="page-container">
      <button className="back-btn" onClick={() => navigate("/pdf-editor")}>
        <ArrowLeft size={18} /> Back
      </button>

      <header style={{ marginBottom: "20px", textAlign: "center" }}>
        <h2 className="neon-text">Organize PDF</h2>
        <p style={{ color: "#888" }}>Drag and drop to reorder pages</p>
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
            {!downloadResult ? (
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
                    <span className="counter-badge">{pages.length}</span>
                    <span className="counter-label">total pages</span>
                  </div>
                  <div className="control-buttons">
                    <button className="control-btn" onClick={reverseOrder}>
                      Reverse Order
                    </button>
                    <button
                      className="control-btn"
                      onClick={resetOrder}
                      disabled={!hasChanges}
                    >
                      Reset Order
                    </button>
                  </div>
                </div>

                <div className="info-banner">
                  <GripVertical size={18} />
                  <span>Drag and drop pages to reorder them</span>
                </div>

                <div className="pages-list">
                  {pages.map((page, index) => (
                    <div
                      key={`${page.originalIndex}-${index}`}
                      className={`page-item ${
                        draggedIndex === index ? "dragging" : ""
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                    >
                      <div className="drag-handle">
                        <GripVertical size={20} />
                      </div>
                      <div className="page-info">
                        <div className="page-badge">Page {page.pageNumber}</div>
                        <div className="page-position">
                          Position: {index + 1}
                        </div>
                      </div>
                      {page.originalIndex !== index && (
                        <div className="moved-indicator">Moved</div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  className="btn-organize"
                  onClick={organizePdf}
                  disabled={isProcessing || !hasChanges}
                  style={{ width: "100%", marginTop: "20px" }}
                >
                  {isProcessing
                    ? "Organizing..."
                    : hasChanges
                    ? "Save New Order"
                    : "No Changes to Save"}
                </button>
              </>
            ) : (
              <div className="result-section">
                <div className="success-icon-wrapper">
                  <div className="success-icon-ring"></div>
                  <Download size={32} className="success-icon" />
                </div>

                <h3 className="success-title">PDF Organized Successfully!</h3>
                <p className="success-subtitle">
                  Your pages have been reordered. PDF is ready to download.
                </p>

                <div className="download-action-area">
                  <div className="file-preview-card">
                    <FileText
                      size={24}
                      style={{ color: "var(--accent-color)" }}
                    />
                    <span className="file-name-display">
                      {downloadResult?.filename || "organized.pdf"}
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
                    setFile(null);
                    setPages([]);
                    setDownloadResult(null);
                  }}
                >
                  Organize Another PDF
                </button>
              </div>
            )}
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

        .control-btn:hover:not(:disabled) {
          border-color: var(--primary-color);
          color: var(--primary-color);
          background: rgba(64, 224, 208, 0.05);
        }

        .control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .info-banner {
          margin-top: 20px;
          padding: 12px 16px;
          background: rgba(0, 255, 200, 0.1);
          border: 1px solid rgba(0, 255, 200, 0.3);
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--accent-color);
          font-size: 0.9rem;
        }

        .pages-list {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .page-item {
          background: var(--surface-color);
          border: 2px solid #333;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: grab;
          transition: all 0.3s ease;
        }

        .page-item:hover {
          border-color: var(--primary-color);
          transform: translateX(4px);
        }

        .page-item.dragging {
          opacity: 0.5;
          cursor: grabbing;
        }

        .drag-handle {
          color: #666;
          display: flex;
          align-items: center;
        }

        .page-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .page-badge {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .page-position {
          color: #888;
          font-size: 0.85rem;
        }

        .moved-indicator {
          background: var(--accent-color);
          color: #000;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .btn-organize {
          background: var(--accent-color);
          color: #000;
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
          box-shadow: 0 0 20px rgba(0, 255, 200, 0.3);
        }

        .btn-organize:hover:not(:disabled) {
          background: #00ffc8;
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(0, 255, 200, 0.5);
        }

        .btn-organize:disabled {
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
      `}</style>
    </div>
  );
};

export default OrganizePdf;
