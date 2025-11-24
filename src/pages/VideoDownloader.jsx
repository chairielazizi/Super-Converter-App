import React, { useState } from "react";
import { Download, Link as LinkIcon, AlertTriangle, Check } from "lucide-react";

const VideoDownloader = () => {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle, fetching, ready, downloading, done
  const [error, setError] = useState(null);

  const handleFetch = () => {
    if (!url) return;

    // Simple validation to exclude YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      setError(
        "YouTube downloads are not supported on the Play Store version."
      );
      return;
    }

    setError(null);
    setStatus("fetching");

    // Simulate fetching metadata
    setTimeout(() => {
      setStatus("ready");
    }, 1500);
  };

  const handleDownload = () => {
    setStatus("downloading");
    // Simulate download
    setTimeout(() => {
      setStatus("done");
    }, 2000);
  };

  return (
    <div className="page-container">
      <header style={{ marginBottom: "30px" }}>
        <h2 className="neon-text">Video Downloader</h2>
        <p style={{ color: "#888" }}>
          Download videos from supported websites.
        </p>
      </header>

      <div className="downloader-card">
        <div className="input-group">
          <LinkIcon className="input-icon" size={20} />
          <input
            type="text"
            placeholder="Paste video URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={status === "downloading"}
          />
        </div>

        {error && (
          <div className="error-msg">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {status === "idle" && (
          <button
            className="btn-neon"
            onClick={handleFetch}
            style={{ width: "100%", marginTop: "20px" }}
          >
            Fetch Video
          </button>
        )}

        {status === "fetching" && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching video info...</p>
          </div>
        )}

        {status === "ready" && (
          <div className="video-preview">
            <div className="preview-placeholder">
              <span>Video Preview</span>
            </div>
            <div className="video-info">
              <h4>Awesome Video Title.mp4</h4>
              <p>Duration: 10:24 • Size: 45MB</p>
            </div>
            <button
              className="btn-neon"
              onClick={handleDownload}
              style={{ width: "100%" }}
            >
              Download MP4
            </button>
          </div>
        )}

        {status === "downloading" && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Downloading... Please wait.</p>
          </div>
        )}

        {status === "done" && (
          <div className="success-state">
            <div className="success-icon">
              <Check size={32} />
            </div>
            <h3>Download Complete!</h3>
            <p>Video saved to your gallery.</p>
            <button
              className="text-btn"
              onClick={() => {
                setStatus("idle");
                setUrl("");
              }}
            >
              Download Another
            </button>
          </div>
        )}
      </div>

      <div className="info-box">
        <h4>Supported Sites</h4>
        <p>Vimeo, Dailymotion, Facebook, Instagram, TikTok, and more.</p>
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "8px" }}>
          * YouTube is not supported due to Google Play Store policies.
        </p>
      </div>

      <style>{`
        .downloader-card {
          background: var(--surface-color);
          border: 1px solid #333;
          border-radius: 16px;
          padding: 24px;
          max-width: 500px;
          margin: 0 auto 30px auto;
        }

        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: #888;
        }

        .input-group input {
          padding-left: 40px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid #444;
          height: 50px;
          font-size: 1rem;
        }

        .input-group input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 10px rgba(64, 224, 208, 0.2);
        }

        .error-msg {
          color: var(--danger-color);
          font-size: 0.9rem;
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .loading-state {
          text-align: center;
          padding: 30px 0;
          color: #888;
        }

        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(64, 224, 208, 0.3);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px auto;
        }

        .video-preview {
          margin-top: 20px;
          animation: slideDown 0.3s ease;
        }

        .preview-placeholder {
          background: #000;
          height: 180px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #555;
          margin-bottom: 16px;
          border: 1px solid #333;
        }

        .video-info {
          margin-bottom: 20px;
        }

        .video-info h4 {
          margin: 0 0 4px 0;
          color: #fff;
        }

        .video-info p {
          margin: 0;
          color: #888;
          font-size: 0.9rem;
        }

        .success-state {
          text-align: center;
          padding: 20px 0;
        }

        .success-icon {
          width: 60px;
          height: 60px;
          background: rgba(0, 255, 200, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-color);
          margin: 0 auto 16px auto;
        }

        .info-box {
          text-align: center;
          color: #888;
          font-size: 0.9rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .info-box h4 {
          color: #fff;
          margin-bottom: 8px;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default VideoDownloader;
