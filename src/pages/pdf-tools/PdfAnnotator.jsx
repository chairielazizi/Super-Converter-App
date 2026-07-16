import React, { useState, useRef, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Document, Page, pdfjs } from "react-pdf";
import { motion } from "framer-motion";
import FileUploader from "../../components/FileUploader";
import { ArrowLeft, Download, RefreshCw, PenTool, Type, Square, Trash2, X, Check, Edit3, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { getTimestampedFilename } from "../../utils/fileUtils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// Generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

const PDF_SCALE = 1.3;

// --- Signature Pad Component ---
const SignaturePad = ({ onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 600;
    canvas.height = 300;
    canvas.style.width = "300px";
    canvas.style.height = "150px";

    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.lineCap = "round";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    contextRef.current = context;
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    startDrawing({ nativeEvent: { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top } });
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    draw({ nativeEvent: { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top } });
  };

  return (
    <div className="signature-modal-overlay">
      <div className="signature-modal">
        <h3>Draw Signature</h3>
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={draw}
            onMouseLeave={finishDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={finishDrawing}
          />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => {
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");
            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.width, canvas.height);
          }}>Clear</button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn-primary" onClick={() => onSave(canvasRef.current.toDataURL("image/png"))}>
              Save
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .signature-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 2000; backdrop-filter: blur(5px); }
        .signature-modal { background: var(--surface-color); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 20px; }
        .signature-modal h3 { margin: 0; color: #fff; }
        .canvas-wrapper { background: #fff; border-radius: 8px; cursor: crosshair; }
        .modal-actions { display: flex; justify-content: space-between; align-items: center; }
        .btn-primary { background: var(--primary-color); color: #000; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; }
      `}</style>
    </div>
  );
};

// --- Main Editor Component ---
const VisualPdfEditor = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const pageContainerRef = useRef(null);
  
  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  
  const [showSignModal, setShowSignModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);
  const [processedPdfBytes, setProcessedPdfBytes] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFilesSelected = (newFiles) => {
    const selectedFile = newFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setElements([]);
      setSelectedElementId(null);
      setDownloadResult(null);
      setPreviewUrl(null);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onPageLoadSuccess = (page) => {
    // page.width is unscaled. We need the actual rendered dimensions to map coordinates.
    setPageDimensions({ width: page.width * PDF_SCALE, height: page.height * PDF_SCALE });
  };

  // --- Element Actions ---
  const addText = () => {
    const id = generateId();
    setElements([...elements, { id, type: 'text', x: 50, y: 50, pageIndex: currentPage, content: "New Text", color: "#FF0000", size: 24, font: 'Helvetica' }]);
    setSelectedElementId(id);
  };

  const addShape = () => {
    const id = generateId();
    setElements([...elements, { id, type: 'rect', x: 100, y: 100, pageIndex: currentPage, width: 100, height: 50, color: "#ff0000", outline: "#000000" }]);
    setSelectedElementId(id);
  };

  const addSignature = (dataUrl) => {
    const id = generateId();
    setElements([...elements, { id, type: 'signature', x: 50, y: 50, pageIndex: currentPage, content: dataUrl, width: 150, height: 75 }]);
    setSelectedElementId(id);
    setShowSignModal(false);
  };

  const updateElement = (id, newProps) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));
  };

  const removeElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // --- Apply Changes ---
  const hexToRgb = (hex) => {
    let r = 0, g = 0, b = 0;
    if (hex && hex.length === 7) {
      r = parseInt(hex.substring(1,3), 16) / 255;
      g = parseInt(hex.substring(3,5), 16) / 255;
      b = parseInt(hex.substring(5,7), 16) / 255;
    }
    return rgb(r, g, b);
  };

  const applyEdits = async () => {
    if (!file) return;
    setIsProcessing(true);
    setDownloadResult(null);
    setSelectedElementId(null);

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();

      // Embed fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

      for (const el of elements) {
        if (el.pageIndex - 1 >= 0 && el.pageIndex - 1 < pages.length) {
          const page = pages[el.pageIndex - 1];
          const { width: pdfWidth, height: pdfHeight } = page.getSize();
          
          const scaleX = pdfWidth / pageDimensions.width;
          const scaleY = pdfHeight / pageDimensions.height;

          const pdfX = el.x * scaleX;
          const pdfY = pdfHeight - (el.y * scaleY); 

          if (el.type === 'text') {
            const fontSize = el.size * scaleY;
            let customFont = helveticaFont;
            if (el.font === 'Courier') customFont = courierFont;
            if (el.font === 'TimesRoman') customFont = timesRomanFont;

            page.drawText(el.content, {
              x: pdfX,
              y: pdfY - fontSize,
              size: fontSize,
              color: hexToRgb(el.color),
              font: customFont
            });
          } else if (el.type === 'rect') {
            page.drawRectangle({
              x: pdfX,
              y: pdfY - (el.height * scaleY),
              width: el.width * scaleX,
              height: el.height * scaleY,
              color: hexToRgb(el.color),
              opacity: 0.4,
              borderWidth: 2,
              borderColor: hexToRgb(el.outline),
            });
          } else if (el.type === 'signature') {
            const imgBytes = await fetch(el.content).then(res => res.arrayBuffer());
            const image = await pdfDoc.embedPng(imgBytes);
            page.drawImage(image, {
              x: pdfX,
              y: pdfY - (el.height * scaleY),
              width: el.width * scaleX,
              height: el.height * scaleY,
            });
          }
        }
      }

      const pdfBytesArray = await pdfDoc.save();
      setProcessedPdfBytes(pdfBytesArray);

      const blob = new Blob([pdfBytesArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error editing PDF:", error);
      alert("Failed to edit PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const currentPageElements = elements.filter(el => el.pageIndex === currentPage);

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      <button className="back-btn" onClick={() => navigate("/pdf-editor")}>
        <ArrowLeft size={18} /> Back
      </button>

      <header style={{ marginBottom: "20px", textAlign: "center" }}>
        <h2 className="neon-text">Visual PDF Editor</h2>
        <p style={{ color: "#888" }}>Add text, shapes, and signatures directly onto your PDF</p>
      </header>

      <div className="tool-content">
        {!file ? (
          <FileUploader
            onFilesSelected={handleFilesSelected}
            accept={{ "application/pdf": [".pdf"] }}
            multiple={false}
            label="Drop a PDF file here to start editing"
          />
        ) : !previewUrl && !downloadResult ? (
          <div className="editor-workspace">
            {/* Toolbar */}
            <div className="editor-toolbar">
              <button className="tool-btn" onClick={addText}><Type size={18} /> Add Text</button>
              <button className="tool-btn" onClick={addShape}><Square size={18} /> Add Shape</button>
              <button className="tool-btn" onClick={() => setShowSignModal(true)}><PenTool size={18} /> Add Signature</button>
              
              <div className="toolbar-spacer" style={{ flex: 1 }}></div>
              <button className="btn-neon" onClick={applyEdits} disabled={isProcessing}>
                {isProcessing ? "Applying..." : "Apply Edits"}
              </button>
            </div>

            {/* Main Canvas Area */}
            <div className="canvas-container" onClick={(e) => {
              if (e.target.classList.contains('canvas-container') || e.target.classList.contains('react-pdf__Page__canvas')) {
                setSelectedElementId(null);
              }
            }}>
              <div className="pdf-wrapper" ref={pageContainerRef}>
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="pdf-document"
                >
                  <Page 
                    pageNumber={currentPage} 
                    onLoadSuccess={onPageLoadSuccess}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="pdf-page"
                    scale={PDF_SCALE}
                  />
                  
                  {/* Overlay Elements */}
                  {currentPageElements.map(el => (
                    <motion.div
                      key={el.id}
                      className="visual-element"
                      drag
                      dragMomentum={false}
                      onPointerDown={() => setSelectedElementId(el.id)}
                      onDragEnd={(e, info) => {
                        updateElement(el.id, {
                          x: el.x + info.offset.x,
                          y: el.y + info.offset.y
                        });
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        x: el.x,
                        y: el.y,
                        cursor: 'grab',
                        outline: selectedElementId === el.id ? '2px dashed var(--primary-color)' : 'none',
                      }}
                    >
                      {el.type === 'text' && (
                        <div className="text-element-wrapper group">
                          <input 
                            type="text" 
                            value={el.content}
                            onChange={(e) => updateElement(el.id, { content: e.target.value })}
                            className="editable-text"
                            style={{ 
                              color: el.color, 
                              fontSize: `${el.size}px`, 
                              fontFamily: el.font === 'Courier' ? 'monospace' : el.font === 'TimesRoman' ? 'serif' : 'sans-serif' 
                            }}
                          />
                        </div>
                      )}
                      
                      {el.type === 'rect' && (
                        <div className="shape-element-wrapper group" style={{
                          width: el.width, height: el.height, backgroundColor: el.color, border: `2px solid ${el.outline}`, opacity: 0.4
                        }}>
                        </div>
                      )}
                      
                      {el.type === 'signature' && (
                        <div className="signature-element-wrapper group" style={{ width: el.width, height: el.height }}>
                          <img 
                            src={el.content} 
                            alt="signature" 
                            draggable="false"
                            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} 
                          />
                        </div>
                      )}

                      {/* Floating Toolbar (Sejda style) */}
                      {selectedElementId === el.id && (
                        <div className="floating-toolbar" onPointerDown={(e) => e.stopPropagation()}>
                          {el.type === 'text' && (
                            <>
                              <input 
                                type="color" 
                                value={el.color} 
                                onChange={(e) => updateElement(el.id, { color: e.target.value })}
                                title="Text Color"
                                className="color-picker"
                              />
                              <div className="divider" />
                              <select 
                                value={el.font} 
                                onChange={(e) => updateElement(el.id, { font: e.target.value })}
                                className="prop-select"
                              >
                                <option value="Helvetica">Helvetica</option>
                                <option value="Courier">Courier</option>
                                <option value="TimesRoman">Times</option>
                              </select>
                              <div className="divider" />
                              <input 
                                type="number" 
                                value={el.size} 
                                onChange={(e) => updateElement(el.id, { size: Number(e.target.value) })}
                                className="prop-input"
                                title="Font Size"
                                min="8" max="120"
                                style={{ width: '60px' }}
                              />
                            </>
                          )}
                          {el.type === 'rect' && (
                            <>
                              <label style={{ fontSize: '12px' }}>Fill</label>
                              <input 
                                type="color" 
                                value={el.color} 
                                onChange={(e) => updateElement(el.id, { color: e.target.value })}
                                title="Fill Color"
                                className="color-picker"
                              />
                              <div className="divider" />
                              <label style={{ fontSize: '12px' }}>Border</label>
                              <input 
                                type="color" 
                                value={el.outline} 
                                onChange={(e) => updateElement(el.id, { outline: e.target.value })}
                                title="Border Color"
                                className="color-picker"
                              />
                            </>
                          )}
                          
                          <div className="divider" />
                          <button className="floating-delete-btn" onClick={() => removeElement(el.id)} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}

                    </motion.div>
                  ))}
                </Document>
              </div>
            </div>

            {/* Pagination Controls */}
            {numPages > 1 && (
              <div className="pagination-controls">
                <button 
                  disabled={currentPage <= 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="btn-secondary"
                >Previous</button>
                <span>Page {currentPage} of {numPages}</span>
                <button 
                  disabled={currentPage >= numPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="btn-secondary"
                >Next</button>
              </div>
            )}
            
            <button
              className="btn-secondary"
              onClick={() => { setFile(null); setElements([]); }}
              style={{ width: "100%", marginTop: "20px" }}
            >
              Cancel
            </button>
          </div>
        ) : null}

        {previewUrl && !downloadResult && (
          <div className="preview-section">
            <div className="preview-header">
              <Check size={20} style={{ color: "var(--accent-color)" }} />
              <h3>Success! Preview your changes</h3>
            </div>
            <div className="pdf-viewer-container">
              <iframe src={previewUrl} className="pdf-viewer-iframe" title="Preview" />
            </div>
            <div className="preview-actions">
              <button
                className="btn-neon"
                onClick={async () => {
                  const result = await downloadPdf(processedPdfBytes, getTimestampedFilename("edited"));
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
                  setProcessedPdfBytes(null);
                }}
                style={{ flex: 1 }}
              >
                <RefreshCw size={18} /> Continue Editing
              </button>
            </div>
          </div>
        )}

        {downloadResult && (
          <div className="result-section">
            <h3 className="success-title">Downloaded Successfully!</h3>
            <p className="success-subtitle">Your edited PDF has been saved.</p>
            <div className="download-action-area">
              {downloadResult.isBrowser ? (
                <a className="btn-download-primary" href={downloadResult.uri} download={downloadResult.filename}>
                  <Download size={18} /> Download Again
                </a>
              ) : (
                <p>✅ PDF saved to your device!</p>
              )}
            </div>
            <button className="btn-secondary" onClick={() => {
              setFile(null); setPreviewUrl(null); setProcessedPdfBytes(null); setDownloadResult(null); setElements([]);
            }}>Edit Another PDF</button>
          </div>
        )}
      </div>

      {showSignModal && (
        <SignaturePad 
          onSave={addSignature} 
          onCancel={() => setShowSignModal(false)} 
        />
      )}

      <style>{`
        .back-btn { background: transparent; border: 1px solid #333; color: var(--primary-color); padding: 8px 16px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-bottom: 20px; transition: all 0.3s ease; }
        .back-btn:hover { background: rgba(64, 224, 208, 0.1); border-color: var(--primary-color); }
        
        .editor-workspace { background: var(--surface-color); padding: 20px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); display: flex; flex-direction: column; gap: 20px; }
        .editor-toolbar { display: flex; gap: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px; flex-wrap: wrap; }
        .tool-btn { background: transparent; border: 1px solid #444; color: #fff; padding: 8px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .tool-btn:hover { background: rgba(255,255,255,0.1); border-color: #666; }
        
        .canvas-container { display: flex; justify-content: center; background: #1a1a1a; padding: 20px; border-radius: 8px; overflow: auto; height: 75vh; min-height: 600px; }
        .pdf-wrapper { position: relative; display: inline-block; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
        .pdf-document { display: flex; justify-content: center; }
        .pdf-page canvas { border-radius: 4px; }
        
        .visual-element { z-index: 100; user-select: none; }
        .visual-element:active { cursor: grabbing !important; }
        
        .editable-text { background: transparent; border: 1px dashed transparent; outline: none; white-space: nowrap; }
        .editable-text:focus, .editable-text:hover { border-color: #aaa; background: rgba(255,255,255,0.1); }
        
        /* Floating Toolbar */
        .floating-toolbar {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 10px;
          background: #fff;
          color: #333;
          padding: 6px 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          z-index: 200;
          cursor: default;
          white-space: nowrap;
        }
        
        .floating-toolbar::before {
          content: '';
          position: absolute;
          top: -6px;
          left: 20px;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 6px solid #fff;
        }

        .divider { width: 1px; height: 20px; background: #ddd; }
        .color-picker { width: 24px; height: 24px; padding: 0; border: none; border-radius: 4px; cursor: pointer; background: transparent; }
        .prop-select, .prop-input { background: #f0f0f0; color: #333; border: 1px solid #ccc; padding: 4px 8px; border-radius: 4px; font-size: 0.9rem; }
        .floating-delete-btn { background: transparent; color: #ff5252; border: none; cursor: pointer; display: flex; align-items: center; padding: 4px; transition: 0.2s; border-radius: 4px; }
        .floating-delete-btn:hover { background: #ffebee; }

        .pagination-controls { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 15px; color: #fff; }
        
        .preview-section { margin-top: 20px; }
        .preview-header { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px; padding: 16px; background: var(--surface-color); border-radius: 12px; border: 1px solid rgba(0, 255, 200, 0.2); }
        .pdf-viewer-container { background: var(--surface-color); border: 1px solid #333; border-radius: 12px; overflow: hidden; margin-bottom: 20px; height: 600px; }
        .pdf-viewer-iframe { width: 100%; height: 100%; border: none; background: #1a1a1a; }
        .preview-actions { display: flex; gap: 16px; }
        
        .result-section { text-align: center; padding: 40px; background: rgba(0,255,200,0.05); border-radius: 16px; border: 1px solid rgba(0,255,200,0.2); }
        .success-title { color: #fff; font-size: 1.5rem; margin-bottom: 8px; }
        .success-subtitle { color: #888; margin-bottom: 30px; }
        .download-action-area { background: rgba(255,255,255,0.03); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 25px; }
        .btn-download-primary { background: var(--accent-color); color: #000; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; text-decoration: none; }
        
        .btn-secondary { background: transparent; border: 1px solid #444; color: #888; padding: 10px 24px; border-radius: 6px; cursor: pointer; transition: all 0.3s ease; }
        .btn-secondary:hover:not(:disabled) { border-color: #666; color: #fff; background: rgba(255, 255, 255, 0.05); }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-neon { background: var(--primary-color); color: #000; padding: 12px 24px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 8px; justify-content: center; }
        .btn-neon:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 0 15px rgba(64, 224, 208, 0.4); }
        .btn-neon:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default VisualPdfEditor;
