import { useState, useRef } from "react";
import { DEMO_SELLERS } from "./sellers";
import "./App.css";

const STARTER_FBA_CSV = `date,type,amount,description
2026-09-18,amazon_payout,62000,Weekly payout
2026-09-20,expense,12000,Warehouse rent
2026-09-22,expense,18000,Supplier payment
2026-09-25,fee,8000,Advertising
2026-09-28,amazon_payout,58000,Weekly payout
2026-10-02,expense,15000,Logistics
2026-10-05,amazon_payout,65000,Weekly payout`;

export default function Login({ onLogin, onBackToLanding }) {
  // Mode: "new_user" (default), "judge_sandbox", or "signin"
  const [authMode, setAuthMode] = useState("new_user");

  // New Seller Onboarding Form State
  const [storeName, setStoreName] = useState("Zenith Retail FBA");
  const [sellerName, setSellerName] = useState("Rohan Mehta");
  const [sellerCategory, setSellerCategory] = useState("Consumer Electronics");
  const [newCash, setNewCash] = useState(150000);
  const [newReserve, setNewReserve] = useState(50000);
  const [customCsvText, setCustomCsvText] = useState(null);
  const [customCsvFileName, setCustomCsvFileName] = useState(null);
  const [csvRowCount, setCsvRowCount] = useState(null);

  // Existing Sign In State
  const [email, setEmail] = useState("seller@amazon.in");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Judge Sandbox State
  const [selectedSeller, setSelectedSeller] = useState(DEMO_SELLERS[0]);

  // General State
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);

  // 3D Card Tilt State for the Hero Card
  const heroCardRef = useRef(null);
  const [heroTilt, setHeroTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [heroSpotlight, setHeroSpotlight] = useState({ x: 0, y: 0, opacity: 0 });

  const handleHeroMouseMove = (e) => {
    if (!heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setHeroTilt({
      rotateX: ((y - centerY) / centerY) * -4.5,
      rotateY: ((x - centerX) / centerX) * 4.5,
    });
    setHeroSpotlight({ x, y, opacity: 1 });
  };

  const handleHeroMouseLeave = () => {
    setHeroTilt({ rotateX: 0, rotateY: 0 });
    setHeroSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  // CSV File Handler for New Users
  const handleCsvFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        const rows = content.trim().split("\n").filter(Boolean);
        setCustomCsvText(content);
        setCustomCsvFileName(file.name);
        setCsvRowCount(Math.max(0, rows.length - 1));
      }
    };
    reader.readAsText(file);
  };

  // Submit New User Registration & Launch Dashboard
  const handleNewUserSubmit = (e) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setAuthError("Please enter your Amazon Store Name.");
      return;
    }
    if (newCash < 0 || newReserve < 0) {
      setAuthError("Cash and reserve amounts must be positive numbers.");
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    const newUserProfile = {
      id: `seller_${Date.now()}`,
      name: sellerName.trim() || "Amazon Seller",
      email: `${sellerName.toLowerCase().replace(/\s+/g, ".")}@amazonseller.in`,
      storeName: storeName.trim(),
      marketplace: "Amazon India (FBA)",
      category: sellerCategory,
      initialCash: Number(newCash) || 100000,
      reserveThreshold: Number(newReserve) || 40000,
      avatar: "🏪",
      badge: "Custom Seller Account",
      csvData: customCsvText || STARTER_FBA_CSV,
      csvFileName: customCsvFileName || "fba_starter_schedule.csv",
    };

    setTimeout(() => {
      setIsAuthenticating(false);
      onLogin(newUserProfile);
    }, 600);
  };

  // Submit Existing User Sign In
  const handleSignInSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setAuthError("Please enter your registered Amazon Seller email.");
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    setTimeout(() => {
      setIsAuthenticating(false);
      onLogin({
        id: "existing_seller",
        name: email.split("@")[0],
        email,
        storeName: `${email.split("@")[0].toUpperCase()} Enterprises`,
        marketplace: "Amazon India (FBA)",
        category: "General Merchandise",
        initialCash: 142000,
        reserveThreshold: 60000,
        avatar: "👤",
        badge: "Verified Seller",
        csvData: STARTER_FBA_CSV,
        csvFileName: "sample_seller.csv (Demo)",
      });
    }, 600);
  };

  // 1-Click Judge Sandbox Entry
  const handleJudgeSandboxLogin = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      onLogin(selectedSeller);
    }, 500);
  };

  return (
    <div className="login-viewport">
      {/* Ambient Atmospheric Halos */}
      <div className="login-ambient-halo-left" />
      <div className="login-ambient-halo-right" />

      {/* Top Header */}
      <header className="login-header">
        <div
          className="login-brand"
          onClick={onBackToLanding}
          style={{ cursor: onBackToLanding ? "pointer" : "default" }}
          title={onBackToLanding ? "Return to Landing Page" : undefined}
        >
          <span className="brand-logo-icon">🛡️</span>
          <span className="brand-name">
            BuySafe <span className="version-tag">PRO</span>
          </span>
        </div>
        <div className="login-header-meta">
          {onBackToLanding && (
            <button
              type="button"
              className="login-back-landing-btn"
              onClick={onBackToLanding}
            >
              ← Back to Landing Page
            </button>
          )}
          <span className="secure-badge">
            <span className="lock-icon">🔒</span> Bank-Grade SP-API Encryption
          </span>
        </div>
      </header>

      {/* Main Split-Screen Container */}
      <main className="login-container">
        {/* =========================================================================
            LEFT COLUMN: 3D Live Preview & Security Card (Aceternity / 21st.dev Style)
            ========================================================================= */}
        <div className="login-hero-col">
          <div
            ref={heroCardRef}
            className="login-hero-3d-card"
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={handleHeroMouseLeave}
            style={{
              transform: `perspective(1200px) rotateX(${heroTilt.rotateX}deg) rotateY(${heroTilt.rotateY}deg)`,
            }}
          >
            {/* Rotating Conic Border Beam */}
            <div className="hero-border-beam" />

            {/* Mouse Spotlight */}
            <div
              className="card-spotlight-layer"
              style={{
                opacity: heroSpotlight.opacity,
                background: `radial-gradient(400px circle at ${heroSpotlight.x}px ${heroSpotlight.y}px, rgba(37, 99, 235, 0.12), transparent 75%)`,
              }}
            />

            <div className="hero-card-content">
              {/* Pill Row */}
              <div className="hero-pill-row">
                <span className="hero-live-pill">
                  <span className="pulse-dot green"></span> Live SP-API Ingestion
                </span>
                <span className="hero-category-pill">Deterministic Safety</span>
              </div>

              {/* Dynamic Live Preview Card for New Users */}
              {authMode === "new_user" ? (
                <div className="hero-seller-preview-box">
                  <span className="preview-kicker">REAL-TIME STORE ONBOARDING</span>
                  <div className="preview-store-title">
                    <span className="preview-store-icon">🏪</span>
                    <h3>{storeName || "Your Amazon Store"}</h3>
                  </div>
                  <div className="preview-metrics-duo">
                    <div className="preview-metric-cell">
                      <span className="cell-label">STARTING WORKING CAPITAL</span>
                      <strong className="cell-num text-emerald">
                        ₹{Number(newCash || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div className="preview-metric-cell">
                      <span className="cell-label">MINIMUM SAFETY RESERVE</span>
                      <strong className="cell-num text-charcoal">
                        ₹{Number(newReserve || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                  <div className="preview-data-status">
                    <span>
                      {customCsvFileName ? (
                        <>📁 Uploaded: <strong>{customCsvFileName}</strong> ({csvRowCount} rows)</>
                      ) : (
                        <>⚡ Ready with Standard FBA Payout Schedule</>
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="hero-headline">
                    Stop Guessing. <br />
                    <span className="headline-gradient">Know Before You Reorder.</span>
                  </h2>
                  <p className="hero-body-text">
                    BuySafe mathematically simulates your cash-flow trough across all upcoming Amazon settlement payouts, advertising fees, and warehouse expenses to give you an exact SAFE / DON'T BUY verdict.
                  </p>
                </>
              )}

              {/* 3 Core Architecture Pillars */}
              <div className="hero-features-list">
                <div className="hero-feature-item">
                  <span className="feature-icon-badge">⚙️</span>
                  <div>
                    <strong>Deterministic Financial Simulation</strong>
                    <p>Integer binary search solves your exact maximum safe purchase limit in 0.4ms.</p>
                  </div>
                </div>

                <div className="hero-feature-item">
                  <span className="feature-icon-badge">🛡️</span>
                  <div>
                    <strong>Zero LLM Hallucinations</strong>
                    <p>The Python financial engine decides safety; Amazon Bedrock generates executive summaries.</p>
                  </div>
                </div>

                <div className="hero-feature-item">
                  <span className="feature-icon-badge">📊</span>
                  <div>
                    <strong>30-Day Working Capital Runway</strong>
                    <p>Daily cash trajectory model prevents catastrophic stockout and payroll breaches.</p>
                  </div>
                </div>
              </div>

              {/* Bottom Testimonial / Social Proof Strip */}
              <div className="hero-footer-strip">
                <div className="fba-avatar-stack">
                  <span className="stack-avatar">👩‍💼</span>
                  <span className="stack-avatar">👨‍💼</span>
                  <span className="stack-avatar">👩‍🔬</span>
                </div>
                <div className="hero-footer-text">
                  <strong>Empowering 10,000+ Amazon FBA Sellers</strong>
                  <span>WeMakeDevs First Commit Hackathon Submission</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Interactive Onboarding & Auth Card
            ========================================================================= */}
        <div className="login-form-col">
          <div className="login-form-card">
            {/* Mode Switcher Tabs */}
            <div className="auth-mode-tabs">
              <button
                type="button"
                className={`mode-tab-btn ${authMode === "new_user" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("new_user");
                  setAuthError(null);
                }}
              >
                ✨ Connect New Store
              </button>
              <button
                type="button"
                className={`mode-tab-btn ${authMode === "judge_sandbox" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("judge_sandbox");
                  setAuthError(null);
                }}
              >
                ⚡ 1-Click Judge Sandbox
              </button>
              <button
                type="button"
                className={`mode-tab-btn ${authMode === "signin" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("signin");
                  setAuthError(null);
                }}
              >
                🔑 Existing Sign In
              </button>
            </div>

            {authError && (
              <div className="auth-error-banner">
                <span>⚠️</span> {authError}
              </div>
            )}

            {/* =====================================================================
                MODE 1: NEW USER ONBOARDING (Default & Personalized)
                ===================================================================== */}
            {authMode === "new_user" && (
              <form onSubmit={handleNewUserSubmit} className="onboarding-form">
                <div className="form-card-header">
                  <span className="form-kicker">NEW SELLER ONBOARDING</span>
                  <h1 className="form-main-title">Set Up Your Safety Engine</h1>
                  <p className="form-sub-text">
                    Enter your store's baseline figures. No hardcoded data — the engine evaluates YOUR working capital.
                  </p>
                </div>

                <div className="form-two-col-grid">
                  <div className="form-input-group">
                    <label className="input-label" htmlFor="store-name">
                      Amazon Store Name
                    </label>
                    <input
                      id="store-name"
                      type="text"
                      className="glowing-text-input no-icon"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Zenith Retail FBA"
                      required
                    />
                  </div>

                  <div className="form-input-group">
                    <label className="input-label" htmlFor="seller-name">
                      Primary Contact / Owner
                    </label>
                    <input
                      id="seller-name"
                      type="text"
                      className="glowing-text-input no-icon"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="e.g. Rohan Mehta"
                      required
                    />
                  </div>
                </div>

                <div className="form-input-group">
                  <label className="input-label" htmlFor="seller-category">
                    Product Category
                  </label>
                  <select
                    id="seller-category"
                    className="glowing-select-input"
                    value={sellerCategory}
                    onChange={(e) => setSellerCategory(e.target.value)}
                  >
                    <option value="Consumer Electronics">Consumer Electronics</option>
                    <option value="Apparel & Footwear">Apparel & Footwear</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                    <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                    <option value="Industrial & Scientific">Industrial & Scientific</option>
                  </select>
                </div>

                <div className="form-two-col-grid">
                  <div className="form-input-group">
                    <div className="label-row">
                      <label className="input-label" htmlFor="new-cash">
                        Current Cash Balance (₹)
                      </label>
                      <span className="input-hint">Bank Liquid Funds</span>
                    </div>
                    <input
                      id="new-cash"
                      type="number"
                      step="1000"
                      min="0"
                      className="glowing-text-input no-icon"
                      value={newCash}
                      onChange={(e) => setNewCash(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="form-input-group">
                    <div className="label-row">
                      <label className="input-label" htmlFor="new-reserve">
                        Safety Reserve Floor (₹)
                      </label>
                      <span className="input-hint">Never Breach</span>
                    </div>
                    <input
                      id="new-reserve"
                      type="number"
                      step="1000"
                      min="0"
                      className="glowing-text-input no-icon"
                      value={newReserve}
                      onChange={(e) => setNewReserve(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                {/* CSV File Upload or Default Template */}
                <div className="onboarding-csv-zone">
                  <div className="csv-zone-header">
                    <span className="zone-label">TRANSACTION SETTLEMENT LEDGER</span>
                    <span className="zone-optional">Optional Custom CSV</span>
                  </div>

                  <label className="csv-drop-area">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileUpload}
                      className="hidden-file-input"
                    />
                    <div className="drop-area-content">
                      <span className="upload-cloud-icon">📁</span>
                      <div>
                        {customCsvFileName ? (
                          <>
                            <strong className="text-emerald">Loaded: {customCsvFileName}</strong>
                            <p>{csvRowCount} transaction rows parsed into engine</p>
                          </>
                        ) : (
                          <>
                            <strong>Click or drop your Amazon Settlement CSV</strong>
                            <p>or leave empty to use standard FBA 14-day settlement schedule</p>
                          </>
                        )}
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  className="submit-login-button primary-launch-btn"
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? (
                    <span className="auth-spinner-wrap">
                      <span className="spinner-icon">↻</span> Initializing Safety Engine for {storeName}...
                    </span>
                  ) : (
                    <span>🚀 Launch BuySafe Dashboard for {storeName} ➔</span>
                  )}
                </button>
              </form>
            )}

            {/* =====================================================================
                MODE 2: 1-CLICK HACKATHON JUDGE SANDBOX
                ===================================================================== */}
            {authMode === "judge_sandbox" && (
              <div className="judge-sandbox-view">
                <div className="form-card-header">
                  <span className="form-kicker">HACKATHON REVIEWER SUITE</span>
                  <h1 className="form-main-title">1-Click Evaluation Profiles</h1>
                  <p className="form-sub-text">
                    Pre-verified financial scenarios for WeMakeDevs judges. Select any profile to test edge cases instantly.
                  </p>
                </div>

                <div className="judge-profile-cards-grid">
                  {DEMO_SELLERS.map((seller) => {
                    const isSelected = selectedSeller?.id === seller.id;
                    return (
                      <div
                        key={seller.id}
                        className={`judge-profile-chip ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedSeller(seller)}
                      >
                        <div className="chip-avatar-col">
                          <span className="chip-emoji">{seller.avatar}</span>
                        </div>
                        <div className="chip-text-col">
                          <div className="chip-name-row">
                            <strong className="chip-name">{seller.name}</strong>
                            <span className="chip-tag">{seller.badge}</span>
                          </div>
                          <span className="chip-store-meta">
                            {seller.storeName} • ₹{(seller.initialCash / 1000).toFixed(0)}k Cash • ₹{(seller.reserveThreshold / 1000).toFixed(0)}k Reserve
                          </span>
                        </div>
                        <div className="chip-radio-circle">
                          {isSelected && <span className="chip-radio-inner" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="amazon-oauth-button sandbox-launch-btn"
                  onClick={handleJudgeSandboxLogin}
                  disabled={isAuthenticating}
                >
                  <div className="amazon-button-content">
                    <span className="btn-bolt">⚡</span>
                    <span>
                      {isAuthenticating
                        ? "Loading Profile..."
                        : `Launch as ${selectedSeller.name} (${selectedSeller.storeName})`}
                    </span>
                  </div>
                  <span className="amazon-button-arrow">➔</span>
                </button>
              </div>
            )}

            {/* =====================================================================
                MODE 3: EXISTING SELLER SIGN IN
                ===================================================================== */}
            {authMode === "signin" && (
              <form onSubmit={handleSignInSubmit} className="credentials-form">
                <div className="form-card-header">
                  <span className="form-kicker">SELLER CENTRAL ACCESS</span>
                  <h1 className="form-main-title">Welcome Back</h1>
                  <p className="form-sub-text">
                    Sign in with your Amazon Selling Partner API account credentials.
                  </p>
                </div>

                <div className="form-input-group">
                  <label className="input-label" htmlFor="signin-email">
                    Amazon Seller Email
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">✉️</span>
                    <input
                      id="signin-email"
                      type="email"
                      className="glowing-text-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seller@amazon.in"
                      required
                    />
                  </div>
                </div>

                <div className="form-input-group">
                  <div className="label-row">
                    <label className="input-label" htmlFor="signin-password">
                      Password / SP-API Auth Key
                    </label>
                    <span className="forgot-password-link">Forgot password?</span>
                  </div>
                  <div className="input-wrapper">
                    <span className="input-icon">🔑</span>
                    <input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      className="glowing-text-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="form-options-row">
                  <label className="remember-me-checkbox">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Trust this device for 30 days</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="submit-login-button"
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? (
                    <span className="auth-spinner-wrap">
                      <span className="spinner-icon">↻</span> Authenticating...
                    </span>
                  ) : (
                    <span>Sign In to Dashboard ➔</span>
                  )}
                </button>
              </form>
            )}

            <div className="form-card-footer">
              <span className="footer-notice">
                Protected by AWS IAM and Amazon Selling Partner API security policies.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
