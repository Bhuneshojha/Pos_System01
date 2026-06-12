import React, { useState } from "react";
import { FaUserShield, FaLock, FaEye, FaEyeSlash, FaSignInAlt, FaCircleNotch, FaTshirt, FaShieldAlt, FaUserPlus, FaUser, FaKey, FaArrowLeft } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css";
import { API_BASE_URL } from "../config";

function Login({ onLoginSuccess }) {
  // Screen states: 'login', 'signup', ya 'forgot'
  const [authMode, setAuthMode] = useState("login");
  
  // Form fields states
  const [fullName, setFullName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("manager");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authRequest = async (path, payload) => {
    const response = await fetch(`${API_BASE_URL}/auth/${path}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Authentication failed");
    }

    return data;
  };

  // Master form submission handling matrix
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    
    if (authMode === "signup" && !fullName.trim()) {
      toast.warning("Please enter your operational name.");
      return;
    }
    if (!email.trim()) {
      toast.warning("Please fill out your business email.");
      return;
    }
    if (!storeSlug.trim()) {
      toast.warning("Please enter your store code or slug.");
      return;
    }
    if (authMode === "signup" && !selectedRole) {
      toast.warning("Please choose the role for this account.");
      return;
    }

    try {
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 1200)); // Network simulation latency

      if (authMode === "login") {
        const loginResult = await authRequest("login", { email, password, store_slug: storeSlug.trim().toLowerCase() });
        toast.success("🚀 Workspace authorized. Welcome back.");
        if (onLoginSuccess) onLoginSuccess(loginResult.user.role, loginResult.token, loginResult.user.store_id, loginResult.user.store_slug);
      } else if (authMode === "signup") {
        const registerResult = await authRequest("register", {
          fullName,
          email,
          password,
          role: selectedRole,
          store_slug: storeSlug.trim().toLowerCase(),
          store_name: storeSlug.trim(),
        });
        toast.success("🎯 New account created and authenticated successfully.");
        if (onLoginSuccess) onLoginSuccess(registerResult.user.role, registerResult.token, registerResult.user.store_id, registerResult.user.store_slug);
      } else if (authMode === "forgot") {
        // For now this is a frontend reminder flow, no backend reset implemented yet.
        toast.info("📧 Password recovery is not configured yet. Please ask your administrator.");
        setAuthMode("login");
      }
    } catch (err) {
      toast.error(err?.message || "Authentication terminal timeout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-shell container-fluid min-vh-100 p-0 overflow-hidden">
      <ToastContainer position="top-right" autoClose={2500} theme="dark" />

      <div className="row g-0 min-vh-100">
        
        {/* 🎨 LEFT SIDE: BRAND VISUAL PANEL */}
        <div className="col-lg-6 login-brand-panel d-flex flex-column justify-content-between">
          <div className="radial-glow" />

          {/* Top Branding Row */}
          <div className="d-flex align-items-center justify-content-between w-100" style={{ zIndex: 10 }}>
            <div className="brand-logo-glass-plate">
              <img src="/LOGO.png" alt="Arbex Retail" className="img-fluid master-brand-logo" />
            </div>
            <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-terminal-status">
              <span className="secure-shield-icon"><FaShieldAlt size={10} /></span>
              <span className="text-white fw-bold uppercase tracking-wider" style={{ fontSize: "10px" }}>SECURE GATEWAY</span>
            </div>
          </div>

          {/* Center Suite Intro */}
          <div className="my-auto w-100 main-hero-suite" style={{ zIndex: 10, maxWidth: "500px" }}>
            <h1 className="text-white fw-black display-5 mb-3 tracking-tight">
              Arbex Retail Suite
            </h1>
            <p className="text-white-50 mb-4 lh-base" style={{ fontSize: "15px" }}>
              Enterprise management terminal built for modern clothing outlets, multi-branch operations, and rapid checkout systems.
            </p>
            
            {/* Context Terminal Box */}
            <div className="terminal-lock-visual-card shadow-2xl p-4 text-center">
              <div className="visual-graphic-node-wrapper my-3 position-relative d-flex align-items-center justify-content-center mx-auto">
                <div className="outer-pulse-ring" />
                <div className="inner-graphic-core d-flex align-items-center justify-content-center">
                  <FaTshirt size={40} className="text-success dynamic-apparel-icon" />
                </div>
              </div>

              <h4 className="text-white fw-bold mb-1 mt-3" style={{ fontSize: "18px", letterSpacing: "-0.5px" }}>
                {authMode === "login" && "Terminal Awaiting Authentication"}
                {authMode === "signup" && "Registering New Node Instance"}
                {authMode === "forgot" && "Passkey Override Protocol"}
              </h4>
              <p className="text-light-muted small mb-0 px-3">
                {authMode === "login" && "All business core modules, real-time sales streams, and apparel matrices are encrypted. Please sign in via the operational control center."}
                {authMode === "signup" && "Setup a secure store operator profile to provision this physical workstation into the main Arbex retail cluster."}
                {authMode === "forgot" && "Initiate credentials fallback sequence to recover operational control access. Multi-factor verification will deploy automatically."}
              </p>
            </div>
          </div>

          {/* Footer Context */}
          <div className="text-light-muted small mt-4 mt-lg-0" style={{ zIndex: 10, letterSpacing: "0.3px" }}>
            © 2026 Arbex Retail Systems. Workspace Console Platform.
          </div>
        </div>


        {/* 🔓 RIGHT SIDE: FLEXIBLE AUTH PORTAL */}
        <div className="col-lg-6 login-auth-panel d-flex flex-column justify-content-center align-items-center">
          
          <div className="login-card">
            
            {/* Back Button for recovery screen */}
            {authMode === "forgot" && (
              <button 
                type="button" 
                className="btn d-inline-flex align-items-center gap-2 p-0 text-secondary mb-4 border-0 bg-transparent fw-bold small back-navigation-link"
                onClick={() => setAuthMode("login")}
                disabled={isSubmitting}
              >
                <FaArrowLeft size={12} /> Return to entry deck
              </button>
            )}

            <div className="mb-5 text-center text-lg-start">
              <h2 className="fw-black text-dark mb-1 tracking-tight" style={{ fontSize: "32px", letterSpacing: "-1px" }}>
                {authMode === "login" && "System Login"}
                {authMode === "signup" && "Create Account"}
                {authMode === "forgot" && "Recover Passkey"}
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: "14.5px" }}>
                {authMode === "login" && "Provide store operator credentials to gain access."}
                {authMode === "signup" && "Register a new operator identity for this terminal."}
                {authMode === "forgot" && "Provide authorization email to issue security payload."}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="d-flex flex-column gap-4">
              
              {/* DYNAMIC FIELD: FULL NAME (Signup Only) */}
              {authMode === "signup" && (
                <>
                  <div className="animate-fade-in">
                    <label className="form-label small fw-bold mb-2 tracking-wider text-secondary" style={{ fontSize: "11px" }}>
                      OPERATOR FULL NAME
                    </label>
                    <div className="input-group rounded-3 standard-input-wrapper">
                      <span className="input-group-text bg-transparent border-0 px-3 text-muted">
                        <FaUser size={14} />
                      </span>
                      <input 
                        type="text" 
                        className="form-control bg-transparent border-0 text-dark fw-semibold shadow-none py-2.5 ps-0 interface-input-node"
                        placeholder="John Doe"
                        required
                        disabled={isSubmitting}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{ fontSize: "14.5px" }}
                      />
                    </div>
                  </div>

                  <div className="animate-fade-in">
                    <label className="form-label small fw-bold mb-2 tracking-wider text-secondary" style={{ fontSize: "11px" }}>
                      SELECT ACCOUNT ROLE
                    </label>
                    <div className="input-group rounded-3 standard-input-wrapper">
                      <span className="input-group-text bg-transparent border-0 px-3 text-muted">
                        <FaShieldAlt size={14} />
                      </span>
                      <select
                        className="form-select bg-transparent border-0 text-dark fw-semibold shadow-none py-2.5 ps-0 interface-input-node"
                        value={selectedRole}
                        disabled={isSubmitting}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        style={{ fontSize: "14.5px" }}
                      >
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                        <option value="cashier">Cashier</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* FIELD SEC: EMAIL (Teeno modes mein common hai) */}
              <div>
                <label className="form-label small fw-bold mb-2 tracking-wider text-secondary" style={{ fontSize: "11px" }}>
                  OPERATOR EMAIL ADDRESS
                </label>
                <div className="input-group rounded-3 standard-input-wrapper">
                  <span className="input-group-text bg-transparent border-0 px-3 text-muted">
                    <FaUserShield size={15} />
                  </span>
                  <input 
                    type="email" 
                    className="form-control bg-transparent border-0 text-dark fw-semibold shadow-none py-2.5 ps-0 interface-input-node"
                    placeholder="admin@arbex.com"
                    required
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ fontSize: "14.5px" }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label small fw-bold mb-2 tracking-wider text-secondary" style={{ fontSize: "11px" }}>
                  STORE CODE / SLUG
                </label>
                <div className="input-group rounded-3 standard-input-wrapper">
                  <span className="input-group-text bg-transparent border-0 px-3 text-muted">
                    <FaTshirt size={15} />
                  </span>
                  <input 
                    type="text" 
                    className="form-control bg-transparent border-0 text-dark fw-semibold shadow-none py-2.5 ps-0 interface-input-node"
                    placeholder="example-store"
                    required
                    disabled={isSubmitting}
                    value={storeSlug}
                    onChange={(e) => setStoreSlug(e.target.value)}
                    style={{ fontSize: "14.5px" }}
                  />
                </div>
              </div>

              {/* FIELD SEC: PASSKEY (Sirf Login aur Signup mein dikhega) */}
              {authMode !== "forgot" && (
                <div className="animate-fade-in">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label small fw-bold mb-0 tracking-wider text-secondary" style={{ fontSize: "11px" }}>
                      TERMINAL SECURITY PASSKEY
                    </label>
                    {authMode === "login" && (
                      <button 
                        type="button" 
                        className="btn btn-link p-0 bg-transparent border-0 small text-decoration-none fw-bold forgot-link" 
                        style={{ color: "#00E676", fontSize: "12.5px" }}
                        onClick={() => {
                          setAuthMode("forgot");
                          setShowPassword(false);
                        }}
                      >
                        Reset Passkey?
                      </button>
                    )}
                  </div>
                  <div className="input-group rounded-3 standard-input-wrapper">
                    <span className="input-group-text bg-transparent border-0 px-3 text-muted">
                      <FaLock size={14} />
                    </span>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="form-control bg-transparent border-0 text-dark fw-semibold shadow-none py-2.5 ps-0 interface-input-node"
                      placeholder="••••••••••••"
                      required
                      disabled={isSubmitting}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ fontSize: "14.5px", letterSpacing: showPassword ? "0px" : "3.5px" }}
                    />
                    <button 
                      type="button" 
                      className="btn bg-transparent border-0 px-3 text-muted shadow-none h-100"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                    >
                      {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {/* CHECKBOX LAYOUT TRACK (Sirf login state mein relevant hai) */}
              {authMode === "login" && (
                <div className="d-flex align-items-center form-check py-1">
                  <input 
                    type="checkbox" 
                    className="form-check-input terminal-checkbox-node shadow-none" 
                    id="keepSessionActive" 
                    style={{ cursor: "pointer", width: "17px", height: "17px" }}
                  />
                  <label className="form-check-label text-dark small user-select-none ps-2 fw-medium" htmlFor="keepSessionActive" style={{ cursor: "pointer", fontSize: "13.5px" }}>
                    Remember current physical POS workspace
                  </label>
                </div>
              )}

              {/* MAIN METRIC CALL TO ACTION BUTTON */}
              <button 
                type="submit" 
                className="btn w-100 py-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2 border-0 mt-2 primary-terminal-btn" 
                style={{ backgroundColor: "#060911", color: "#ffffff", fontSize: "15px", fontWeight: "700" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FaCircleNotch className="spinner-border spinner-border-sm border-0 animate-spin" style={{ animation: "spin 0.75s linear infinite" }} />
                    <span>Processing Encryption...</span>
                  </>
                ) : authMode === "login" ? (
                  <>
                    <span>Initialize POS Environment</span>
                    <FaSignInAlt size={14} />
                  </>
                ) : authMode === "signup" ? (
                  <>
                    <span>Request Credentials Access</span>
                    <FaUserPlus size={14} />
                  </>
                ) : (
                  <>
                    <span>Transmit Reset Key</span>
                    <FaKey size={13} />
                  </>
                )}
              </button>
            </form>

            {/* 🔄 BOTTOM ALTERNATE ACTIONS ENGINE */}
            {authMode !== "forgot" && (
              <div className="text-center mt-4 animate-fade-in">
                <p className="text-muted small">
                  {authMode === "login" ? "New operative assignment? " : "Already registered your terminal node? "}
                  <button
                    type="button"
                    className="btn btn-link p-0 bg-transparent border-0 fw-bold tracking-tight toggle-mode-btn"
                    style={{ color: "#00E676", textDecoration: "none", fontSize: "14px" }}
                    onClick={() => {
                      setAuthMode(authMode === "login" ? "signup" : "login");
                      setShowPassword(false);
                    }}
                    disabled={isSubmitting}
                  >
                    {authMode === "login" ? "Create Node Account" : "Return to Login"}
                  </button>
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* MODULAR COMPONENT DESIGN CSS CLASSES */}
      <style>{`
        .radial-glow {
          position: absolute; width: 450px; height: 450px;
          background: radial-gradient(circle, rgba(0, 230, 118, 0.08) 0%, rgba(0,0,0,0) 75%);
          top: -5%; left: -5%; filter: blur(60px); z-index: 1;
        }
        .brand-logo-glass-plate { padding: 8px 0px; display: flex; align-items: center; justify-content: center; }
        .master-brand-logo {
          height: 48px; width: auto; object-fit: contain;
          filter: brightness(0) invert(1) drop-shadow(0 0 12px rgba(0, 230, 118, 0.35));
        }
        .bg-terminal-status { background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); }
        .secure-shield-icon { color: #00E676; display: flex; align-items: center; }
        .text-light-muted { color: #cbd5e1 !important; opacity: 0.85; font-size: 13px; line-height: 1.5; }
        
        .terminal-lock-visual-card {
          border-radius: 20px; background: rgba(10, 16, 28, 0.6); border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        }
        .visual-graphic-node-wrapper { width: 100px; height: 100px; }
        .inner-graphic-core {
          width: 76px; height: 76px; background: rgba(4, 6, 11, 0.8);
          border: 1px solid rgba(0, 230, 118, 0.25); border-radius: 50%; z-index: 5;
        }
        .dynamic-apparel-icon { filter: drop-shadow(0 0 10px rgba(0, 230, 118, 0.5)); }
        .outer-pulse-ring {
          position: absolute; inset: 0; border: 2px solid rgba(0, 230, 118, 0.15);
          border-radius: 50%; animation: visualRingPulse 2.5s infinite linear; z-index: 1;
        }
        
        .standard-input-wrapper { border: 1px solid #d1d5db; background-color: #f9fafb; transition: all 0.2s ease; }
        .standard-input-wrapper:focus-within {
          border-color: #00E676 !important; box-shadow: 0 0 0 4px rgba(0, 230, 118, 0.12) !important; background-color: #ffffff;
        }
        .terminal-checkbox-node { border: 1.5px solid #9ca3af !important; }
        .terminal-checkbox-node:checked { background-color: #00E676 !important; border-color: #00E676 !important; }
        
        .primary-terminal-btn { transition: all 0.2s ease-in-out; }
        .primary-terminal-btn:hover:not(:disabled) {
          background-color: #00E676 !important; color: #060911 !important;
          box-shadow: 0 12px 30px rgba(0, 230, 118, 0.2) !important; transform: translateY(-1px);
        }
        
        .toggle-mode-btn:hover, .forgot-link:hover { color: #059669 !important; text-decoration: underline !important; }
        .back-navigation-link { transition: color 0.2s ease; }
        .back-navigation-link:hover { color: #0f172a !important; }
        
        .animate-fade-in { animation: formFade 0.35s ease-out forwards; }

        @keyframes formFade {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes visualRingPulse {
          0% { transform: scale(0.8); opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        @media (max-width: 991.98px) {
          .context-panel { min-height: auto !important; padding: 2rem 1.5rem !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .main-hero-suite { margin: 2rem 0 !important; text-align: center !important; }
          .terminal-lock-visual-card { max-width: 440px; margin: 0 auto; }
          .form-viewport { padding-top: 2.5rem !important; padding-bottom: 2.5rem !important; }
        }
      `}</style>
    </div>
  );
}

export default Login;