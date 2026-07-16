import React, { useState } from "react";
import FileUploader from "../../components/FileUploader";
import { ArrowLeft, Share2, FileText, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SharePdf = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const handleFilesSelected = (newFiles) => {
    const selectedFile = newFiles[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setShared(false);
  };

  const handleShare = async () => {
    if (!file) return;
    setIsSharing(true);
    
    try {
      if (navigator.share && navigator.canShare) {
        const filesArray = [
          new File([file], file.name, {
            type: file.type || 'application/pdf',
            lastModified: new Date().getTime(),
          })
        ];
        
        if (navigator.canShare({ files: filesArray })) {
          await navigator.share({
            files: filesArray,
            title: file.name,
            text: "Sharing PDF from Super Converter App"
          });
          setShared(true);
        } else {
          alert("Your device does not support sharing this type of file directly.");
        }
      } else {
        alert("The Web Share API is not supported on this browser/device.");
      }
    } catch (error) {
      // AbortError is thrown when user cancels the share sheet
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
        alert("Failed to share the file.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="page-container">
      <button className="back-btn" onClick={() => navigate("/pdf-editor")}>
        <ArrowLeft size={18} /> Back
      </button>

      <header style={{ marginBottom: "20px", textAlign: "center" }}>
        <h2 className="neon-text">Share PDF</h2>
        <p style={{ color: "#888" }}>Quickly share your PDF to other apps or people</p>
      </header>

      <div className="tool-content">
        {!file ? (
          <FileUploader
            onFilesSelected={handleFilesSelected}
            accept={{ "application/pdf": [".pdf"] }}
            multiple={false}
            label="Drop a PDF file here to share"
          />
        ) : (
          <div className="options-panel">
            <div className="file-info-header">
              <FileText size={24} style={{ color: "var(--primary-color)" }} />
              <h3>{file.name}</h3>
            </div>
            
            <p style={{ color: "#aaa", textAlign: "center", marginBottom: "20px" }}>
              Ready to share {Math.round(file.size / 1024)} KB file
            </p>

            <button
              className="btn-neon"
              onClick={handleShare}
              disabled={isSharing}
              style={{ width: "100%", padding: "14px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}
            >
              <Share2 size={20} />
              {isSharing ? "Opening Share Sheet..." : "Share via Native App"}
            </button>
            
            {shared && (
              <p style={{ color: "var(--primary-color)", textAlign: "center", marginTop: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <CheckCircle size={16} /> Shared successfully!
              </p>
            )}

            <button
              className="btn-secondary"
              onClick={() => {
                setFile(null);
                setShared(false);
              }}
              style={{ width: "100%", marginTop: "15px" }}
            >
              Share Another File
            </button>
          </div>
        )}
      </div>

      <style>{`
        .back-btn {
          background: transparent; border: 1px solid #333; color: var(--primary-color);
          padding: 8px 16px; border-radius: 6px; cursor: pointer; display: flex;
          align-items: center; gap: 8px; margin-bottom: 20px; transition: all 0.3s ease;
        }
        .back-btn:hover { background: rgba(64, 224, 208, 0.1); border-color: var(--primary-color); }
        .options-panel { background: var(--surface-color); padding: 30px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); }
        .file-info-header { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        .file-info-header h3 { margin: 0; font-size: 1.2rem; color: #fff; text-align: center; word-break: break-all; }
        .btn-neon { background: var(--primary-color); color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 0 15px rgba(64, 224, 208, 0.4); }
        .btn-neon:hover { transform: translateY(-2px); box-shadow: 0 0 25px rgba(64, 224, 208, 0.6); }
        .btn-secondary { background: transparent; border: 1px solid #444; color: #888; padding: 12px 24px; border-radius: 6px; cursor: pointer; transition: all 0.3s ease; }
        .btn-secondary:hover { border-color: #666; color: #fff; background: rgba(255, 255, 255, 0.05); }
      `}</style>
    </div>
  );
};

export default SharePdf;
