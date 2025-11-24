import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Home, FileText, RefreshCw, Download } from "lucide-react";

const Layout = () => {
  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <Home size={24} />
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/pdf-editor"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <FileText size={24} />
          <span>PDF</span>
        </NavLink>
        <NavLink
          to="/converter"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <RefreshCw size={24} />
          <span>Convert</span>
        </NavLink>
        <NavLink
          to="/video-downloader"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <Download size={24} />
          <span>Video</span>
        </NavLink>
      </nav>

      <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: rgba(30, 30, 30, 0.95);
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: space-around;
          align-items: center;
          border-top: 1px solid #333;
          z-index: 1000;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #888;
          text-decoration: none;
          font-size: 0.75rem;
          width: 100%;
          height: 100%;
          transition: color 0.3s ease;
        }

        .nav-item.active {
          color: var(--primary-color);
        }

        .nav-item span {
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default Layout;
