import React, { useState } from "react";
import FileUploader from "../components/FileUploader";
import {
  FileType,
  ArrowRight,
  CheckCircle,
  Loader2,
  Download,
} from "lucide-react";

const Converter = () => {
  const [file, setFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState("pdf");
  const [status, setStatus] = useState("idle"); // idle, converting, done
  const [progress, setProgress] = useState(0);

  const handleFileSelected = (files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setStatus("idle");
      setProgress(0);
    }
  };

  const startConversion = () => {
    if (!file) return;
    setStatus("converting");
    setProgress(0);

    // Mock conversion progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus("done");
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="page-container">
      <header style={{ marginBottom: "30px" }}>
        <h2 className="neon-text">Document Converter</h2>
        <p style={{ color: "#888" }}>
          Convert documents to other formats instantly.
        </p>
      </header>

      {!file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          accept={{
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
              [".docx"],
            "application/vnd.openxmlformats-officedocument.presentationml.presentation":
              [".pptx"],
            "application/pdf": [".pdf"],
          }}
          label="Drop DOCX, PPTX, or PDF files here"
        />
      ) : (
        <div className="conversion-card">
          <div className="file-info">
            <div className="icon-box">
              <FileType size={32} color="var(--primary-color)" />
            </div>
            <div className="details">
              <h4>{file.name}</h4>
              <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            {status === "idle" && (
              <button className="change-btn" onClick={() => setFile(null)}>
                Change
              </button>
            )}
          </div>

          {status === "idle" && (
            <div className="controls">
              <div className="format-selector">
                <span>Convert to:</span>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                >
                  <option value="pdf">PDF Document</option>
                  <option value="docx">Word Document</option>
                  <option value="jpg">JPG Images</option>
                </select>
              </div>

              <button className="btn-neon" onClick={startConversion}>
                Start Conversion
              </button>
            </div>
          )}

          {status === "converting" && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="status-text">
                <Loader2 size={16} className="spin" /> Converting... {progress}%
              </p>
            </div>
          )}

          {status === "done" && (
            <div className="success-section">
              <CheckCircle
                size={48}
                color="#00FFC8"
                style={{ marginBottom: "16px" }}
              />
              <h3>Conversion Complete!</h3>
              <p>Your file is ready to download.</p>
              <button className="btn-neon">
                <Download size={18} style={{ marginRight: "8px" }} /> Download{" "}
                {targetFormat.toUpperCase()}
              </button>
              <button className="text-btn" onClick={() => setFile(null)}>
                Convert Another
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        .conversion-card {
          background: var(--surface-color);
          border: 1px solid #333;
          border-radius: 16px;
          padding: 24px;
          max-width: 500px;
          margin: 0 auto;
        }

        .file-info {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #333;
        }

        .icon-box {
          background: rgba(64, 224, 208, 0.1);
          padding: 12px;
          border-radius: 12px;
          margin-right: 16px;
        }

        .details h4 {
          margin: 0 0 4px 0;
          color: #fff;
        }

        .details span {
          font-size: 0.85rem;
          color: #888;
        }

        .change-btn {
          margin-left: auto;
          background: transparent;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          font-size: 0.9rem;
        }

        .controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .format-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ccc;
        }

        .progress-section {
          text-align: center;
          padding: 20px 0;
        }

        .progress-bar {
          height: 6px;
          background: #333;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .fill {
          height: 100%;
          background: var(--primary-color);
          transition: width 0.3s ease;
          box-shadow: 0 0 10px var(--primary-color);
        }

        .status-text {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #ccc;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .success-section {
          text-align: center;
          animation: fadeIn 0.5s ease;
        }

        .text-btn {
          background: transparent;
          border: none;
          color: #888;
          margin-top: 16px;
          cursor: pointer;
          text-decoration: underline;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Converter;
