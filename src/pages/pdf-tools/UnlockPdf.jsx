import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import {
  Download,
  ArrowLeft,
  FileText,
  RefreshCw,
  Unlock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { getTimestampedFilename } from "../../utils/fileUtils";

const UnlockPdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileSelected = async (files) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setDownloadResult(null);
    setPassword("");
    setErrorMessage("");
    setIsEncrypted(false);

    // Check if encrypted by trying to load without password
    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      await PDFDocument.load(fileBuffer);
      // If it loads without error, it's not encrypted (or has empty password)
      // But we still might want to "unlock" it if it has owner password restrictions?
      // For now, assume if it loads, it's fine.
    } catch (error) {
      if (error.message.includes("Encrypted")) {
        setIsEncrypted(true);
      }
    }
  };

  const unlockPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage("");

    try {
      const fileBuffer = await file.arrayBuffer();

      // Try to load with the provided password
      // If not encrypted, password is ignored usually, or we can pass undefined
      const pdfDoc = await PDFDocument.load(fileBuffer, {
        password: password,
      });

      // Saving it creates a new PDF without encryption by default unless we encrypt it again
      const pdfBytes = await pdfDoc.save();

      const result = await downloadPdf(
        pdfBytes,
        getTimestampedFilename("unlocked")
      );
      setDownloadResult(result);
    } catch (error) {
      console.error("Error unlocking PDF:", error);
      if (error.message.includes("Password")) {
        setErrorMessage("Incorrect password. Please try again.");
      } else {
        setErrorMessage(
          "Failed to unlock PDF. The file might be corrupted or the password is wrong."
        );
      }
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
        <h2 className="neon-text">Unlock PDF</h2>
        <p style={{ color: "#888" }}>Remove password security from your PDF</p>
      </header>

      <div className="tool-content">
        {!file ? (
          <FileUploader
            onFilesSelected={handleFileSelected}
            accept={{ "application/pdf": [".pdf"] }}
            multiple={false}
            label="Drop a PDF file here to unlock"
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
              {!downloadResult && (
                <button
                  className="change-file-btn"
                  onClick={() => setFile(null)}
                >
                  <RefreshCw size={16} />
                  Change File
                </button>
              )}
            </div>

            {!downloadResult ? (
              <div className="action-card">
                <div className="input-group">
                  <label>Enter Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter the PDF password"
                      className="password-input"
                    />
                    <button
                      className="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errorMessage && (
                    <p className="error-message">{errorMessage}</p>
                  )}
                  <p className="input-hint">
                    Enter the password to unlock and create a new unsecured
                    copy.
                  </p>
                </div>

                <button
                  className="btn-neon"
                  onClick={unlockPdf}
                  disabled={isProcessing || !password}
                  style={{ width: "100%", marginTop: "20px" }}
                >
                  <Unlock size={18} />
                  {isProcessing ? "Unlocking..." : "Unlock PDF"}
                </button>
              </div>
            ) : (
              <div className="result-section">
                <div className="success-icon-wrapper">
                  <div className="success-icon-ring"></div>
                  <Unlock size={32} className="success-icon" />
                </div>

                <h3 className="success-title">PDF Unlocked Successfully!</h3>
                <p className="success-subtitle">
                  The password has been removed. You can now open it without
                  restrictions.
                </p>

                <div className="download-action-area">
                  <div className="file-preview-card">
                    <FileText
                      size={24}
                      style={{ color: "var(--accent-color)" }}
                    />
                    <span className="file-name-display">
                      {downloadResult?.filename || "unlocked.pdf"}
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
                    setPassword("");
                    setDownloadResult(null);
                  }}
                >
                  Unlock Another PDF
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

        .action-card {
          background: var(--surface-color);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #333;
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

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #444;
          border-radius: 8px;
          padding: 12px 16px;
          padding-right: 48px;
          color: #fff;
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
        }

        .password-input:focus {
          border-color: var(--accent-color);
          box-shadow: 0 0 0 2px rgba(0, 255, 200, 0.1);
        }

        .toggle-password-btn {
          position: absolute;
          right: 8px;
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toggle-password-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        .input-hint {
          font-size: 0.8rem;
          color: #666;
          margin-top: 4px;
        }

        .error-message {
          color: #ff4d4d;
          font-size: 0.9rem;
          margin-top: 4px;
        }

        .btn-neon {
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
      `}</style>
    </div>
  );
};

export default UnlockPdf;
