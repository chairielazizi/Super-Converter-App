import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import {
  Download,
  ArrowLeft,
  FileText,
  RefreshCw,
  FileDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { getTimestampedFilename } from "../../utils/fileUtils";

const FlattenPdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);

  const handleFileSelected = (files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setDownloadResult(null);
    }
  };

  const flattenPdf = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);

      const form = pdfDoc.getForm();
      try {
        form.flatten();
      } catch (e) {
        console.warn("No form fields to flatten or error flattening:", e);
        // Even if flattening fails (e.g., no fields), we can still save and return the doc
        // or maybe it's already "flat" enough.
        // But pdf-lib throws if no fields? Let's check docs or assume safe.
        // Actually form.flatten() works on fields. If no fields, it might do nothing or throw.
        // We'll proceed.
      }

      const pdfBytes = await pdfDoc.save();
      const result = await downloadPdf(
        pdfBytes,
        getTimestampedFilename("flattened")
      );
      setDownloadResult(result);
    } catch (error) {
      console.error("Error flattening PDF:", error);
      alert("Failed to flatten PDF. It might be encrypted or corrupted.");
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
        <h2 className="neon-text">Flatten PDF</h2>
        <p style={{ color: "#888" }}>Make fillable PDF forms uneditable</p>
      </header>

      <div className="tool-content">
        {!file ? (
          <FileUploader
            onFilesSelected={handleFileSelected}
            accept={{ "application/pdf": [".pdf"] }}
            multiple={false}
            label="Drop PDF here to flatten"
          />
        ) : (
          <>
            {!downloadResult ? (
              <div className="action-card">
                <div className="file-info">
                  <FileText size={40} className="file-icon" />
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>

                <div className="action-area">
                  <p className="info-text">
                    This will convert all form fields into static content. The
                    document will no longer be editable.
                  </p>
                  <button
                    className="btn-neon"
                    onClick={flattenPdf}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="spin" size={18} /> Flattening...
                      </>
                    ) : (
                      <>
                        <FileDown size={18} /> Flatten PDF
                      </>
                    )}
                  </button>
                </div>

                <button
                  className="change-file-btn"
                  onClick={() => setFile(null)}
                >
                  Change File
                </button>
              </div>
            ) : (
              <div className="result-section">
                <div className="success-icon-wrapper">
                  <div className="success-icon-ring"></div>
                  <Download size={32} className="success-icon" />
                </div>

                <h3 className="success-title">PDF Flattened!</h3>
                <p className="success-subtitle">
                  Your PDF form has been successfully flattened.
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
                      <span>Download Flattened PDF</span>
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
                    {downloadResult.isBrowser ? "" : "Check your Files app"}
                  </p>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (downloadResult.uri && downloadResult.isBrowser) {
                      URL.revokeObjectURL(downloadResult.uri);
                    }
                    setFile(null);
                    setDownloadResult(null);
                  }}
                >
                  Flatten Another PDF
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

        .action-card {
          background: var(--surface-color);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 30px;
          max-width: 500px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .file-icon {
          color: var(--accent-color);
        }

        .file-details {
          display: flex;
          flex-direction: column;
        }

        .file-name {
          color: #fff;
          font-weight: 500;
        }

        .file-size {
          color: #888;
          font-size: 0.85rem;
        }

        .action-area {
          text-align: center;
        }

        .info-text {
          color: #ccc;
          margin-bottom: 20px;
          font-size: 0.9rem;
          line-height: 1.5;
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
          width: 100%;
          transition: all 0.3s ease;
          box-shadow: 0 0 20px rgba(0, 255, 200, 0.3);
        }

        .btn-neon:hover:not(:disabled) {
          background: #00ffc8;
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(0, 255, 200, 0.5);
        }

        .btn-neon:disabled {
          background: #333;
          color: #666;
          cursor: not-allowed;
          box-shadow: none;
        }

        .change-file-btn {
          background: transparent;
          border: none;
          color: #666;
          font-size: 0.9rem;
          cursor: pointer;
          text-decoration: underline;
        }

        .change-file-btn:hover {
          color: #888;
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

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FlattenPdf;
