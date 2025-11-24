import React, { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import { Download, ArrowLeft, RotateCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RotatePdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [rotation, setRotation] = useState(90);
  const [rotatedPdfUrl, setRotatedPdfUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelected = (files) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setRotatedPdfUrl(null);
  };

  const rotatePdf = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        page.setRotation(degrees(rotation));
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setRotatedPdfUrl(url);
    } catch (error) {
      console.error("Error rotating PDF:", error);
      alert("Failed to rotate PDF. Please try again.");
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
        <h2 className="neon-text">Rotate PDF</h2>
        <p style={{ color: "#888" }}>Rotate all pages in your PDF</p>
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
            <div className="file-info">
              <p>
                <strong>{file.name}</strong>
              </p>
              {!rotatedPdfUrl && (
                <button className="text-btn" onClick={() => setFile(null)}>
                  Change File
                </button>
              )}
            </div>

            {!rotatedPdfUrl && (
              <>
                <div className="rotation-selector">
                  <label>Rotation Angle:</label>
                  <div className="rotation-btns">
                    {[90, 180, 270].map((angle) => (
                      <button
                        key={angle}
                        className={`rotation-btn ${
                          rotation === angle ? "active" : ""
                        }`}
                        onClick={() => setRotation(angle)}
                      >
                        <RotateCw size={16} /> {angle}°
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="btn-neon"
                  onClick={rotatePdf}
                  disabled={isProcessing}
                  style={{ width: "100%", marginTop: "20px" }}
                >
                  {isProcessing ? "Rotating..." : "Rotate PDF"}
                </button>
              </>
            )}

            {rotatedPdfUrl && (
              <div className="result-section">
                <h3 style={{ color: "#00FFC8" }}>PDF Rotated!</h3>
                <a
                  href={rotatedPdfUrl}
                  download="rotated.pdf"
                  className="btn-neon"
                >
                  <Download size={18} /> Download Rotated PDF
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
          margin-bottom: 20px;
        }

        .rotation-selector {
          background: var(--surface-color);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #333;
        }

        .rotation-selector label {
          display: block;
          margin-bottom: 12px;
          color: #888;
        }

        .rotation-btns {
          display: flex;
          gap: 10px;
        }

        .rotation-btn {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #444;
          color: #888;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.3s ease;
        }

        .rotation-btn.active {
          background: rgba(64, 224, 208, 0.1);
          border-color: var(--primary-color);
          color: var(--primary-color);
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

export default RotatePdf;
