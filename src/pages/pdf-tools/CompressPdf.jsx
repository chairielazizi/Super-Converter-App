import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import { Download, ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";

const CompressPdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [compressedPdfUrl, setCompressedPdfUrl] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);

  const handleFileSelected = (files) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setOriginalSize(files[0].size);
    setCompressedPdfUrl(null);
    setDownloadResult(null);
  };

  const compressPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    setDownloadResult(null);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);

      // Save with default settings (basic compression)
      const pdfBytes = await pdfDoc.save();

      setCompressedSize(pdfBytes.length);

      // Automatically trigger download logic
      const result = await downloadPdf(pdfBytes, "compressed.pdf");
      setDownloadResult(result);
      setCompressedPdfUrl("completed");
    } catch (error) {
      console.error("Error compressing PDF:", error);
      alert("Failed to compress PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const compressionPercentage =
    originalSize && compressedSize
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

  return (
    <div className="page-container">
      <button className="back-btn" onClick={() => navigate("/pdf-editor")}>
        <ArrowLeft size={18} /> Back
      </button>

      <header style={{ marginBottom: "20px", textAlign: "center" }}>
        <h2 className="neon-text">Compress PDF</h2>
        <p style={{ color: "#888" }}>Reduce PDF file size</p>
      </header>

      <div className="tool-content">
        {!file ? (
          <FileUploader
            onFilesSelected={handleFileSelected}
            accept={{ "application/pdf": [".pdf"] }}
            multiple={false}
            label="Drop a PDF file here to compress"
          />
        ) : (
          <>
            <div className="file-info">
              <p>
                <strong>{file.name}</strong>
              </p>
              <p style={{ color: "#888" }}>
                Original Size: {formatFileSize(originalSize)}
              </p>
              {!compressedPdfUrl && (
                <button className="text-btn" onClick={() => setFile(null)}>
                  Change File
                </button>
              )}
            </div>

            {!compressedPdfUrl && (
              <button
                className="btn-neon"
                onClick={compressPdf}
                disabled={isProcessing}
                style={{ width: "100%", marginTop: "20px" }}
              >
                {isProcessing ? "Compressing..." : "Compress PDF"}
              </button>
            )}

            {compressedPdfUrl && (
              <div className="result-section">
                <div className="success-icon-wrapper">
                  <div className="success-icon-ring"></div>
                  <Download size={32} className="success-icon" />
                </div>

                <h3 className="success-title">Compression Complete!</h3>
                <p className="success-subtitle">
                  Your PDF has been optimized successfully.
                </p>

                <div className="stats">
                  <div className="stat-item">
                    <span className="label">Original:</span>
                    <span className="value">
                      {formatFileSize(originalSize)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Compressed:</span>
                    <span className="value">
                      {formatFileSize(compressedSize)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Savings:</span>
                    <span
                      className="value"
                      style={{ color: "var(--accent-color)" }}
                    >
                      {compressionPercentage}%
                    </span>
                  </div>
                </div>

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
                      Download Compressed PDF
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
                    setFile(null);
                    setCompressedPdfUrl(null);
                    setDownloadResult(null);
                  }}
                >
                  Compress Another PDF
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
        }

        .stats {
          background: var(--surface-color);
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
        }

        .stat-item .label {
          color: #888;
        }

        .stat-item .value {
          color: #fff;
          font-weight: 600;
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

export default CompressPdf;
