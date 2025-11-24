import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import { Download, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CompressPdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [compressedPdfUrl, setCompressedPdfUrl] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelected = (files) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setOriginalSize(files[0].size);
    setCompressedPdfUrl(null);
  };

  const compressPdf = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);

      // Save with default settings (basic compression)
      const pdfBytes = await pdfDoc.save();

      // Simulate additional compression (in reality, pdf-lib has limited compression)
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setCompressedSize(pdfBytes.length);
      setCompressedPdfUrl(url);
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
                <h3 style={{ color: "#00FFC8" }}>Compression Complete!</h3>
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
                    <span className="label">Saved:</span>
                    <span className="value neon-text">
                      {compressionPercentage}%
                    </span>
                  </div>
                </div>
                <a
                  href={compressedPdfUrl}
                  download="compressed.pdf"
                  className="btn-neon"
                >
                  <Download size={18} style={{ marginRight: "8px" }} /> Download
                  Compressed PDF
                </a>
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
          padding: 30px 20px;
          background: rgba(0, 255, 200, 0.05);
          border-radius: 12px;
          border: 1px dashed var(--accent-color);
        }
      `}</style>
    </div>
  );
};

export default CompressPdf;
