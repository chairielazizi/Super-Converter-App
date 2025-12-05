import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import { Download, ArrowLeft, FileText, RefreshCw, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { getTimestampedFilename } from "../../utils/fileUtils";

const CompressPdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [compressedPdfUrl, setCompressedPdfUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);

  const handleFileSelected = (files) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setOriginalSize(files[0].size);
    setCompressedPdfUrl(null);
    setPreviewUrl(null);
    setDownloadResult(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

      setCompressedSize(pdfBytes.length);

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
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
              <div className="file-info-content">
                <FileText size={24} style={{ color: "var(--accent-color)" }} />
                <div className="file-details">
                  <span className="file-label">Selected File:</span>
                  <strong className="file-name-text">{file.name}</strong>
                </div>
              </div>
              {!compressedPdfUrl && (
                <button
                  className="change-file-btn"
                  onClick={() => setFile(null)}
                >
                  <RefreshCw size={16} />
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

                {previewUrl && !downloadResult ? (
                  <div className="preview-section">
                    <div className="preview-header">
                      <Eye size={20} style={{ color: "var(--accent-color)" }} />
                      <h3>Preview Compressed PDF</h3>
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
                          // Re-create blob from previewUrl if needed, or just use the bytes if we had them in state.
                          // Since we didn't store bytes in state, we can fetch from previewUrl or refactor to store bytes.
                          // Refactoring to store bytes is safer.
                          // For now, let's fetch the blob from the URL.
                          const response = await fetch(previewUrl);
                          const blob = await response.blob();
                          const pdfBytes = await blob.arrayBuffer();

                          const result = await downloadPdf(
                            pdfBytes,
                            getTimestampedFilename("compressed")
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
                          setFile(null);
                          setCompressedPdfUrl(null);
                          setPreviewUrl(null);
                          setDownloadResult(null);
                        }}
                        style={{ flex: 1 }}
                      >
                        <RefreshCw size={18} />
                        Compress Another
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="download-action-area">
                      <div className="file-preview-card">
                        <FileText
                          size={24}
                          style={{ color: "var(--accent-color)" }}
                        />
                        <span className="file-name-display">
                          {downloadResult?.filename || "compressed.pdf"}
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
                        {downloadResult?.isBrowser
                          ? ""
                          : "Check your Files app"}
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
                        setCompressedPdfUrl(null);
                        setPreviewUrl(null);
                        setDownloadResult(null);
                      }}
                    >
                      Compress Another PDF
                    </button>
                  </>
                )}
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

export default CompressPdf;
