import React, { useState, useEffect, useRef } from "react";
import { Download, Loader2, CheckCircle, Upload, ChevronDown, Video, Music, Image as ImageIcon, Minimize2 } from "lucide-react";
import FileUploader from "../components/FileUploader";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';

const VideoConverter = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("loading_ffmpeg"); // loading_ffmpeg, idle, converting, done
  const [progress, setProgress] = useState(0);
  const [targetFormat, setTargetFormat] = useState("mp3");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState(null);
  
  const ffmpegRef = useRef(new FFmpeg());
  const dropdownRef = useRef(null);

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on('progress', ({ progress }) => {
          setProgress(progress * 100);
        });
        
        await ffmpeg.load({
          coreURL,
          wasmURL,
        });
        setStatus("idle");
      } catch (err) {
        console.error("FFmpeg load error:", err);
        alert("Failed to load video processing engine. Please ensure you have internet access for the initial load.");
        setStatus("idle");
      }
    };
    
    loadFFmpeg();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const exportOptions = [
    { id: "mp3", label: "Extract Audio (.mp3)", icon: Music, color: "#E91E63" },
    { id: "gif", label: "Animated GIF (.gif)", icon: ImageIcon, color: "#9C27B0" },
    { id: "compressed", label: "Compress Video (.mp4)", icon: Minimize2, color: "#FF9800" },
    { id: "webm", label: "Web Video (.webm)", icon: Video, color: "#4CAF50" },
  ];

  const handleFileSelected = (files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setStatus("idle");
      setProgress(0);
      setConvertedBlob(null);
    }
  };

  const startConversion = async () => {
    if (!file) return;
    setStatus("converting");
    setProgress(0);

    try {
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));

      let outputName = 'output.mp4';
      let mimeType = 'video/mp4';

      if (targetFormat === 'mp3') {
        outputName = 'output.mp3';
        mimeType = 'audio/mpeg';
        await ffmpeg.exec(['-i', 'input.mp4', '-q:a', '0', '-map', 'a', outputName]);
      } else if (targetFormat === 'gif') {
        outputName = 'output.gif';
        mimeType = 'image/gif';
        // Max 10 fps, 320px width to prevent massive GIFs and crashes
        await ffmpeg.exec(['-i', 'input.mp4', '-vf', 'fps=10,scale=320:-1:flags=lanczos', '-c:v', 'gif', outputName]);
      } else if (targetFormat === 'compressed') {
        outputName = 'output.mp4';
        mimeType = 'video/mp4';
        await ffmpeg.exec(['-i', 'input.mp4', '-vcodec', 'libx264', '-crf', '28', outputName]);
      } else if (targetFormat === 'webm') {
        outputName = 'output.webm';
        mimeType = 'video/webm';
        await ffmpeg.exec(['-i', 'input.mp4', '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-b:a', '128k', '-c:a', 'libopus', outputName]);
      }

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: mimeType });
      setConvertedBlob({ blob, ext: outputName.split('.')[1] });
      setStatus("done");
    } catch (err) {
      console.error(err);
      alert("An error occurred during conversion.");
      setStatus("idle");
    }
  };

  const handleDownload = () => {
    if (!convertedBlob) return;
    const url = URL.createObjectURL(convertedBlob.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.split('.')[0]}_converted.${convertedBlob.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedOption = exportOptions.find((o) => o.id === targetFormat);

  return (
    <div className="page-container">
      <header style={{ marginBottom: "30px", textAlign: "center" }}>
        <h2 className="neon-text">Video Converter</h2>
        <p style={{ color: "#888" }}>
          Convert, extract, and compress videos entirely in your browser.
        </p>
      </header>

      {status === "loading_ffmpeg" ? (
         <div className="loading-state" style={{ textAlign: 'center', padding: '50px' }}>
            <Loader2 className="spin" size={40} color="var(--primary-color)" style={{ margin: '0 auto 20px auto' }} />
            <p>Initializing Video Engine (Downloading WebAssembly core...)</p>
         </div>
      ) : !file ? (
        <FileUploader
          onFilesSelected={handleFileSelected}
          accept={{
            "video/mp4": [".mp4"],
            "video/webm": [".webm"],
            "video/quicktime": [".mov"],
          }}
          label="Drop MP4, WEBM, or MOV video here"
        />
      ) : (
        <div className="conversion-card">
          <div className="file-info">
            <div className="icon-box">
              <Video size={32} color="var(--primary-color)" />
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
                    <span>Action {selectedOption ? `— ${selectedOption.label}` : ''}</span>
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
                          <opt.icon size={16} color="#fff" />
                        </div>
                        <span className="item-label">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="btn-neon" onClick={startConversion} style={{ width: '100%', marginTop: '10px' }}>
                Start Processing
              </button>
            </div>
          )}

          {status === "converting" && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="status-text">
                <Loader2 size={16} className="spin" /> Processing... {progress.toFixed(0)}%
              </p>
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                This happens entirely on your device. It may take a while depending on video length.
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
              <h3>Processing Complete!</h3>
              <p>Your file is ready to download.</p>
              
              <div className="success-actions">
                <button className="btn-neon" onClick={handleDownload}>
                  <Download size={18} style={{ marginRight: "8px" }} /> Download
                </button>
                <button className="btn-secondary" onClick={() => setFile(null)}>
                  Process Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        /* Reuse styles from Converter.jsx */
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

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default VideoConverter;
