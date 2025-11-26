import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PdfReader = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);

  const handleFileSelected = async (files) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setCurrentPage(1);
    setZoom(100);

    try {
      // Load PDF to get page count
      const fileBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      setTotalPages(pdfDoc.getPageCount());

      // Create URL for viewing
      const blob = new Blob([fileBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Failed to load PDF. Please try again.");
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    if (zoom < 200) {
      setZoom(zoom + 25);
    }
  };

  const handleZoomOut = () => {
    if (zoom > 50) {
      setZoom(zoom - 25);
    }
  };

  const handlePageInputChange = (e) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="page-container">
      <button className="back-btn" onClick={() => navigate("/pdf-editor")}>
        <ArrowLeft size={18} /> Back
      </button>

      <header style={{ marginBottom: "20px", textAlign: "center" }}>
        <h2 className="neon-text">PDF Reader</h2>
        <p style={{ color: "#888" }}>View and navigate through PDF documents</p>
      </header>

      <div className="tool-content">
        {!file ? (
          <FileUploader
            onFilesSelected={handleFileSelected}
            accept={{ "application/pdf": [".pdf"] }}
            multiple={false}
            label="Drop a PDF file here to view"
          />
        ) : (
          <>
            <div className="file-info">
              <div className="file-info-content">
                <FileText size={24} style={{ color: "var(--accent-color)" }} />
                <div className="file-details">
                  <span className="file-label">Selected File:</span>
                  <strong className="file-name-text">{file.name}</strong>
                </div>
              </div>
              <button
                className="change-file-btn"
                onClick={() => {
                  if (pdfUrl) {
                    URL.revokeObjectURL(pdfUrl);
                  }
                  setFile(null);
                  setPdfUrl(null);
                  setCurrentPage(1);
                  setTotalPages(0);
                }}
              >
                <RefreshCw size={16} />
                Change File
              </button>
            </div>

            {pdfUrl && (
              <>
                <div className="pdf-controls">
                  <div className="page-controls">
                    <button
                      className="control-btn"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={18} />
                      Previous
                    </button>

                    <div className="page-indicator">
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={currentPage}
                        onChange={handlePageInputChange}
                        className="page-input"
                      />
                      <span className="page-divider">/</span>
                      <span className="total-pages">{totalPages}</span>
                    </div>

                    <button
                      className="control-btn"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className="zoom-controls">
                    <button
                      className="zoom-btn"
                      onClick={handleZoomOut}
                      disabled={zoom === 50}
                    >
                      <ZoomOut size={18} />
                    </button>
                    <span className="zoom-level">{zoom}%</span>
                    <button
                      className="zoom-btn"
                      onClick={handleZoomIn}
                      disabled={zoom === 200}
                    >
                      <ZoomIn size={18} />
                    </button>
                  </div>
                </div>

                <div className="pdf-viewer-container">
                  <iframe
                    key={`pdf-${currentPage}-${zoom}`}
                    src={`${pdfUrl}#page=${currentPage}&zoom=${zoom}`}
                    className="pdf-viewer"
                    title="PDF Viewer"
                  />
                </div>
              </>
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
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(64, 224, 208, 0.1);
          border-color: var(--primary-color);
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
          margin-bottom: 20px;
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

        .pdf-controls {
          background: var(--surface-color);
          border: 1px solid #333;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .page-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .control-btn {
          background: transparent;
          border: 1px solid #444;
          color: #888;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          transition: all 0.3s ease;
        }

        .control-btn:hover:not(:disabled) {
          border-color: var(--primary-color);
          color: var(--primary-color);
          background: rgba(64, 224, 208, 0.05);
        }

        .control-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
        }

        .page-input {
          width: 50px;
          background: var(--surface-color);
          border: 1px solid #444;
          color: #fff;
          padding: 6px 8px;
          border-radius: 4px;
          text-align: center;
          font-size: 0.9rem;
        }

        .page-input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .page-divider {
          color: #666;
          font-size: 0.9rem;
        }

        .total-pages {
          color: #888;
          font-size: 0.9rem;
        }

        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .zoom-btn {
          background: transparent;
          border: 1px solid #444;
          color: #888;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .zoom-btn:hover:not(:disabled) {
          border-color: var(--accent-color);
          color: var(--accent-color);
          background: rgba(0, 255, 200, 0.05);
        }

        .zoom-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .zoom-level {
          color: var(--accent-color);
          font-weight: 600;
          font-size: 0.9rem;
          min-width: 50px;
          text-align: center;
        }

        .pdf-viewer-container {
          background: var(--surface-color);
          border: 1px solid #333;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .pdf-viewer {
          width: 100%;
          height: calc(100vh - 320px);
          min-height: 600px;
          border: none;
          background: #1a1a1a;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .pdf-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .page-controls {
            justify-content: space-between;
          }

          .zoom-controls {
            justify-content: center;
          }

          .control-btn {
            flex: 1;
          }

          .pdf-viewer {
            height: calc(100vh - 380px);
            min-height: 500px;
          }
        }
      `}</style>
    </div>
  );
};

export default PdfReader;
