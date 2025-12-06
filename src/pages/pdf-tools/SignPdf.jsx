import React, { useState, useRef, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import {
  Download,
  ArrowLeft,
  FileText,
  RefreshCw,
  Edit3,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { getTimestampedFilename } from "../../utils/fileUtils";

const SignPdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [signatureImage, setSignatureImage] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pdfBytes, setPdfBytes] = useState(null);

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const handleFileSelected = async (files) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setDownloadResult(null);

      const fileBuffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(fileBuffer);
      setPdfDoc(pdf);
      setTotalPages(pdf.getPageCount());

      const blob = new Blob([fileBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    }
  };

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureImage(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const image = canvas.toDataURL("image/png");
    setSignatureImage(image);
  };

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 600;
      canvas.height = 300;
      canvas.style.width = "300px";
      canvas.style.height = "150px";

      const context = canvas.getContext("2d");
      context.scale(2, 2);
      context.lineCap = "round";
      context.strokeStyle = "black";
      context.lineWidth = 2;
      contextRef.current = context;
    }
  }, [file]);

  const signPdf = async () => {
    if (!file || !signatureImage || !pdfDoc) return;
    setIsProcessing(true);

    try {
      const pngImageBytes = await fetch(signatureImage).then((res) =>
        res.arrayBuffer()
      );
      const pngImage = await pdfDoc.embedPng(pngImageBytes);

      const page = pdfDoc.getPage(currentPage - 1);
      const { width, height } = page.getSize();

      const sigDims = pngImage.scale(0.5);

      page.drawImage(pngImage, {
        x: width / 2 - sigDims.width / 2,
        y: 50,
        width: sigDims.width,
        height: sigDims.height,
      });

      const bytes = await pdfDoc.save();
      setPdfBytes(bytes);

      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error signing PDF:", error);
      alert("Failed to sign PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-container">
      <button className="back-btn" onClick={() => navigate("/pdf-editor")}>
        <ArrowLeft size={18} /> Back
      </button>

      <header style={{ marginBottom: "30px", textAlign: "center" }}>
        <h2 className="neon-text">Sign PDF</h2>
        <p style={{ color: "#888" }}>Draw and add your signature to a PDF</p>
      </header>

      <div className="tool-content">
        {!file ? (
          <FileUploader
            onFilesSelected={handleFileSelected}
            accept={{ "application/pdf": [".pdf"] }}
            multiple={false}
            label="Drop PDF here to sign"
          />
        ) : (
          <>
            {!downloadResult && !pdfBytes ? (
              <div className="sign-workspace">
                <div className="pdf-preview-pane">
                  <h3>
                    Preview (Page {currentPage} of {totalPages})
                  </h3>
                  <div className="iframe-container">
                    <iframe src={previewUrl} title="PDF Preview" />
                  </div>
                  <div className="page-controls">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <span>Page {currentPage}</span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="signature-pane">
                  <h3>Draw Signature</h3>
                  <div className="canvas-wrapper">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseUp={finishDrawing}
                      onMouseMove={draw}
                      onMouseLeave={finishDrawing}
                      onTouchStart={(e) => {
                        const touch = e.touches[0];
                        const rect = canvasRef.current.getBoundingClientRect();
                        startDrawing({
                          nativeEvent: {
                            offsetX: touch.clientX - rect.left,
                            offsetY: touch.clientY - rect.top,
                          },
                        });
                      }}
                      onTouchMove={(e) => {
                        e.preventDefault(); // Prevent scrolling
                        const touch = e.touches[0];
                        const rect = canvasRef.current.getBoundingClientRect();
                        draw({
                          nativeEvent: {
                            offsetX: touch.clientX - rect.left,
                            offsetY: touch.clientY - rect.top,
                          },
                        });
                      }}
                      onTouchEnd={finishDrawing}
                    />
                  </div>

                  <div className="signature-actions">
                    <button className="btn-secondary" onClick={clearSignature}>
                      <Trash2 size={16} /> Clear
                    </button>
                    {!signatureImage ? (
                      <button className="btn-primary" onClick={saveSignature}>
                        <Check size={16} /> Save Signature
                      </button>
                    ) : (
                      <div className="signature-saved-indicator">
                        <Check size={16} color="#00FFC8" /> Saved
                      </div>
                    )}
                  </div>

                  {signatureImage && (
                    <div className="apply-section">
                      <p className="hint">
                        Signature will be placed at the bottom center of Page{" "}
                        {currentPage}.
                      </p>
                      <button
                        className="btn-neon"
                        onClick={signPdf}
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Signing..." : "Preview Signed PDF"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : pdfBytes && !downloadResult ? (
              <div className="preview-section">
                <div className="preview-header">
                  <h3>Preview Signed PDF</h3>
                </div>

                <div className="pdf-viewer-container">
                  <iframe
                    src={previewUrl}
                    className="pdf-viewer"
                    title="Signed PDF Preview"
                  />
                </div>

                <div className="preview-actions">
                  <button
                    className="btn-neon"
                    onClick={async () => {
                      const result = await downloadPdf(
                        pdfBytes,
                        getTimestampedFilename("signed")
                      );
                      setDownloadResult(result);
                    }}
                    style={{ flex: 1 }}
                  >
                    <Download size={18} />
                    Download Signed PDF
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      // Reset to signing state
                      setPdfBytes(null);
                      // Reload original file preview
                      const blob = new Blob([file], {
                        type: "application/pdf",
                      });
                      const url = URL.createObjectURL(blob);
                      setPreviewUrl(url);
                    }}
                    style={{ flex: 1 }}
                  >
                    <RefreshCw size={18} />
                    Edit Signature
                  </button>
                </div>
              </div>
            ) : (
              <div className="result-section">
                <div className="success-icon-wrapper">
                  <div className="success-icon-ring"></div>
                  <Download size={32} className="success-icon" />
                </div>

                <h3 className="success-title">PDF Signed!</h3>
                <p className="success-subtitle">
                  Your signature has been added to the PDF.
                </p>

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

                  {downloadResult.isBrowser ? (
                    <a
                      className="btn-download-primary"
                      href={downloadResult.uri}
                      download={downloadResult.filename}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download size={18} />
                      <span>Download Signed PDF</span>
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
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (downloadResult.uri && downloadResult.isBrowser) {
                      URL.revokeObjectURL(downloadResult.uri);
                    }
                    setFile(null);
                    setDownloadResult(null);
                    setSignatureImage(null);
                    setPreviewUrl(null);
                    setPdfBytes(null);
                  }}
                >
                  Sign Another PDF
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

        .sign-workspace {
          display: flex;
          flex-wrap: wrap;
          gap: 30px;
          justify-content: center;
        }

        .pdf-preview-pane, .signature-pane {
          flex: 1;
          min-width: 300px;
          background: var(--surface-color);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .iframe-container {
          flex: 1;
          min-height: 400px;
          border: 1px solid #333;
          border-radius: 8px;
          overflow: hidden;
        }

        iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        .page-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-controls button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #fff;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .page-controls button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .canvas-wrapper {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          cursor: crosshair;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 150px;
        }

        .signature-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn-primary {
          background: var(--primary-color);
          color: #000;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }

        .signature-saved-indicator {
          color: #00FFC8;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
        }

        .apply-section {
          margin-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 20px;
          text-align: center;
        }

        .hint {
          color: #888;
          font-size: 0.85rem;
          margin-bottom: 16px;
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
          width: 100%;
          transition: all 0.3s ease;
          box-shadow: 0 0 20px rgba(0, 255, 200, 0.3);
        }

        .btn-neon:hover:not(:disabled) {
          background: #00ffc8;
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(0, 255, 200, 0.5);
        }

        .result-section {
          margin-top: 30px;
          text-align: center;
          padding: 40px 30px;
          background: linear-gradient(145deg, rgba(0, 255, 200, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%);
          border-radius: 16px;
          border: 1px solid rgba(0, 255, 200, 0.2);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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

        .btn-download-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(0, 255, 200, 0.5);
          background: #00ffc8;
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
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .preview-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .pdf-viewer-container {
          height: 600px;
          border: 1px solid #333;
          border-radius: 12px;
          overflow: hidden;
          background: #1a1a1a;
        }
        
        .pdf-viewer {
          width: 100%;
          height: 100%;
          border: none;
        }
        
        .preview-actions {
          display: flex;
          gap: 16px;
        }
      `}</style>
    </div>
  );
};

export default SignPdf;
