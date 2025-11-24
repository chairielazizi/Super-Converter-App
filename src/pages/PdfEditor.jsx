import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Minimize2,
  Layers,
  Split,
  RotateCw,
  Trash2,
  FileOutput,
  FolderOpen,
  PenTool,
  Eye,
  Hash,
  Crop,
  EyeOff,
  Droplet,
  FolderEdit,
  Share2,
  FileType,
  Edit3,
  Lock,
  Unlock,
  Shield,
  FileDown,
  Camera,
} from "lucide-react";

const PdfToolCard = ({
  title,
  icon: Icon,
  onClick,
  color = "var(--primary-color)",
}) => (
  <div className="pdf-tool-card" onClick={onClick}>
    <div
      className="icon-box"
      style={{ background: `${color}15`, border: `1px solid ${color}30` }}
    >
      <Icon size={24} color={color} />
    </div>
    <span className="tool-name">{title}</span>
    <style>{`
      .pdf-tool-card {
        background: var(--surface-color);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .pdf-tool-card:hover {
        transform: translateY(-4px);
        background: var(--surface-color-hover);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
      }

      .pdf-tool-card .icon-box {
        width: 50px;
        height: 50px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pdf-tool-card .tool-name {
        color: #fff;
        font-size: 0.85rem;
        text-align: center;
        font-weight: 500;
      }
    `}</style>
  </div>
);

const PdfEditor = () => {
  const navigate = useNavigate();

  const tools = [
    // Compress
    {
      title: "Compress PDF",
      icon: Minimize2,
      path: "/pdf-editor/compress",
      color: "#FF4081",
    },

    // Organize
    {
      title: "Merge PDF",
      icon: Layers,
      path: "/pdf-editor/merge",
      color: "#9C27B0",
    },
    {
      title: "Split PDF",
      icon: Split,
      path: "/pdf-editor/split",
      color: "#9C27B0",
    },
    {
      title: "Rotate PDF",
      icon: RotateCw,
      path: "/pdf-editor/rotate",
      color: "#9C27B0",
    },
    {
      title: "Delete Pages",
      icon: Trash2,
      path: "/pdf-editor/delete-pages",
      color: "#9C27B0",
    },
    {
      title: "Extract Pages",
      icon: FileOutput,
      path: "/pdf-editor/extract",
      color: "#9C27B0",
    },
    {
      title: "Organize PDF",
      icon: FolderOpen,
      path: "/pdf-editor/organize",
      color: "#9C27B0",
    },

    // View & Edit
    {
      title: "Edit PDF",
      icon: Edit3,
      path: "/pdf-editor/edit",
      color: "#00BCD4",
    },
    {
      title: "PDF Annotator",
      icon: PenTool,
      path: "/pdf-editor/annotate",
      color: "#00BCD4",
    },
    {
      title: "PDF Reader",
      icon: Eye,
      path: "/pdf-editor/reader",
      color: "#00BCD4",
    },
    {
      title: "Number Pages",
      icon: Hash,
      path: "/pdf-editor/number-pages",
      color: "#00BCD4",
    },
    {
      title: "Crop PDF",
      icon: Crop,
      path: "/pdf-editor/crop",
      color: "#00BCD4",
    },
    {
      title: "Redact PDF",
      icon: EyeOff,
      path: "/pdf-editor/redact",
      color: "#00BCD4",
    },
    {
      title: "Watermark PDF",
      icon: Droplet,
      path: "/pdf-editor/watermark",
      color: "#00BCD4",
    },
    {
      title: "PDF Form Filler",
      icon: FolderEdit,
      path: "/pdf-editor/form-filler",
      color: "#00BCD4",
    },
    {
      title: "Share PDF",
      icon: Share2,
      path: "/pdf-editor/share",
      color: "#00BCD4",
    },

    // Convert
    {
      title: "PDF Converter",
      icon: FileType,
      path: "/pdf-editor/converter",
      color: "#FF9800",
    },

    // Sign
    {
      title: "Sign PDF",
      icon: Edit3,
      path: "/pdf-editor/sign",
      color: "#E91E63",
    },
    {
      title: "Unlock PDF",
      icon: Unlock,
      path: "/pdf-editor/unlock",
      color: "#E91E63",
    },
    {
      title: "Protect PDF",
      icon: Shield,
      path: "/pdf-editor/protect",
      color: "#E91E63",
    },
    {
      title: "Flatten PDF",
      icon: FileDown,
      path: "/pdf-editor/flatten",
      color: "#E91E63",
    },

    // Scan
    {
      title: "PDF Scanner",
      icon: Camera,
      path: "/pdf-editor/scanner",
      color: "#3F51B5",
    },
  ];

  return (
    <div className="page-container">
      <header style={{ marginBottom: "30px", textAlign: "center" }}>
        <h2 className="neon-text">PDF Tools</h2>
        <p style={{ color: "#888" }}>Choose a tool to get started</p>
      </header>

      <div className="pdf-tools-grid">
        {tools.map((tool, idx) => (
          <PdfToolCard
            key={idx}
            title={tool.title}
            icon={tool.icon}
            color={tool.color}
            onClick={() => navigate(tool.path)}
          />
        ))}
      </div>

      <style>{`
        .pdf-tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 16px;
          max-width: 1000px;
          margin: 0 auto;
        }

        @media (max-width: 640px) {
          .pdf-tools-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default PdfEditor;
