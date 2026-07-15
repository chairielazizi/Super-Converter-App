import React, { useState, useRef } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import { ArrowLeft, EyeOff, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { getTimestampedFilename } from "../../utils/fileUtils";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const RedactPdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  // PDF Dimensions
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  // Redaction Zones
  // Stored as { page, x, y, width, height } in PDF points
  const [redactions, setRedactions] = useState([]);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState(null);

  const containerRef = useRef(null);

  const handleFileSelected = (files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setDownloadResult(null);
      setRedactions([]);
      setPageNumber(1);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onPageLoadSuccess = ({ originalWidth, originalHeight }) => {
    setPageDimensions({ width: originalWidth, height: originalHeight });
  };

  // Convert screen coordinates to PDF points
  const getPdfCoordinates = (clientX, clientY) => {
    if (!containerRef.current || !pageDimensions.width) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = pageDimensions.width / rect.width;
    const scaleY = pageDimensions.height / rect.height;

    // PDF origin is bottom-left usually, but pdf-lib drawRectangle uses bottom-left origin?
    // Wait, pdf-lib drawRectangle (x, y) is from bottom-left.
    // Screen is top-left.

    const x = (clientX - rect.left) * scaleX;
    const screenY = (clientY - rect.top) * scaleY;
    const y = pageDimensions.height - screenY; // Flip Y

    return { x, y };
  };

  // Drawing Handlers
  const handleMouseDown = (e) => {
    if (!file) return;
    e.preventDefault();
    const coords = getPdfCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPoint) return;

    const coords = getPdfCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    // Calculate width/height based on start point
    // Note: y in PDF is from bottom.
    // If startY > currentY, height is positive?

    const width = Math.abs(coords.x - startPoint.x);
    const height = Math.abs(coords.y - startPoint.y);

    // Normalize x, y to bottom-left corner of the rect
    const x = Math.min(startPoint.x, coords.x);
    const y = Math.min(startPoint.y, coords.y);

    setCurrentRect({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (
      isDrawing &&
      currentRect &&
      currentRect.width > 0 &&
      currentRect.height > 0
    ) {
      setRedactions([
        ...redactions,
        { ...currentRect, page: pageNumber, id: Date.now() },
      ]);
    }
    setIsDrawing(false);
    setCurrentRect(null);
    setStartPoint(null);
  };

  const removeRedaction = (id) => {
    setRedactions(redactions.filter((r) => r.id !== id));
  };

  const redactAndDownload = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);

      redactions.forEach((r) => {
        if (r.page >= 1 && r.page <= pdfDoc.getPageCount()) {
          const page = pdfDoc.getPage(r.page - 1);
          page.drawRectangle({
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            color: rgb(0, 0, 0),
          });
        }
      });

      const pdfBytes = await pdfDoc.save();
      const result = await downloadPdf(
        pdfBytes,
        getTimestampedFilename("redacted")
      );
      setDownloadResult(result);
    } catch (error) {
      console.error("Error redacting PDF:", error);
      alert("Failed to redact PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to render redaction overlays on the current page
  const renderRedactionOverlays = () => {
    if (!pageDimensions.width) return null;

    // Filter redactions for current page
    const pageRedactions = redactions.filter((r) => r.page === pageNumber);

    // Add current drawing rect if exists
    const allRects = [...pageRedactions];
    if (currentRect) {
      allRects.push({ ...currentRect, isDrawing: true });
    }

    return allRects.map((r, i) => {
      // Convert PDF coords back to % for display
      // x, y are bottom-left in PDF
      // Screen X = (x / width) * 100
      // Screen Y = ((height - (y + h)) / height) * 100  <-- Top-Left origin

      const left = (r.x / pageDimensions.width) * 100;
      const bottom = (r.y / pageDimensions.height) * 100; // relative to bottom
      const width = (r.width / pageDimensions.width) * 100;
      const height = (r.height / pageDimensions.height) * 100;

      return (
        <div
          key={r.id || "drawing"}
          style={{
            position: "absolute",
            left: `${left}%`,
            bottom: `${bottom}%`,
            width: `${width}%`,
            height: `${height}%`,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            border: r.isDrawing ? "1px solid red" : "none",
            pointerEvents: "none", // Allow drawing through existing rects? Maybe not.
          }}
        />
      );
    });
  };

  return (
    <div className="page-container">
      <button className="back-btn" onClick={() => navigate("/pdf-editor")}>
        <ArrowLeft size={18} /> Back
      </button>

      <header style={{ marginBottom: "30px", textAlign: "center" }}>
        <h2 className="neon-text">Redact PDF</h2>
        <p style={{ color: "#888" }}>Draw boxes to black out sensitive info</p>
      </header>

      <div className="tool-content">
        {!file ? (
          <FileUploader
            onFilesSelected={handleFileSelected}
            accept={{ "application/pdf": [".pdf"] }}
            multiple={false}
            label="Drop PDF here to redact"
          />
        ) : (
          <div className="redact-workspace">
            <div className="controls-pane">
              <h3>Redaction Zones</h3>
              <p className="hint">Draw on the PDF to add zones</p>

              <div className="redactions-list">
                <h4>Active Redactions ({redactions.length})</h4>
                {redactions.length === 0 ? (
                  <p className="empty-list">No redactions added yet.</p>
                ) : (
                  <ul>
                    {redactions.map((r) => (
                      <li key={r.id}>
                        <span>
                          P{r.page}: ({Math.round(r.x)}, {Math.round(r.y)})
                        </span>
                        <button onClick={() => removeRedaction(r.id)}>
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="action-buttons">
                <button
                  className="btn-neon"
                  onClick={redactAndDownload}
                  disabled={isProcessing || redactions.length === 0}
                >
                  <EyeOff size={18} /> Redact & Download
                </button>
              </div>

              {downloadResult && (
                <div className="success-message">
                  <p>✅ Redacted PDF Ready!</p>
                  {downloadResult.isBrowser && (
                    <a
                      href={downloadResult.uri}
                      download={downloadResult.filename}
                      className="download-link"
                    >
                      Download Again
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="preview-pane">
              <div className="pdf-container-wrapper">
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="pdf-document"
                >
                  <div
                    className="page-wrapper"
                    ref={containerRef}
                    style={{
                      position: "relative",
                      display: "inline-block",
                      cursor: "crosshair",
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <Page
                      pageNumber={pageNumber}
                      onLoadSuccess={onPageLoadSuccess}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={500} // Fixed preview width
                    />

                    {/* Redaction Overlays */}
                    {renderRedactionOverlays()}
                  </div>
                </Document>
              </div>

              {numPages > 1 && (
                <div className="page-controls">
                  <button
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber((p) => p - 1)}
                  >
                    Prev
                  </button>
                  <span>
                    Page {pageNumber} of {numPages}
                  </span>
                  <button
                    disabled={pageNumber >= numPages}
                    onClick={() => setPageNumber((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
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
        }

        .redact-workspace {
          display: flex;
          flex-wrap: wrap;
          gap: 30px;
          justify-content: center;
          align-items: flex-start;
        }

        .controls-pane {
          flex: 1;
          min-width: 300px;
          max-width: 400px;
          background: var(--surface-color);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .preview-pane {
          flex: 2;
          min-width: 300px;
          background: var(--surface-color);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pdf-container-wrapper {
          border: 1px solid #333;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          background: #555;
        }

        .hint {
          color: #888;
          font-size: 0.85rem;
          margin-top: -10px;
        }

        .redactions-list {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 12px;
          max-height: 300px;
          overflow-y: auto;
        }

        .redactions-list h4 {
          margin: 0 0 10px 0;
          font-size: 0.9rem;
          color: #aaa;
        }

        .redactions-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .redactions-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.85rem;
        }

        .redactions-list li button {
          background: transparent;
          border: none;
          color: #ff4444;
          cursor: pointer;
          padding: 4px;
        }

        .empty-list {
          color: #666;
          font-size: 0.85rem;
          text-align: center;
          font-style: italic;
        }

        .btn-neon {
          background: var(--accent-color);
          color: #000;
          border: none;
          padding: 12px 24px;
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

        .btn-neon:hover:not(:disabled) {
          background: #00ffc8;
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(0, 255, 200, 0.5);
        }

        .page-controls {
          display: flex;
          gap: 10px;
          margin-top: 15px;
          align-items: center;
        }
        
        .page-controls button {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .page-controls button:disabled {
          opacity: 0.5;
        }

        .success-message {
          margin-top: 10px;
          padding: 12px;
          background: rgba(0, 255, 200, 0.1);
          border: 1px solid rgba(0, 255, 200, 0.3);
          border-radius: 8px;
          text-align: center;
        }

        .download-link {
          color: var(--accent-color);
          text-decoration: underline;
          font-size: 0.9rem;
          display: block;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default RedactPdf;
