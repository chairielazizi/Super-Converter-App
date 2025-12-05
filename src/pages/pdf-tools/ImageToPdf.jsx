import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import {
  Download,
  ArrowLeft,
  FileText,
  RefreshCw,
  GripVertical,
  Image as ImageIcon,
  Eye,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { getTimestampedFilename } from "../../utils/fileUtils";

const ImageToPdf = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);

  const handleFilesSelected = (newFiles) => {
    if (newFiles.length === 0) return;

    // Filter for images
    const imageFiles = newFiles.filter(
      (file) =>
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg"
    );

    if (imageFiles.length === 0) {
      alert("Please select JPG or PNG images.");
      return;
    }

    // Create object URLs for previewing the images in the list
    const newFilesWithPreview = imageFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...newFilesWithPreview]);
    setDownloadResult(null);
    setPreviewUrl(null);
    setPdfBytes(null);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    URL.revokeObjectURL(newFiles[index].preview);
    newFiles.splice(index, 1);
    setFiles(newFiles);
    setDownloadResult(null);
    setPreviewUrl(null);
    setPdfBytes(null);
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newFiles = [...files];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(targetIndex, 0, draggedFile);

    setFiles(newFiles);
    setDraggedIndex(null);
    setDownloadResult(null);
    setPreviewUrl(null);
    setPdfBytes(null);
  };

  useEffect(() => {
    return () => {
      // Cleanup image previews
      files.forEach((file) => {
        URL.revokeObjectURL(file.preview);
      });
      // Cleanup PDF preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []); // Cleanup on unmount. Note: we might need to clean up when files change too if we were replacing the whole list.

  const convertToPdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const fileObj of files) {
        const imageBytes = await fileObj.file.arrayBuffer();
        let image;

        if (
          fileObj.file.type === "image/jpeg" ||
          fileObj.file.type === "image/jpg"
        ) {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (fileObj.file.type === "image/png") {
          image = await pdfDoc.embedPng(imageBytes);
        }

        if (image) {
          const page = pdfDoc.addPage();
          const { width, height } = image.scale(1);

          // Scale image to fit page (A4 size by default: 595.28 x 841.89)
          const pageWidth = page.getWidth();
          const pageHeight = page.getHeight();

          let scaledWidth = width;
          let scaledHeight = height;

          // Fit to page with margin
          const margin = 20;
          const maxWidth = pageWidth - margin * 2;
          const maxHeight = pageHeight - margin * 2;

          const scaleFactor = Math.min(
            maxWidth / width,
            maxHeight / height,
            1 // Don't scale up if smaller
          );

          scaledWidth = width * scaleFactor;
          scaledHeight = height * scaleFactor;

          page.drawImage(image, {
            x: (pageWidth - scaledWidth) / 2,
            y: (pageHeight - scaledHeight) / 2,
            width: scaledWidth,
            height: scaledHeight,
          });
        }
      }

      const pdfBytesArray = await pdfDoc.save();
      setPdfBytes(pdfBytesArray);

      const blob = new Blob([pdfBytesArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error converting images to PDF:", error);
      alert("Failed to convert images. Please try again.");
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
        <h2 className="neon-text">Images to PDF</h2>
        <p style={{ color: "#888" }}>
          Convert JPG and PNG images to a single PDF
        </p>
      </header>

      <div className="tool-content">
        {files.length === 0 ? (
          <FileUploader
            onFilesSelected={handleFilesSelected}
            accept={{
              "image/jpeg": [".jpg", ".jpeg"],
              "image/png": [".png"],
            }}
            multiple={true}
            label="Drop images here (JPG, PNG)"
          />
        ) : (
          <>
            {!downloadResult && !previewUrl ? (
              <>
                <div className="file-list-header">
                  <span>{files.length} Images Selected</span>
                  <button className="add-more-btn">
                    <label
                      htmlFor="add-more-input"
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <RefreshCw size={14} /> Add More
                    </label>
                    <input
                      id="add-more-input"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFilesSelected(Array.from(e.target.files));
                        }
                      }}
                    />
                  </button>
                </div>

                <div className="images-grid">
                  {files.map((fileObj, index) => (
                    <div
                      key={fileObj.id}
                      className={`image-card ${
                        draggedIndex === index ? "dragging" : ""
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                    >
                      <div className="drag-handle">
                        <GripVertical size={20} />
                      </div>
                      <div className="image-preview-wrapper">
                        <img src={fileObj.preview} alt={`Page ${index + 1}`} />
                      </div>
                      <div className="image-info">
                        <span className="image-number">{index + 1}</span>
                        <span className="image-name">{fileObj.file.name}</span>
                      </div>
                      <button
                        className="remove-btn"
                        onClick={() => removeFile(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-neon"
                  onClick={convertToPdf}
                  disabled={isProcessing}
                  style={{ width: "100%", marginTop: "20px" }}
                >
                  <ImageIcon size={18} />
                  {isProcessing ? "Converting..." : "Convert to PDF"}
                </button>
              </>
            ) : previewUrl && !downloadResult ? (
              <div className="preview-section">
                <div className="preview-header">
                  <Eye size={20} style={{ color: "var(--accent-color)" }} />
                  <h3>Preview PDF</h3>
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
                        getTimestampedFilename("images_converted")
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
                    Edit Images
                  </button>
                </div>
              </div>
            ) : (
              <div className="result-section">
                <div className="success-icon-wrapper">
                  <div className="success-icon-ring"></div>
                  <Download size={32} className="success-icon" />
                </div>

                <h3 className="success-title">Conversion Complete!</h3>
                <p className="success-subtitle">
                  Your images have been converted to PDF successfully.
                </p>

                <div className="download-action-area">
                  <div className="file-preview-card">
                    <FileText
                      size={24}
                      style={{ color: "var(--accent-color)" }}
                    />
                    <span className="file-name-display">
                      {downloadResult?.filename || "images_converted.pdf"}
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
                    setFiles([]);
                    setPreviewUrl(null);
                    setPdfBytes(null);
                    setDownloadResult(null);
                  }}
                >
                  Convert More Images
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

        .file-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 0 10px;
        }

        .add-more-btn {
          background: transparent;
          border: 1px solid var(--primary-color);
          color: var(--primary-color);
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.3s ease;
        }

        .add-more-btn:hover {
          background: rgba(64, 224, 208, 0.1);
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
        }

        .image-card {
          background: var(--surface-color);
          border: 1px solid #333;
          border-radius: 8px;
          padding: 10px;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: grab;
          transition: all 0.3s ease;
        }

        .image-card:hover {
          border-color: var(--primary-color);
          transform: translateY(-2px);
        }

        .image-card.dragging {
          opacity: 0.5;
          cursor: grabbing;
        }

        .drag-handle {
          position: absolute;
          top: 10px;
          left: 10px;
          color: #666;
          cursor: grab;
          z-index: 2;
          background: rgba(0,0,0,0.5);
          border-radius: 4px;
        }

        .image-preview-wrapper {
          width: 100%;
          height: 120px;
          border-radius: 6px;
          overflow: hidden;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-preview-wrapper img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .image-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #ccc;
        }

        .image-number {
          background: var(--accent-color);
          color: #000;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.7rem;
        }

        .image-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .remove-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          color: #fff;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .remove-btn:hover {
          background: #ff4d4d;
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

export default ImageToPdf;
