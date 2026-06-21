import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "./layout.css";

function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((s) => !s);

  return (
    <div className={`app-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-area">
        <Navbar onToggleSidebar={toggleSidebar} />

        <div className="content-area">
          <Outlet />
        </div>

      </div>

    </div>
  );
}

export default Layout;