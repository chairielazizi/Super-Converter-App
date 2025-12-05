import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import { Download, ArrowLeft, FileText, RefreshCw, Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { Capacitor } from "@capacitor/core";
import { getTimestampedFilename } from "../../utils/fileUtils";

const SplitPdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [splitPages, setSplitPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewPage, setPreviewPage] = useState(null);

  const handleFileSelected = async (files) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setSplitPages([]);
    setPreviewPage(null);
  };

  const splitPdf = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pageCount = pdfDoc.getPageCount();
      const pages = [];
      const isNative = Capacitor.isNativePlatform();

      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();

        let pageData = { pageNum: i + 1, pdfBytes };

        // For browser, pre-generate Blob URL to allow direct <a> links
        if (!isNative) {
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          pageData.url = URL.createObjectURL(blob);
          pageData.filename = getTimestampedFilename(`page_${i + 1}`);
        }

        pages.push(pageData);
      }

      setSplitPages(pages);
    } catch (error) {
      console.error("Error splitting PDF:", error);
      alert("Failed to split PDF. Please try again.");
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
        <h2 className="neon-text">Split PDF</h2>
        <p style={{ color: "#888" }}>Extract individual pages from a PDF</p>
      </header>

      <div className="tool-content">
        {!file ? (
          <FileUploader
            onFilesSelected={handleFileSelected}
            accept={{ "application/pdf": [".pdf"] }}
            multiple={false}
            label="Drop a PDF file here to split"
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
              <button className="change-file-btn" onClick={() => setFile(null)}>
                <RefreshCw size={16} />
                Change File
              </button>
            </div>

            {splitPages.length === 0 && (
              <button
                className="btn-neon"
                onClick={splitPdf}
                disabled={isProcessing}
                style={{ width: "100%", marginTop: "20px" }}
              >
                {isProcessing ? "Splitting..." : "Split into Individual Pages"}
              </button>
            )}

            {splitPages.length > 0 && (
              <div className="pages-grid">
                <div className="success-header">
                  <div className="success-icon-wrapper small">
                    <div className="success-icon-ring"></div>
                    <Download size={24} className="success-icon" />
                  </div>
                  <h3 style={{ color: "#fff", marginBottom: "8px" }}>
                    {splitPages.length} Pages Extracted
                  </h3>
                  <p style={{ color: "#888", fontSize: "0.9rem" }}>
                    Click "Download" to open each PDF in new tab
                  </p>
                </div>

                <div className="cards-container">
                  {splitPages.map((page) => (
                    <div key={page.pageNum} className="page-card">
                      <div className="page-info">
                        <div className="page-icon">
                          <span className="page-number">{page.pageNum}</span>
                        </div>
                        <span className="page-label">Page {page.pageNum}</span>
                      </div>

                      <div className="card-actions">
                        {page.url && (
                          <button
                            className="btn-preview-card"
                            onClick={() => setPreviewPage(page)}
                          >
                            <Eye size={14} /> Preview
                          </button>
                        )}

                        {page.url ? (
                          /* Browser: Direct Link */
                          <a
                            className="btn-download-card"
                            href={page.url}
                            download={page.filename}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download size={14} /> Download
                          </a>
                        ) : (
                          /* Mobile: Button triggering Filesystem write */
                          <button
                            className="btn-download-card"
                            onClick={async () => {
                              const result = await downloadPdf(
                                page.pdfBytes,
                                getTimestampedFilename(`page_${page.pageNum}`)
                              );
                              if (result.success) {
                                alert(`✅ ${result.message}`);
                              } else {
                                alert(`❌ ${result.message}`);
                              }
                            }}
                          >
                            <Download size={14} /> Download
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    setFile(null);
                    setSplitPages([]);
                    setPreviewPage(null);
                  }}
                  style={{ marginTop: "30px", width: "100%" }}
                >
                  Split Another PDF
                </button>
              </div>
            )}
          </>
        )}

        {previewPage && (
          <div className="modal-overlay" onClick={() => setPreviewPage(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Preview Page {previewPage.pageNum}</h3>
                <button
                  className="close-btn"
                  onClick={() => setPreviewPage(null)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <iframe
                  src={previewPage.url}
                  className="modal-pdf-viewer"
                  title={`Preview Page ${previewPage.pageNum}`}
                />
              </div>
              <div className="modal-footer">
                <a
                  className="btn-neon"
                  href={previewPage.url}
                  download={previewPage.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Download size={18} /> Download Page
                </a>
              </div>
            </div>
          </div>
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

        .pages-grid {
          margin-top: 30px;
        }
        
        .success-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(145deg, rgba(0, 255, 200, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%);
          border-radius: 12px;
          border: 1px solid rgba(0, 255, 200, 0.1);
        }
        
        .success-icon-wrapper.small {
          position: relative;
          width: 50px;
          height: 50px;
          margin: 0 auto 15px;
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
        }
        
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }

        .page-card {
          background: rgba(255, 255, 255, 0.03);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
        }
        
        .page-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent-color);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .page-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .page-icon {
          width: 40px;
          height: 50px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .page-number {
          font-weight: bold;
          color: #fff;
        }
        
        .page-label {
          color: #ccc;
          font-size: 0.9rem;
        }

        .btn-download-card {
          background: var(--accent-color);
          color: #000;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          text-decoration: none;
          transition: all 0.3s ease;
          flex: 1;
          white-space: nowrap;
        }

        .btn-download-card:hover {
          background: #00ffc8;
          box-shadow: 0 0 10px rgba(0, 255, 200, 0.3);
          transform: translateY(-1px);
        }

        .card-actions {
          display: flex;
          gap: 8px;
          width: 100%;
          margin-top: auto;
          flex-wrap: wrap;
        }

        .btn-preview-card {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex: 1;
          transition: all 0.3s ease;
        }

        .btn-preview-card:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: #fff;
          transform: translateY(-1px);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: var(--surface-color);
          border: 1px solid rgba(0, 255, 200, 0.3);
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
          animation: modal-in 0.3s ease;
        }

        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .modal-header {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-header h3 {
          margin: 0;
          color: #fff;
          font-size: 1.2rem;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        .modal-body {
          flex: 1;
          background: #1a1a1a;
          position: relative;
          overflow: hidden;
        }

        .modal-pdf-viewer {
          width: 100%;
          height: 100%;
          border: none;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: flex-end;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid #444;
          color: #888;
          padding: 12px;
          border-radius: 8px;
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

export default SplitPdf;
