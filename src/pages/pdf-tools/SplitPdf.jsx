import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import { Download, ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { Capacitor } from "@capacitor/core";

const SplitPdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [splitPages, setSplitPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelected = async (files) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setSplitPages([]);
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
              <p>
                <strong>{file.name}</strong>
              </p>
              <button className="text-btn" onClick={() => setFile(null)}>
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
                    Download individual pages below
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

                      {page.url ? (
                        /* Browser: Programmatic Link Trigger */
                        <button
                          className="btn-download-card"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = page.url;
                            link.download = `page-${page.pageNum}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download size={14} /> Download
                        </button>
                      ) : (
                        /* Mobile: Button triggering Filesystem write */
                        <button
                          className="btn-download-card"
                          onClick={async () => {
                            const result = await downloadPdf(
                              page.pdfBytes,
                              `page-${page.pageNum}.pdf`
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
                  ))}
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    setFile(null);
                    setSplitPages([]);
                  }}
                  style={{ marginTop: "30px", width: "100%" }}
                >
                  Split Another PDF
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
          max-width: 800px;
          margin: 0 auto;
        }

        .file-info {
          text-align: center;
          padding: 20px;
          background: var(--surface-color);
          border-radius: 12px;
          border: 1px solid #333;
        }

        .text-btn {
          background: transparent;
          border: none;
          color: var(--primary-color);
          margin-top: 8px;
          cursor: pointer;
          text-decoration: underline;
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
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .btn-download-card:hover {
          background: #00ffc8;
          transform: scale(1.02);
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
