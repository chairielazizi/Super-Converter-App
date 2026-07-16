import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import FileUploader from "../../components/FileUploader";
import { Download, ArrowLeft, Eye, RefreshCw, FolderEdit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadPdf } from "../../utils/downloadHelper";
import { getTimestampedFilename } from "../../utils/fileUtils";

const PdfFormFiller = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);
  
  const [pdfDoc, setPdfDoc] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});

  const handleFilesSelected = async (newFiles) => {
    const selectedFile = newFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewUrl(null);
    setPdfBytes(null);
    setDownloadResult(null);

    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(fileBuffer);
      setPdfDoc(pdf);

      const form = pdf.getForm();
      const fields = form.getFields();
      
      const parsedFields = fields.map(f => {
        const type = f.constructor.name;
        const name = f.getName();
        return { name, type };
      });
      
      setFormFields(parsedFields);
      
      // Initialize form data
      const initialData = {};
      parsedFields.forEach(f => {
        if (f.type === 'PDFCheckBox') initialData[f.name] = false;
        else initialData[f.name] = "";
      });
      setFormData(initialData);

    } catch (e) {
      console.error(e);
      alert("Failed to load PDF form. It might not contain interactive fields.");
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fillForm = async () => {
    if (!pdfDoc) return;
    setIsProcessing(true);
    setDownloadResult(null);

    try {
      const form = pdfDoc.getForm();
      
      formFields.forEach(field => {
        const val = formData[field.name];
        try {
          if (field.type === 'PDFTextField') {
            const f = form.getTextField(field.name);
            f.setText(val || "");
          } else if (field.type === 'PDFCheckBox') {
            const f = form.getCheckBox(field.name);
            if (val) f.check();
            else f.uncheck();
          } else if (field.type === 'PDFDropdown') {
            const f = form.getDropdown(field.name);
            f.select(val);
          }
        } catch (e) {
          console.warn(`Could not set field ${field.name}`, e);
        }
      });

      const pdfBytesArray = await pdfDoc.save();
      setPdfBytes(pdfBytesArray);

      const blob = new Blob([pdfBytesArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error filling form:", error);
      alert("Failed to fill PDF form. Please try again.");
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
        <h2 className="neon-text">PDF Form Filler</h2>
        <p style={{ color: "#888" }}>Fill out interactive PDF forms easily</p>
      </header>

      <div className="tool-content">
        {!file ? (
          <FileUploader
            onFilesSelected={handleFilesSelected}
            accept={{ "application/pdf": [".pdf"] }}
            multiple={false}
            label="Drop a PDF Form here to fill"
          />
        ) : !previewUrl && !downloadResult ? (
          <div className="options-panel">
            <div className="file-info-header">
              <FolderEdit size={20} style={{ color: "var(--primary-color)" }} />
              <h3>{file.name}</h3>
            </div>
            
            {formFields.length === 0 ? (
              <p style={{color: '#aaa', textAlign: 'center'}}>No interactive form fields found in this PDF.</p>
            ) : (
              <div className="fields-container">
                {formFields.map((field, i) => (
                  <div key={i} className="option-group">
                    <label>{field.name}</label>
                    {field.type === 'PDFCheckBox' ? (
                      <input
                        type="checkbox"
                        checked={!!formData[field.name]}
                        onChange={(e) => handleInputChange(field.name, e.target.checked)}
                        style={{width: '20px', height: '20px'}}
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={`Enter ${field.name}`}
                        className="input-field"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              className="btn-neon"
              onClick={fillForm}
              disabled={isProcessing || formFields.length === 0}
              style={{ width: "100%", marginTop: "20px" }}
            >
              {isProcessing ? "Generating..." : "Fill & Generate PDF"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => setFile(null)}
              style={{ width: "100%", marginTop: "10px" }}
            >
              Cancel
            </button>
          </div>
        ) : null}

        {previewUrl && !downloadResult && (
          <div className="preview-section">
            <div className="preview-header">
              <Eye size={20} style={{ color: "var(--accent-color)" }} />
              <h3>Preview Filled Form</h3>
            </div>
            <div className="pdf-viewer-container">
              <iframe src={previewUrl} className="pdf-viewer" title="Preview" />
            </div>
            <div className="preview-actions">
              <button
                className="btn-neon"
                onClick={async () => {
                  const result = await downloadPdf(
                    pdfBytes,
                    getTimestampedFilename("filled-form")
                  );
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
                }}
                style={{ flex: 1 }}
              >
                <RefreshCw size={18} /> Modify
              </button>
            </div>
          </div>
        )}

        {downloadResult && (
          <div className="result-section">
            <h3 className="success-title">Form Filled!</h3>
            <p className="success-subtitle">Your PDF has been generated.</p>
            <div className="download-action-area">
              {downloadResult.isBrowser ? (
                <a
                  className="btn-download-primary"
                  href={downloadResult.uri}
                  download={downloadResult.filename}
                >
                  <Download size={18} /> Download
                </a>
              ) : (
                <p>✅ PDF saved to your device!</p>
              )}
            </div>
            <button
              className="btn-secondary"
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setPdfBytes(null);
                setDownloadResult(null);
              }}
            >
              Fill Another Form
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
        .options-panel { background: var(--surface-color); padding: 24px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); }
        .file-info-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        .file-info-header h3 { margin: 0; font-size: 1.1rem; color: #fff; word-break: break-all; }
        .fields-container { max-height: 400px; overflow-y: auto; padding-right: 10px; }
        .option-group { margin-bottom: 20px; }
        .option-group label { display: block; margin-bottom: 8px; color: #aaa; font-size: 0.9rem; }
        .input-field { width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #fff; font-size: 1rem; }
        .input-field:focus { outline: none; border-color: var(--primary-color); }
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
        .btn-secondary { background: transparent; border: 1px solid #444; color: #888; padding: 10px 24px; border-radius: 6px; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default PdfFormFiller;
