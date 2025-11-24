import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PdfToolPlaceholder = ({ title, description, icon: Icon }) => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <button className="back-btn" onClick={() => navigate("/pdf-editor")}>
        <ArrowLeft size={18} /> Back
      </button>

      <header style={{ marginBottom: "30px", textAlign: "center" }}>
        <h2 className="neon-text">{title}</h2>
        <p style={{ color: "#888" }}>{description}</p>
      </header>

      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        {Icon && (
          <div
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 20px",
              background: "rgba(64, 224, 208, 0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={40} color="var(--primary-color)" />
          </div>
        )}
        <p style={{ color: "#666", fontSize: "1.1rem" }}>
          This feature is coming soon!
        </p>
      </div>

      <style>{`
        .back-btn {
          background: transparent;
          border: 1px solid #333;
          color: var(--primary-color);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(64, 224, 208, 0.1);
          border-color: var(--primary-color);
        }
      `}</style>
    </div>
  );
};

export default PdfToolPlaceholder;
