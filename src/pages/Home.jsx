import React from "react";
import { Link } from "react-router-dom";
import { FileText, RefreshCw, Download, ArrowRight } from "lucide-react";

const ToolCard = ({ title, description, icon: Icon, to, color }) => (
  <Link to={to} className="tool-card">
    <div className="icon-wrapper" style={{ color: color }}>
      <Icon size={32} />
    </div>
    <div className="content">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
    <div className="arrow">
      <ArrowRight size={20} />
    </div>

    <style>{`
      .tool-card {
        display: flex;
        align-items: center;
        background: var(--surface-color);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
        text-decoration: none;
        color: white;
        transition: all 0.3s ease;
      }
      
      .tool-card:hover {
        transform: translateY(-2px);
        background: var(--surface-color-hover);
        border-color: var(--primary-color);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      }

      .icon-wrapper {
        background: rgba(255, 255, 255, 0.05);
        padding: 12px;
        border-radius: 10px;
        margin-right: 16px;
      }

      .content {
        flex: 1;
      }

      .content h3 {
        margin: 0 0 4px 0;
        font-size: 1.1rem;
      }

      .content p {
        margin: 0;
        font-size: 0.85rem;
        color: #aaa;
      }

      .arrow {
        color: #555;
        transition: color 0.3s ease;
      }

      .tool-card:hover .arrow {
        color: var(--primary-color);
      }
    `}</style>
  </Link>
);

const Home = () => {
  return (
    <div className="page-container">
      <header
        style={{
          marginBottom: "30px",
          textAlign: "center",
          paddingTop: "20px",
        }}
      >
        <h1
          className="neon-text"
          style={{ fontSize: "2.5rem", marginBottom: "10px" }}
        >
          Super Converter
        </h1>
        <p style={{ color: "#888" }}>All-in-one PDF & Media Tools</p>
      </header>

      <div className="tools-grid">
        <ToolCard
          title="PDF Editor"
          description="Merge, annotate, and edit PDF files."
          icon={FileText}
          to="/pdf-editor"
          color="#FF5252"
        />

        <ToolCard
          title="Doc Converter"
          description="Convert Docs, PPTX to PDF and more."
          icon={RefreshCw}
          to="/converter"
          color="#40E0D0"
        />

        <ToolCard
          title="Video Downloader"
          description="Download videos from supported sites."
          icon={Download}
          to="/video-downloader"
          color="#E040FB"
        />
      </div>
    </div>
  );
};

export default Home;
