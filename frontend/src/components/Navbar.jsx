import React from "react";
import { FaSearch, FaUserCircle, FaBars } from "react-icons/fa";
import "./navbar.css";

function Navbar({ onToggleSidebar }) {
  return (
    <div className="navbar">
      <div className="left-actions">
        <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <FaBars />
        </button>
        <div className="search-box">
          <FaSearch />
          <input placeholder="Search products, customers..." />
        </div>
      </div>

      <div className="right">
        <div className="store-info">Main Store</div>
        <FaUserCircle className="user-icon" />
      </div>
    </div>
  );
}

export default Navbar;