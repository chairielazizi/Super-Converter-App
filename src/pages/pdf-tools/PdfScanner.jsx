import React, { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { ArrowLeft, Camera, Download, Eye, RefreshCw, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { getTimestampedFilename } from "../../utils/fileUtils";

const PdfScanner = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Start Camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera: ", err);
      alert("Could not access the camera. Please ensure you have granted permission.");
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Capture Image
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImages(prev => [...prev, dataUrl]);
  };

  const removeImage = (index) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const generatePdf = async () => {
    if (capturedImages.length === 0) return;
    setIsProcessing(true);
    stopCamera();

    try {
      const pdfDoc = await PDFDocument.create();

      for (const imgData of capturedImages) {
        const imgBytes = await fetch(imgData).then(res => res.arrayBuffer());
        const image = await pdfDoc.embedJpg(imgBytes);
        const { width, height } = image.scale(1);
        
        // A4 size is roughly 595.28 x 841.89
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      }

      const pdfBytesArray = await pdfDoc.save();
      setPdfBytes(pdfBytesArray);

      const blob = new Blob([pdfBytesArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
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
        <h2 className="neon-text">PDF Scanner</h2>
        <p style={{ color: "#888" }}>Scan documents with your camera to create a PDF</p>
      </header>

      <div className="tool-content">
        {!previewUrl && !downloadResult && (
          <div className="scanner-container">
            {!cameraActive ? (
              <div className="start-camera-section">
                <div className="camera-icon-wrapper">
                  <Camera size={48} style={{ color: "var(--primary-color)" }} />
                </div>
                <h3>Ready to Scan?</h3>
                <p>Use your device's camera to scan documents directly.</p>
                <button className="btn-neon" onClick={startCamera}>
                  <Camera size={18} /> Start Camera
                </button>
              </div>
            ) : (
              <div className="camera-view-container">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="camera-video"
                />
                <button className="capture-btn" onClick={captureImage}>
                  <div className="capture-btn-inner"></div>
                </button>
                <button className="stop-camera-btn" onClick={stopCamera}>
                  Cancel
                </button>
              </div>
            )}
            
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

            {capturedImages.length > 0 && (
              <div className="captured-images-section">
                <h4 style={{ color: '#fff', marginBottom: '10px' }}>Captured Pages ({capturedImages.length})</h4>
                <div className="images-grid">
                  {capturedImages.map((img, idx) => (
                    <div key={idx} className="image-preview-wrapper">
                      <img src={img} alt={`Scanned page ${idx + 1}`} className="scanned-thumb" />
                      <button className="remove-img-btn" onClick={() => removeImage(idx)}>
                        <X size={14} />
                      </button>
                      <span className="page-num">{idx + 1}</span>
                    </div>
                  ))}
                  
                  {cameraActive && (
                    <div className="add-more-placeholder" onClick={captureImage}>
                      <Plus size={24} style={{ color: '#888' }} />
                    </div>
                  )}
                </div>

                <button
                  className="btn-neon"
                  onClick={generatePdf}
                  disabled={isProcessing}
                  style={{ width: "100%", marginTop: "20px" }}
                >
                  {isProcessing ? "Generating PDF..." : `Create PDF with ${capturedImages.length} Pages`}
                </button>
              </div>
            )}
          </div>
        )}

        {previewUrl && !downloadResult && (
          <div className="preview-section">
            <div className="preview-header">
              <Eye size={20} style={{ color: "var(--accent-color)" }} />
              <h3>Preview Scanned PDF</h3>
            </div>
            <div className="pdf-viewer-container">
              <iframe src={previewUrl} className="pdf-viewer" title="Preview" />
            </div>
            <div className="preview-actions">
              <button
                className="btn-neon"
                onClick={async () => {
                  const result = await downloadPdf(pdfBytes, getTimestampedFilename("scanned-document"));
                  setDownloadResult(result);
                }}
                style={{ flex: 1 }}
              >
                <Download size={18} /> Download
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setPreviewUrl(null);
                  setPdfBytes(null);
                  startCamera();
                }}
                style={{ flex: 1 }}
              >
                <RefreshCw size={18} /> Scan More
              </button>
            </div>
          </div>
        )}

        {downloadResult && (
          <div className="result-section">
            <h3 className="success-title">PDF Created Successfully!</h3>
            <p className="success-subtitle">Your scanned document is ready.</p>
            <div className="download-action-area">
              {downloadResult.isBrowser ? (
                <a className="btn-download-primary" href={downloadResult.uri} download={downloadResult.filename}>
                  <Download size={18} /> Download PDF
                </a>
              ) : (
                <p>✅ PDF saved to your device!</p>
              )}
            </div>
            <button className="btn-secondary" onClick={() => {
              setCapturedImages([]); setPreviewUrl(null); setPdfBytes(null); setDownloadResult(null); startCamera();
            }}>Scan Another Document</button>
          </div>
        )}
      </div>

      <style>{`
        .back-btn { background: transparent; border: 1px solid #333; color: var(--primary-color); padding: 8px 16px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-bottom: 20px; transition: all 0.3s ease; }
        .back-btn:hover { background: rgba(64, 224, 208, 0.1); border-color: var(--primary-color); }
        .scanner-container { background: var(--surface-color); padding: 20px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); }
        .start-camera-section { text-align: center; padding: 40px 20px; }
        .camera-icon-wrapper { width: 80px; height: 80px; background: rgba(64,224,208,0.1); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 20px; }
        .start-camera-section h3 { color: #fff; margin-bottom: 10px; }
        .start-camera-section p { color: #888; margin-bottom: 30px; }
        .camera-view-container { position: relative; width: 100%; border-radius: 12px; overflow: hidden; background: #000; display: flex; justify-content: center; align-items: center; min-height: 400px; }
        .camera-video { width: 100%; height: auto; max-height: 70vh; object-fit: cover; }
        .capture-btn { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); width: 70px; height: 70px; border-radius: 50%; background: rgba(255,255,255,0.4); border: 3px solid #fff; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 10; transition: all 0.2s; }
        .capture-btn:active { transform: translateX(-50%) scale(0.95); }
        .capture-btn-inner { width: 54px; height: 54px; border-radius: 50%; background: #fff; }
        .stop-camera-btn { position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.6); color: #fff; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; backdrop-filter: blur(5px); }
        
        .captured-images-section { margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }
        .images-grid { display: flex; gap: 15px; overflow-x: auto; padding-bottom: 10px; }
        .image-preview-wrapper { position: relative; width: 100px; height: 140px; flex-shrink: 0; border-radius: 8px; overflow: hidden; border: 2px solid var(--primary-color); }
        .scanned-thumb { width: 100%; height: 100%; object-fit: cover; }
        .remove-img-btn { position: absolute; top: 5px; right: 5px; background: rgba(255,0,0,0.8); color: white; border: none; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; }
        .page-num { position: absolute; bottom: 5px; left: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; }
        .add-more-placeholder { width: 100px; height: 140px; flex-shrink: 0; border-radius: 8px; border: 2px dashed #444; display: flex; justify-content: center; align-items: center; cursor: pointer; background: rgba(255,255,255,0.05); }
        
        .preview-section { margin-top: 20px; }
        .preview-header { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px; padding: 16px; background: var(--surface-color); border-radius: 12px; border: 1px solid rgba(0, 255, 200, 0.2); }
        .pdf-viewer-container { background: var(--surface-color); border: 1px solid #333; border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
        .pdf-viewer { width: 100%; height: calc(100vh - 450px); min-height: 600px; border: none; background: #1a1a1a; }
        .preview-actions { display: flex; gap: 16px; }
        .result-section { text-align: center; padding: 40px; background: rgba(0,255,200,0.05); border-radius: 16px; border: 1px solid rgba(0,255,200,0.2); }
        .success-title { color: #fff; font-size: 1.5rem; margin-bottom: 8px; }
        .success-subtitle { color: #888; margin-bottom: 30px; }
        .download-action-area { background: rgba(255,255,255,0.03); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 25px; }
        .btn-download-primary { background: var(--accent-color); color: #000; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; text-decoration: none; }
        .btn-secondary { background: transparent; border: 1px solid #444; color: #888; padding: 10px 24px; border-radius: 6px; cursor: pointer; transition: all 0.3s ease; }
        .btn-neon { background: var(--primary-color); color: #000; padding: 12px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 8px; justify-content: center; }
        .btn-neon:hover { filter: brightness(1.1); box-shadow: 0 0 15px rgba(64, 224, 208, 0.4); }
      `}</style>
    </div>
  );
};

export default PdfScanner;
