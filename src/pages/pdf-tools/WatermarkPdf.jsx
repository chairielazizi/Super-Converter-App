import React, { useState, useEffect } from "react";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import {
  Download,
  ArrowLeft,
  FileText,
  RefreshCw,
  Droplet,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { getTimestampedFilename } from "../../utils/fileUtils";

const WatermarkPdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(60);
  const [rotation, setRotation] = useState(45);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [downloadResult, setDownloadResult] = useState(null);

  const handleFileSelected = (files) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setPreviewUrl(null);
    setPdfBytes(null);
    setDownloadResult(null);
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const addWatermark = async () => {
    if (!file || !watermarkText.trim()) {
      alert("Please enter watermark text");
      return;
    }

    setIsProcessing(true);
    setDownloadResult(null);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();

      // Load font
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Process each page
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

        // Center the watermark
        const x = (width - textWidth) / 2;
        const y = height / 2;

        // Draw watermark
        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.7, 0.7, 0.7),
          opacity: opacity,
          rotate: degrees(rotation),
        });
      });

      const pdfBytesArray = await pdfDoc.save();
      setPdfBytes(pdfBytesArray);

      // Create preview URL
      const blob = new Blob([pdfBytesArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error adding watermark:", error);
      alert("Failed to add watermark. Please try again.");
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
        <h2 className="neon-text">Watermark PDF</h2>
        <p style={{ color: "#888" }}>Add a text watermark to your PDF</p>
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
            {!previewUrl ? (
              <>
                <div className="file-info">
                  <div className="file-info-content">
                    <FileText
                      size={24}
                      style={{ color: "var(--accent-color)" }}
                    />
                    <div className="file-details">
                      <span className="file-label">Selected File:</span>
                      <strong className="file-name-text">{file.name}</strong>
                    </div>
                  </div>
                  <button
                    className="change-file-btn"
                    onClick={() => setFile(null)}
                  >
                    <RefreshCw size={16} />
                    Change File
                  </button>
                </div>

                <div className="options-container">
                  {/* Watermark Text Input */}
                  <div className="option-group">
                    <label className="option-label">Watermark Text:</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Enter watermark text"
                      className="text-input"
                      maxLength={50}
                    />
                  </div>

                  {/* Opacity Slider */}
                  <div className="option-group">
                    <label className="option-label">
                      Opacity: {Math.round(opacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="slider"
                    />
                    <div className="slider-labels">
                      <span>10%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Font Size Slider */}
                  <div className="option-group">
                    <label className="option-label">
                      Font Size: {fontSize}pt
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="slider"
                    />
                    <div className="slider-labels">
                      <span>20pt</span>
                      <span>100pt</span>
                    </div>
                  </div>

                  {/* Rotation Slider */}
                  <div className="option-group">
                    <label className="option-label">
                      Rotation: {rotation}°
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="15"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value))}
                      className="slider"
                    />
                    <div className="slider-labels">
                      <span>0°</span>
                      <span>90°</span>
                    </div>
                    <div className="rotation-presets">
                      {[0, 45, 90].map((angle) => (
                        <button
                          key={angle}
                          className={`preset-btn ${
                            rotation === angle ? "active" : ""
                          }`}
                          onClick={() => setRotation(angle)}
                        >
                          {angle}°
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="preview-box">
                    <div className="preview-label">Preview:</div>
                    <div className="watermark-preview">
                      <span
                        className="preview-text"
                        style={{
                          opacity: opacity,
                          fontSize: `${Math.min(fontSize / 3, 24)}px`,
                          transform: `rotate(${rotation}deg)`,
                        }}
                      >
                        {watermarkText || "WATERMARK"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn-neon"
                  onClick={addWatermark}
                  disabled={isProcessing || !watermarkText.trim()}
                  style={{ width: "100%", marginTop: "20px" }}
                >
                  <Droplet size={18} />
                  {isProcessing ? "Adding Watermark..." : "Add Watermark"}
                </button>
              </>
            ) : !downloadResult ? (
              <>
                <div className="preview-section">
                  <div className="preview-header">
                    <Eye size={20} style={{ color: "var(--accent-color)" }} />
                    <h3>Preview Your PDF</h3>
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
                        const result = await downloadPdf(
                          pdfBytes,
                          getTimestampedFilename("watermarked")
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
                        setPreviewUrl(null);
                        setPdfBytes(null);
                      }}
                      style={{ flex: 1 }}
                    >
                      <RefreshCw size={18} />
                      Try Again
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="result-section">
                <div className="success-icon-wrapper">
                  <div className="success-icon-ring"></div>
                  <Download size={32} className="success-icon" />
                </div>

                <h3 className="success-title">Watermark Added Successfully!</h3>
                <p className="success-subtitle">
                  Your watermark has been applied to all pages.
                </p>

                <div className="download-action-area">
                  <div className="file-preview-card">
                    <FileText
                      size={24}
                      style={{ color: "var(--accent-color)" }}
                    />
                    <span className="file-name-display">
                      {downloadResult?.filename || "watermarked.pdf"}
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
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                    }
                    setFile(null);
                    setPreviewUrl(null);
                    setPdfBytes(null);
                    setDownloadResult(null);
                  }}
                >
                  Watermark Another PDF
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
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(64, 224, 208, 0.1);
          border-color: var(--primary-color);
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

        .options-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .option-group {
          background: var(--surface-color);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #333;
        }

        .option-label {
          display: block;
          margin-bottom: 12px;
          color: #888;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .text-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #444;
          color: #fff;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .text-input:focus {
          outline: none;
          border-color: var(--primary-color);
          background: rgba(64, 224, 208, 0.05);
        }

        .slider {
          width: 100%;
          height: 6px;
          background: #333;
          border-radius: 3px;
          outline: none;
          -webkit-appearance: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: var(--accent-color);
          border-radius: 50%;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: var(--accent-color);
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          color: #666;
          font-size: 0.75rem;
        }

        .rotation-presets {
          display: flex;
          gap: 10px;
          margin-top: 12px;
        }

        .preset-btn {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #444;
          color: #888;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.3s ease;
        }

        .preset-btn:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
          background: rgba(64, 224, 208, 0.05);
        }

        .preset-btn.active {
          background: rgba(64, 224, 208, 0.15);
          border-color: var(--accent-color);
          color: var(--accent-color);
        }

        .preview-box {
          background: var(--surface-color);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #333;
        }

        .preview-label {
          color: #888;
          font-size: 0.9rem;
          margin-bottom: 15px;
          font-weight: 500;
        }

        .watermark-preview {
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed #444;
          border-radius: 8px;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .preview-text {
          color: #888;
          font-weight: bold;
          user-select: none;
          transition: all 0.3s ease;
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
          height: calc(100vh - 500px);
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
            height: calc(100vh - 550px);
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

export default WatermarkPdf;
