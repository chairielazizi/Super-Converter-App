import React from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, RefreshCw, Youtube, ArrowLeft } from "lucide-react";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {!isHome && (
        <button
          onClick={() => navigate("/")}
          className="back-home-btn"
          aria-label="Go to Home"
        >
          <ArrowLeft size={24} />
        </button>
      )}

      <main style={{ flex: 1, paddingTop: !isHome ? "60px" : "0" }}>
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
          to="/video-converter"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <Youtube size={24} />
          <span>Video Converter</span>
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

        .back-home-btn {
          position: fixed;
          top: 15px;
          left: 15px;
          background: rgba(30, 30, 30, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1000;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .back-home-btn:hover {
          background: rgba(60, 60, 60, 0.9);
          border-color: var(--primary-color);
          color: var(--primary-color);
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default Layout;
