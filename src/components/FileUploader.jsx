import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

const FileUploader = ({
  onFilesSelected,
  accept,
  multiple = false,
  label = "Drag & drop files here, or click to select",
}) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles?.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={`file-uploader ${isDragActive ? "active" : ""}`}
    >
      <input {...getInputProps()} />
      <UploadCloud size={48} className="upload-icon" />
      <p>{isDragActive ? "Drop the files here..." : label}</p>

      <style>{`
        .file-uploader {
          border: 2px dashed rgba(64, 224, 208, 0.3);
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }

        .file-uploader:hover, .file-uploader.active {
          border-color: var(--primary-color);
          background: rgba(64, 224, 208, 0.05);
          box-shadow: 0 0 15px rgba(64, 224, 208, 0.2);
        }

        .upload-icon {
          color: var(--text-muted);
          margin-bottom: 16px;
          transition: color 0.3s ease;
        }

        .file-uploader:hover .upload-icon, .file-uploader.active .upload-icon {
          color: var(--primary-color);
        }

        .file-uploader p {
          color: var(--text-muted);
          margin: 0;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

export default FileUploader;
