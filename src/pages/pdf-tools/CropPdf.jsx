import React, { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import { Download, ArrowLeft, Crop, RefreshCw, Eye } from "lucide-react";
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

const CropPdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  // PDF Dimensions from react-pdf
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  // cropBoxes maps pageNumber -> { x, y, width, height }
  const [cropBoxes, setCropBoxes] = useState({
    1: { x: 10, y: 10, width: 80, height: 80 },
  });

  // Helper to get crop box for current page
  const getCurrentCropBox = () => {
    if (cropBoxes[pageNumber]) return cropBoxes[pageNumber];
    const baseBox = cropBoxes[1] || { x: 10, y: 10, width: 80, height: 80 };
    return { x: 10, y: 10, width: baseBox.width, height: baseBox.height };
  };

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragAction, setDragAction] = useState(null); // 'move', 'resize-tl', 'resize-br', etc.

  const containerRef = useRef(null);

  const handleFileSelected = (files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setDownloadResult(null);
      setCropBoxes({ 1: { x: 10, y: 10, width: 80, height: 80 } });
      setPageNumber(1);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onPageLoadSuccess = ({ originalWidth, originalHeight, width }) => {
    setPageDimensions({ width: originalWidth, height: originalHeight });
    // Calculate scale if needed, but react-pdf handles it
  };

  // Convert percentage to PDF points for inputs
  const getMargins = (pageNum = pageNumber) => {
    const { width, height } = pageDimensions;
    if (!width || !height) return { top: 0, bottom: 0, left: 0, right: 0 };

    let box = cropBoxes[pageNum];
    if (!box) {
      const baseBox = cropBoxes[1] || { x: 10, y: 10, width: 80, height: 80 };
      box = { x: 10, y: 10, width: baseBox.width, height: baseBox.height };
    }

    const x = (box.x / 100) * width;
    const y = (box.y / 100) * height;
    const w = (box.width / 100) * width;
    const h = (box.height / 100) * height;

    return {
      left: Math.round(x),
      right: Math.round(width - (x + w)),
      top: Math.round(y),
      bottom: Math.round(height - (y + h)),
    };
  };

  const handleMarginChange = (e) => {
    const { name, value } = e.target;
    const val = parseFloat(value) || 0;
    const { width, height } = pageDimensions;
    if (!width || !height) return;

    const current = getMargins(pageNumber);
    const newMargins = { ...current, [name]: val };

    const newX = (newMargins.left / width) * 100;
    const newW = ((width - newMargins.left - newMargins.right) / width) * 100;
    const newY = (newMargins.top / height) * 100;
    const newH = ((height - newMargins.top - newMargins.bottom) / height) * 100;

    const finalW = Math.max(5, newW);
    const finalH = Math.max(5, newH);

    setCropBoxes((prev) => {
      const newBoxes = { ...prev };
      Object.keys(newBoxes).forEach((key) => {
        newBoxes[key] = {
          ...newBoxes[key],
          width: finalW,
          height: finalH,
        };
      });
      newBoxes[pageNumber] = {
        ...(newBoxes[pageNumber] || { x: 10, y: 10 }),
        x: Math.max(0, newX),
        y: Math.max(0, newY),
        width: finalW,
        height: finalH,
      };
      return newBoxes;
    });
  };

  // Mouse Interaction
  const handleMouseDown = (e, action) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragAction(action);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    setDragStart({ x: e.clientX, y: e.clientY });

    setCropBoxes((prev) => {
      const baseBox = prev[pageNumber] || { ...(prev[1] || { x: 10, y: 10, width: 80, height: 80 }), x: 10, y: 10 };
      let { x, y, width, height } = baseBox;

      let sizeChanged = false;

      if (dragAction === "move") {
        x = Math.max(0, Math.min(100 - width, x + deltaX));
        y = Math.max(0, Math.min(100 - height, y + deltaY));
      } else if (dragAction === "resize-se") {
        width = Math.max(5, Math.min(100 - x, width + deltaX));
        height = Math.max(5, Math.min(100 - y, height + deltaY));
        sizeChanged = true;
      } else if (dragAction === "resize-nw") {
        const newX = Math.max(0, Math.min(x + width - 5, x + deltaX));
        const newY = Math.max(0, Math.min(y + height - 5, y + deltaY));
        width += x - newX;
        height += y - newY;
        x = newX;
        y = newY;
        sizeChanged = true;
      }

      const newBoxes = { ...prev };
      
      if (sizeChanged) {
        Object.keys(newBoxes).forEach((key) => {
          newBoxes[key] = {
            ...newBoxes[key],
            width,
            height,
          };
        });
      }

      newBoxes[pageNumber] = { x, y, width, height };
      return newBoxes;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragAction(null);
  };

  const cropAndDownload = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page, index) => {
        const pageNum = index + 1;
        const { width, height } = page.getSize();

        let box = cropBoxes[pageNum];
        if (!box) {
          const baseBox = cropBoxes[1] || { x: 10, y: 10, width: 80, height: 80 };
          box = { x: 10, y: 10, width: baseBox.width, height: baseBox.height };
        }

        const cropX = (box.x / 100) * width;
        const cropY = height - ((box.y + box.height) / 100) * height; // bottom-left origin in pdf-lib
        const cropW = (box.width / 100) * width;
        const cropH = (box.height / 100) * height;

        if (cropW > 0 && cropH > 0) {
          page.setCropBox(cropX, cropY, cropW, cropH);
        }
      });

      const pdfBytes = await pdfDoc.save();
      const result = await downloadPdf(
        pdfBytes,
        getTimestampedFilename("cropped")
      );
      setDownloadResult(result);
    } catch (error) {
      console.error("Error cropping PDF:", error);
      alert("Failed to crop PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const margins = getMargins();

  return (
    <div
      className="page-container"
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <button className="back-btn" onClick={() => navigate("/pdf-editor")}>
        <ArrowLeft size={18} /> Back
      </button>

      <header style={{ marginBottom: "30px", textAlign: "center" }}>
        <h2 className="neon-text">Crop PDF</h2>
        <p style={{ color: "#888" }}>Drag the box to crop pages</p>
      </header>

      <div className="tool-content">
        {!file ? (
          <FileUploader
            onFilesSelected={handleFileSelected}
            accept={{ "application/pdf": [".pdf"] }}
            multiple={false}
            label="Drop PDF here to crop"
          />
        ) : (
          <div className="crop-workspace">
            <div className="controls-pane">
              <h3>Crop Margins (points)</h3>
              <p className="hint">1 inch ≈ 72 points</p>

              <div className="margin-inputs">
                <div className="input-group">
                  <label>Top</label>
                  <input
                    type="number"
                    name="top"
                    value={margins.top}
                    onChange={handleMarginChange}
                    min="0"
                  />
                </div>
                <div className="input-group">
                  <label>Bottom</label>
                  <input
                    type="number"
                    name="bottom"
                    value={margins.bottom}
                    onChange={handleMarginChange}
                    min="0"
                  />
                </div>
                <div className="input-group">
                  <label>Left</label>
                  <input
                    type="number"
                    name="left"
                    value={margins.left}
                    onChange={handleMarginChange}
                    min="0"
                  />
                </div>
                <div className="input-group">
                  <label>Right</label>
                  <input
                    type="number"
                    name="right"
                    value={margins.right}
                    onChange={handleMarginChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="btn-neon"
                  onClick={cropAndDownload}
                  disabled={isProcessing}
                >
                  <Crop size={18} /> Crop & Download
                </button>
              </div>

              {downloadResult && (
                <div className="success-message">
                  <p>✅ Cropped PDF Ready!</p>
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
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <Page
                      pageNumber={pageNumber}
                      onLoadSuccess={onPageLoadSuccess}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={400} // Fixed preview width
                    />

                    {/* Crop Overlay */}
                    <div
                      className="crop-overlay"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        backgroundColor: "rgba(0,0,0,0.5)",
                      }}
                    >
                      {/* Clear Area (Crop Box) */}
                      <div
                        className="crop-box"
                        style={{
                          position: "absolute",
                          left: `${getCurrentCropBox().x}%`,
                          top: `${getCurrentCropBox().y}%`,
                          width: `${getCurrentCropBox().width}%`,
                          height: `${getCurrentCropBox().height}%`,
                          border: "2px solid var(--accent-color)",
                          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                          pointerEvents: "all",
                          cursor: "move",
                        }}
                        onMouseDown={(e) => handleMouseDown(e, "move")}
                      >
                        {/* Resize Handles */}
                        <div
                          className="resize-handle nw"
                          onMouseDown={(e) => handleMouseDown(e, "resize-nw")}
                        />
                        <div
                          className="resize-handle se"
                          onMouseDown={(e) => handleMouseDown(e, "resize-se")}
                        />
                      </div>
                    </div>
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

        .crop-workspace {
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
          overflow: hidden;
        }

        .pdf-container-wrapper {
          border: 1px solid #333;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          background: #555;
        }

        .resize-handle {
          position: absolute;
          width: 10px;
          height: 10px;
          background: var(--accent-color);
          border-radius: 50%;
        }

        .resize-handle.nw { top: -5px; left: -5px; cursor: nw-resize; }
        .resize-handle.se { bottom: -5px; right: -5px; cursor: se-resize; }

        .hint {
          color: #888;
          font-size: 0.85rem;
          margin-top: -10px;
        }

        .margin-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          color: #ccc;
          font-size: 0.9rem;
        }

        .input-group input {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 10px;
          border-radius: 6px;
          font-size: 1rem;
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

export default CropPdf;
