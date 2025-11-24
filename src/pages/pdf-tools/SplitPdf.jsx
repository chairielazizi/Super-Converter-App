import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import { Download, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        pages.push({ pageNum: i + 1, url });
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
                <h3 style={{ color: "#fff", marginBottom: "16px" }}>
                  {splitPages.length} Pages Extracted
                </h3>
                {splitPages.map((page) => (
                  <div key={page.pageNum} className="page-card">
                    <span>Page {page.pageNum}</span>
                    <a
                      href={page.url}
                      download={`page-${page.pageNum}.pdf`}
                      className="btn-neon"
                    >
                      <Download size={16} /> Download
                    </a>
                  </div>
                ))}
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

        .text-btn {
          background: transparent;
          border: none;
          color: var(--primary-color);
          margin-top: 8px;
          cursor: pointer;
          text-decoration: underline;
        }

        .pages-grid {
          margin-top: 20px;
        }

        .page-card {
          background: var(--surface-color);
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #333;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-card .btn-neon {
          padding: 8px 16px;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>
    </div>
  );
};

export default SplitPdf;
