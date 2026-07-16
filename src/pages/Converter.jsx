import React, { useState, useRef, useEffect } from "react";
import FileUploader from "../components/FileUploader";
import {
  FileType,
  ArrowRight,
  CheckCircle,
  Loader2,
  Download,
  ChevronDown,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { pdfjs } from "react-pdf";

const Converter = () => {
  const [file, setFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState("docx");
  const [status, setStatus] = useState("idle"); // idle, converting, done
  const [progress, setProgress] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const exportOptions = [
    { id: "pdf", label: "PDF Document (.pdf)", iconText: "PDF", color: "#F40F02", type: "text" },
    { id: "docx", label: "Word (.docx)", iconText: "W", color: "#2B579A", type: "text" },
    { id: "xlsx", label: "Excel (.xlsx)", iconText: "X", color: "#217346", type: "text" },
    { id: "pptx", label: "PowerPoint (.pptx)", iconText: "P", color: "#D24726", type: "text" },
    { id: "jpg", label: "Image (.jpg)", iconText: ImageIcon, color: "#FFB900", type: "icon" },
  ];

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

  const handleDownload = async () => {
    if (!file) return;

    if (targetFormat === "jpg" && file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${file.name.split('.')[0]}_converted.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error("Error converting to JPG:", err);
        alert("Failed to convert PDF to JPG.");
      }
      return;
    }

    if (["docx", "xlsx", "pptx"].includes(targetFormat)) {
      alert(
        "Notice: True conversion to Office formats (Word, Excel, PowerPoint) requires a backend server or external API. \n\nAs this app currently runs entirely in the browser, downloading this file will simply yield a renamed dummy file, which is why your OS cannot open it correctly."
      );
    }
    
    if (targetFormat === "pdf" && file.name.match(/\.(docx|pptx|xlsx)$/i)) {
      alert(
        "Notice: True conversion from Office formats to PDF requires a backend server. Downloading this will yield a renamed file."
      );
    }

    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.split('.')[0]}_converted.${targetFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedOption = exportOptions.find((o) => o.id === targetFormat);

  return (
    <div className="page-container">
      <header style={{ marginBottom: "30px", textAlign: "center" }}>
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
              
              <div className="custom-dropdown-container" ref={dropdownRef}>
                <button
                  className="dropdown-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="trigger-left">
                    <Upload size={18} /> 
                    <span>Export As {selectedOption ? `— ${selectedOption.label}` : ''}</span>
                  </div>
                  <ChevronDown size={18} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {dropdownOpen && (
                  <div className="dropdown-menu">
                    {exportOptions.map((opt) => (
                      <div
                        key={opt.id}
                        className={`dropdown-item ${targetFormat === opt.id ? "active" : ""}`}
                        onClick={() => {
                          setTargetFormat(opt.id);
                          setDropdownOpen(false);
                        }}
                      >
                        <div
                          className="item-icon-box"
                          style={{ backgroundColor: opt.color }}
                        >
                          {opt.type === "icon" ? (
                            <opt.iconText size={16} color="#fff" />
                          ) : (
                            <span>{opt.iconText}</span>
                          )}
                        </div>
                        <span className="item-label">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="btn-neon" onClick={startConversion} style={{ width: '100%', marginTop: '10px' }}>
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
              
              <div className="success-actions">
                <button className="btn-neon" onClick={handleDownload}>
                  <Download size={18} style={{ marginRight: "8px" }} /> Download{" "}
                  {targetFormat.toUpperCase()}
                </button>
                <button className="btn-secondary" onClick={() => setFile(null)}>
                  Convert Another
                </button>
              </div>
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
          gap: 16px;
        }

        /* Custom Dropdown Styles */
        .custom-dropdown-container {
          position: relative;
          width: 100%;
        }

        .dropdown-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .dropdown-trigger:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .trigger-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 100%;
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          z-index: 100;
          overflow: hidden;
          padding: 8px 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .dropdown-item:hover, .dropdown-item.active {
          background: rgba(255, 255, 255, 0.08);
        }

        .item-icon-box {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .item-label {
          color: #eee;
          font-size: 0.95rem;
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

        .success-actions {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
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
