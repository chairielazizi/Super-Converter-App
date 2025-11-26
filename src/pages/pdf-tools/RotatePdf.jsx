import React, { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import { Download, ArrowLeft, RotateCw, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";

const RotatePdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [rotation, setRotation] = useState(90);
  const [rotatedPdfUrl, setRotatedPdfUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);

  const handleFileSelected = (files) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setRotatedPdfUrl(null);
    setDownloadResult(null);
  };

  const rotatePdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    setDownloadResult(null);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        page.setRotation(degrees(rotation));
      });

      const pdfBytes = await pdfDoc.save();

      // Automatically trigger download logic
      const result = await downloadPdf(pdfBytes, "rotated.pdf");
      setDownloadResult(result);
      setRotatedPdfUrl("completed");
    } catch (error) {
      console.error("Error rotating PDF:", error);
      alert("Failed to rotate PDF. Please try again.");
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
        <h2 className="neon-text">Rotate PDF</h2>
        <p style={{ color: "#888" }}>Rotate all pages in your PDF</p>
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
            <div className="file-info">
              <p>
                <strong>{file.name}</strong>
              </p>
              {!rotatedPdfUrl && (
                <button className="text-btn" onClick={() => setFile(null)}>
                  Change File
                </button>
              )}
            </div>

            {!rotatedPdfUrl && (
              <>
                <div className="rotation-selector">
                  <label>Rotation Angle:</label>
                  <div className="rotation-btns">
                    {[90, 180, 270].map((angle) => (
                      <button
                        key={angle}
                        className={`rotation-btn ${
                          rotation === angle ? "active" : ""
                        }`}
                        onClick={() => setRotation(angle)}
                      >
                        <RotateCw size={16} /> {angle}°
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="btn-neon"
                  onClick={rotatePdf}
                  disabled={isProcessing}
                  style={{ width: "100%", marginTop: "20px" }}
                >
                  {isProcessing ? "Rotating..." : "Rotate PDF"}
                </button>
              </>
            )}

            {rotatedPdfUrl && (
              <div className="result-section">
                <div className="success-icon-wrapper">
                  <div className="success-icon-ring"></div>
                  <Download size={32} className="success-icon" />
                </div>

                <h3 className="success-title">Ready to Download!</h3>
                <p className="success-subtitle">
                  Your PDF has been rotated successfully.
                </p>

                <div className="download-action-area">
                  <div className="file-preview-card">
                    <FileText
                      size={24}
                      style={{ color: "var(--accent-color)" }}
                    />
                    <span className="file-name-display">
                      {downloadResult?.filename || "rotated.pdf"}
                    </span>
                  </div>

                  {downloadResult?.isBrowser ? (
                    <a
                      className="btn-download-primary"
                      href={downloadResult.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download size={18} />
                      <span>Open PDF</span>
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
                    {downloadResult?.isBrowser
                      ? "Click to open PDF in new tab"
                      : "Check your Files app"}
                  </p>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (downloadResult?.uri && downloadResult?.isBrowser) {
                      URL.revokeObjectURL(downloadResult.uri);
                    }
                    setFile(null);
                    setRotatedPdfUrl(null);
                    setDownloadResult(null);
                  }}
                >
                  Rotate Another PDF
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
          max-width: 600px;
          margin: 0 auto;
        }

        .file-info {
          text-align: center;
          padding: 20px;
          background: var(--surface-color);
          border-radius: 12px;
          border: 1px solid #333;
          margin-bottom: 20px;
        }

        .rotation-selector {
          background: var(--surface-color);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #333;
        }

        .rotation-selector label {
          display: block;
          margin-bottom: 12px;
          color: #888;
        }

        .rotation-btns {
          display: flex;
          gap: 10px;
        }

        .rotation-btn {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #444;
          color: #888;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.3s ease;
        }

        .rotation-btn.active {
          background: rgba(64, 224, 208, 0.1);
          border-color: var(--primary-color);
          color: var(--primary-color);
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

export default RotatePdf;
