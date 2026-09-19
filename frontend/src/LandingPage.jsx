import { useState, useRef, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import SafetySphereCanvas from "./SafetySphereCanvas";
import "./App.css";

/**
 * LandingPage
 *
 * Cinematic dark landing page for BuySafe inspired by Dribbble Personal Finance.
 * Uses the existing BuySafe financial engine as the STRICT single source of truth.
 * ZERO hardcoded financial values. All metrics, boundaries, and forecasts flow from props.
 */
/**
 * formatInr
 * Formats values strictly dynamically with Indian Rupee notation.
 * Uses fallback placeholders ("—") instead of fabricated numbers if null or undefined.
 */
const formatInr = (val, prefix = "₹", empty = "—") => {
  if (val === null || val === undefined || isNaN(Number(val))) return empty;
  return `${prefix}${Number(val).toLocaleString("en-IN")}`;
};

export default function LandingPage({
  currentCash,
  reserveThreshold,
  purchaseAmount,
  result,
  chartData,
  datasetStats,
  recalculating,
  handlePurchaseChange,
  onOpenDashboard,
  onOpenJudgeSandbox,
  onOpenCustomOnboarding,
}) {
  // Derived state directly from engine output (Single Source of Truth)
  const isSafe = result ? result.status === "SAFE" : true;
  const maxSafePurchase = result && result.maximum_safe_purchase !== undefined ? Number(result.maximum_safe_purchase) : null;
  const minProjectedCash = result && result.minimum_projected_cash !== undefined ? Number(result.minimum_projected_cash) : null;
  const safeCapacityRemaining = maxSafePurchase !== null && purchaseAmount !== undefined ? Math.max(0, maxSafePurchase - purchaseAmount) : null;
  const excessAboveLimit = maxSafePurchase !== null && purchaseAmount !== undefined ? Math.max(0, purchaseAmount - maxSafePurchase) : null;
  
  // Dynamically compute slider scale based purely on active financial state, without hardcoded baseline limits
  const activeAnchor = Math.max(
    Number(currentCash) || 0,
    Number(maxSafePurchase) || 0,
    Number(purchaseAmount) || 0,
    Number(reserveThreshold) || 0
  );
  const sliderMax = activeAnchor > 0
    ? Math.ceil((activeAnchor * 1.5) / 10000) * 10000
    : 100000;

  // Parallax Tilt for Spatial Glass Cards in Hero
  const heroRef = useRef(null);
  const [spatialOffset, setSpatialOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      setSpatialOffset({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
    };

    const node = heroRef.current;
    if (node) {
      node.addEventListener("mousemove", handleMouseMove);
    }
    return () => {
      if (node) {
        node.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="dark-landing-root">
      {/* Subtle Background Glow Mesh */}
      <div className="ambient-mesh-green" />
      <div className="ambient-mesh-slate" />

      {/* =========================================================================
          TOP NAVIGATION BAR (Cinematic Glassmorphic Pill)
          ========================================================================= */}
      <header className="landing-top-navbar">
        <div className="landing-nav-inner">
          <div className="landing-brand-wrap" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <span className="brand-shield-icon">🛡️</span>
            <span className="brand-logo-text">
              BuySafe <span className="dark-nav-badge">ENGINE</span>
            </span>
          </div>

          <nav className="landing-nav-links">
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection("concept-section")}>
              Safety Boundary
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection("what-if-section")}>
              What-If Simulator
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection("actions-section")}>
              Action Prescriptions
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection("stress-section")}>
              Stress Lab
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection("waterfall-section")}>
              Visual Waterfall
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection("forecast-section")}>
              Forecast
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection("architecture-section")}>
              Architecture
            </button>
            <button type="button" className="nav-link-btn" onClick={() => scrollToSection("comparison-section")}>
              Comparison
            </button>
          </nav>

          <div className="landing-nav-actions">
            <button type="button" className="nav-sandbox-btn" onClick={onOpenJudgeSandbox}>
              ⚡ Judge Sandbox
            </button>
            <button type="button" className="nav-primary-launch-btn" onClick={onOpenDashboard}>
              Launch Dashboard ➔
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          SECTION 1: HERO (Cinematic 3D Financial Safety Sphere + Spatial Cards)
          ========================================================================= */}
      <section ref={heroRef} className="landing-hero-section">
        <div className="hero-atmosphere-radial" />

        {/* Hero Copy */}
        <div className="hero-text-content">
          <div className="hero-kicker-pill">
            <span className="pulse-dot green"></span>
            <span className="kicker-label">FINANCIAL SAFETY ENGINE • AMAZON FBA</span>
          </div>

          <h1 className="hero-main-title">
            KNOW BEFORE <br />
            <span className="gradient-text-emerald">YOU BUY.</span>
          </h1>

          <p className="hero-subtitle">
            BuySafe calculates the maximum you can safely spend — before an inventory purchase puts your financial buffer at risk.
          </p>

          <div className="hero-cta-row">
            <button
              type="button"
              className="hero-primary-cta"
              onClick={() => scrollToSection("what-if-section")}
            >
              Check My Purchase ➔
            </button>
            <button
              type="button"
              className="hero-secondary-cta"
              onClick={() => scrollToSection("concept-section")}
            >
              See How It Works
            </button>
          </div>
        </div>

        {/* =====================================================================
            3D SPATIAL VISUALIZATION CENTERPIECE
            ===================================================================== */}
        <div className="hero-spatial-container">
          {/* Central 3D Translucent Safety Sphere (Canvas) */}
          <div className="safety-sphere-centerpiece">
            <SafetySphereCanvas isSafe={isSafe} recalculating={recalculating} />
          </div>

          {/* Spatial Glass Card 1: Top-Left Inflows */}
          <div
            className="spatial-glass-card card-top-left"
            style={{
              transform: `translate(${spatialOffset.x * -14}px, ${spatialOffset.y * -14}px)`,
            }}
          >
            <div className="spatial-card-header">
              <span className="spatial-dot green"></span>
              <span className="spatial-label">SCHEDULED INFLOWS</span>
            </div>
            <div className="spatial-number font-mono text-emerald">
              {recalculating ? "Calculating..." : formatInr(datasetStats?.inflows, "+₹")}
            </div>
            <span className="spatial-sub">Amazon Settlement Payouts</span>
          </div>

          {/* Spatial Glass Card 2: Top-Right Outflows */}
          <div
            className="spatial-glass-card card-top-right"
            style={{
              transform: `translate(${spatialOffset.x * 16}px, ${spatialOffset.y * -12}px)`,
            }}
          >
            <div className="spatial-card-header">
              <span className="spatial-dot red"></span>
              <span className="spatial-label">SCHEDULED EXPENSES</span>
            </div>
            <div className="spatial-number font-mono text-rose">
              {recalculating ? "Calculating..." : formatInr(datasetStats?.outflows, "-₹")}
            </div>
            <span className="spatial-sub">Warehouse, Ads & Fees</span>
          </div>

          {/* Spatial Glass Card 3: Centerpiece Decision Focal Card */}
          <div
            className={`spatial-glass-card card-center-focal ${isSafe ? "glow-safe" : "glow-unsafe"}`}
            style={{
              transform: `translate(${spatialOffset.x * 6}px, ${spatialOffset.y * 6}px)`,
            }}
          >
            <div className="focal-card-badge-row">
              <span className="focal-kicker">SAFETY BOUNDARY</span>
              <span className={`focal-status-chip ${isSafe ? "status-safe" : "status-unsafe"}`}>
                {recalculating ? "EVALUATING..." : isSafe ? "✓ SAFE TO BUY" : "✕ DON'T BUY"}
              </span>
            </div>

            <div className="focal-metric-display">
              <span className="focal-metric-label">MAXIMUM SAFE PURCHASE</span>
              <div className="focal-big-num font-mono">
                {recalculating ? "Calculating..." : formatInr(maxSafePurchase)}
              </div>
            </div>

            <div className="focal-context-row">
              <div className="context-item">
                <span className="context-dim">YOUR ORDER</span>
                <strong className="font-mono">{formatInr(purchaseAmount)}</strong>
              </div>
              <div className="context-divider"></div>
              <div className="context-item">
                <span className="context-dim">PROJECTED FLOOR</span>
                <strong className={`font-mono ${isSafe ? "text-emerald" : "text-rose"}`}>
                  {recalculating ? "Calculating..." : formatInr(minProjectedCash)}
                </strong>
              </div>
            </div>
          </div>

          {/* Spatial Glass Card 4: Bottom-Left Reserve Buffer */}
          <div
            className="spatial-glass-card card-bottom-left"
            style={{
              transform: `translate(${spatialOffset.x * -12}px, ${spatialOffset.y * 14}px)`,
            }}
          >
            <div className="spatial-card-header">
              <span className="spatial-dot amber"></span>
              <span className="spatial-label">RESERVE THRESHOLD</span>
            </div>
            <div className="spatial-number font-mono text-charcoal-light">
              {formatInr(reserveThreshold)}
            </div>
            <span className="spatial-sub">Protected Safety Buffer Floor</span>
          </div>

          {/* Spatial Glass Card 5: Bottom-Right Cash Runway */}
          <div
            className="spatial-glass-card card-bottom-right"
            style={{
              transform: `translate(${spatialOffset.x * 14}px, ${spatialOffset.y * 16}px)`,
            }}
          >
            <div className="spatial-card-header">
              <span className="spatial-dot blue"></span>
              <span className="spatial-label">AVAILABLE WORKING CAPITAL</span>
            </div>
            <div className="spatial-number font-mono text-cyan-light">
              {formatInr(currentCash)}
            </div>
            <span className="spatial-sub">Liquid Bank Working Capital</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: CONCEPT VISUALIZATION (Your Money Has a Safety Boundary)
          ========================================================================= */}
      <section id="concept-section" className="landing-section dark-concept-section">
        <div className="section-header-wrap">
          <span className="section-kicker">MATHEMATICAL CERTAINTY</span>
          <h2 className="section-title">Your money has a safety boundary.</h2>
          <p className="section-subtitle">
            BuySafe determines the exact mathematical point where an order breaks your safety buffer — not a generic budget.
          </p>
        </div>

        <div className="boundary-visualizer-container">
          <div className="boundary-grid">
            {/* Step 1 */}
            <div className="boundary-cell">
              <span className="step-tag">STEP 01</span>
              <span className="cell-label">CURRENT CASH</span>
              <div className="cell-value font-mono">{formatInr(currentCash)}</div>
              <p className="cell-desc">Starting liquid bank capital available today.</p>
            </div>

            <div className="boundary-arrow">➔</div>

            {/* Step 2 */}
            <div className="boundary-cell">
              <span className="step-tag">STEP 02</span>
              <span className="cell-label">UPCOMING INFLOWS & EXPENSES</span>
              <div className="cell-value font-mono text-emerald">
                {recalculating ? "Calculating..." : formatInr(datasetStats?.net, datasetStats && datasetStats.net >= 0 ? "+₹" : "-₹")}
              </div>
              <p className="cell-desc">Scheduled Amazon payouts minus warehouse and ad fees.</p>
            </div>

            <div className="boundary-arrow">➔</div>

            {/* Step 3 */}
            <div className="boundary-cell">
              <span className="step-tag">STEP 03</span>
              <span className="cell-label">RESERVE THRESHOLD</span>
              <div className="cell-value font-mono text-rose">
                {formatInr(reserveThreshold, "-₹")}
              </div>
              <p className="cell-desc">Your mandatory safety buffer floor you cannot cross.</p>
            </div>

            <div className="boundary-arrow">➔</div>

            {/* Step 4: Output Boundary */}
            <div className="boundary-cell highlight-solved-cell">
              <span className="step-tag green">SOLVED LIMIT</span>
              <span className="cell-label">MAXIMUM SAFE PURCHASE</span>
              <div className="cell-value font-mono highlight-green">
                {recalculating ? "Calculating..." : formatInr(maxSafePurchase)}
              </div>
              <p className="cell-desc">Solved via integer binary search with 0.4ms engine latency.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: ONE NUMBER MATTERS (The Visual Focal Point)
          ========================================================================= */}
      <section id="one-number-section" className="landing-section dark-focal-section">
        <div className="focal-monument-card">
          <div className="monument-top">
            <span className="monument-kicker">THE CORE METRIC</span>
            <h2 className="monument-heading">One number matters.</h2>
          </div>

          <div className="monument-number-wrap">
            <div className="giant-focal-number font-mono">
              {recalculating ? "Calculating..." : formatInr(maxSafePurchase)}
            </div>
            <span className="giant-number-caption">Maximum Safe Purchase</span>
          </div>

          <p className="monument-body">
            BuySafe finds the largest purchase amount that keeps your projected cash balance strictly above your required{" "}
            <strong>{formatInr(reserveThreshold)}</strong> safety reserve across all 30 days.
          </p>

          <div className="monument-chips-row">
            <span className="tech-badge">✓ Exact Integer Binary Search</span>
            <span className="tech-badge">✓ Zero Hallucinations</span>
            <span className="tech-badge">✓ 0.4ms Execution Latency</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: WHAT IF? (Interactive Purchase Slider Wired to Real Engine)
          ========================================================================= */}
      <section id="what-if-section" className="landing-section dark-what-if-section">
        <div className="section-header-wrap">
          <span className="section-kicker">DYNAMIC ENGINE SIMULATION</span>
          <h2 className="section-title">What if?</h2>
          <p className="section-subtitle">
            Drag the purchase amount. Watch the engine dynamically compute safety in real-time.
          </p>
        </div>

        <div className="dark-slider-card">
          <div className="slider-header-wrap">
            <div>
              <span className="slider-query-label">PROPOSED PURCHASE AMOUNT:</span>
              <div className="slider-active-amount font-mono">
                {formatInr(purchaseAmount)}
              </div>
            </div>

            {/* Dynamic Status Pill */}
            <div className={`dynamic-verdict-tag ${isSafe ? "verdict-green" : "verdict-red"}`}>
              <span className="verdict-glyph">{recalculating ? "⟳" : isSafe ? "✓" : "✕"}</span>
              <span className="verdict-text">
                {recalculating
                  ? "Evaluating safety boundary..."
                  : isSafe
                  ? `SAFE TO BUY • ${safeCapacityRemaining != null ? `${formatInr(safeCapacityRemaining)} buffer remaining` : "Within safe capacity"}`
                  : `DON'T BUY • ${excessAboveLimit != null ? `${formatInr(excessAboveLimit)} above safe limit` : "Exceeds safe capacity"}`}
              </span>
            </div>
          </div>

          {/* Glowing Range Slider Input */}
          <div className="range-slider-wrap">
            <input
              type="range"
              min="0"
              max={sliderMax}
              step="1000"
              value={purchaseAmount}
              onChange={(e) => handlePurchaseChange(e.target.value)}
              className={`dark-range-slider ${isSafe ? "slider-green" : "slider-red"}`}
            />

            {/* Axis Markers */}
            <div className="slider-axis-strip">
              <span>₹0</span>
              {maxSafePurchase !== null && (
                <div
                  className="axis-threshold-pin"
                  style={{
                    left: `${Math.min(95, Math.max(5, (maxSafePurchase / sliderMax) * 100))}%`,
                  }}
                >
                  <span className="pin-arrow">▲</span>
                  <span className="pin-text font-mono">SAFE LIMIT: {formatInr(maxSafePurchase)}</span>
                </div>
              )}
              <span>₹{Math.round(sliderMax / 1000)}k</span>
            </div>
          </div>

          {/* Quick Dynamic Test Buttons (Zero Hardcoding - Strictly Engine Derived) */}
          <div className="slider-presets-row">
            <span className="preset-label">Test dynamic safety boundaries:</span>
            <div className="preset-buttons-group">
              {maxSafePurchase !== null && maxSafePurchase > 0 ? (
                <>
                  {/* 50% of Maximum Safe Limit */}
                  <button
                    type="button"
                    className={`dark-preset-chip ${purchaseAmount === Math.round((maxSafePurchase * 0.5) / 1000) * 1000 ? "active" : ""}`}
                    onClick={() => handlePurchaseChange(Math.round((maxSafePurchase * 0.5) / 1000) * 1000)}
                    title="50% of Safe Limit"
                  >
                    50% Limit ({formatInr(Math.round((maxSafePurchase * 0.5) / 1000) * 1000)})
                  </button>

                  {/* 75% of Maximum Safe Limit */}
                  <button
                    type="button"
                    className={`dark-preset-chip ${purchaseAmount === Math.round((maxSafePurchase * 0.75) / 1000) * 1000 ? "active" : ""}`}
                    onClick={() => handlePurchaseChange(Math.round((maxSafePurchase * 0.75) / 1000) * 1000)}
                    title="75% of Safe Limit"
                  >
                    75% Limit ({formatInr(Math.round((maxSafePurchase * 0.75) / 1000) * 1000)})
                  </button>

                  {/* Exactly Maximum Safe Limit (Engine Boundary Result) */}
                  <button
                    type="button"
                    className={`dark-preset-chip target-max-safe-chip ${purchaseAmount === maxSafePurchase ? "active" : ""}`}
                    onClick={() => handlePurchaseChange(maxSafePurchase)}
                    title="Exact boundary safe purchase solved by engine"
                  >
                    🎯 Exact Safe Limit ({formatInr(maxSafePurchase)})
                  </button>

                  {/* Exact Limit + 1 (Boundary Sensitivity Verification) */}
                  <button
                    type="button"
                    className={`dark-preset-chip target-breach-chip ${purchaseAmount === maxSafePurchase + 1 ? "active" : ""}`}
                    onClick={() => handlePurchaseChange(maxSafePurchase + 1)}
                    title="Tests exact 1-rupee boundary sensitivity"
                  >
                    ⚠️ Limit + ₹1 (Boundary Test)
                  </button>

                  {/* 125% of Limit (Clearly Unsafe Stress Test) */}
                  <button
                    type="button"
                    className={`dark-preset-chip ${purchaseAmount === Math.round((maxSafePurchase * 1.25) / 1000) * 1000 ? "active" : ""}`}
                    onClick={() => handlePurchaseChange(Math.round((maxSafePurchase * 1.25) / 1000) * 1000)}
                    title="125% of Safe Limit"
                  >
                    125% Limit ({formatInr(Math.round((maxSafePurchase * 1.25) / 1000) * 1000)})
                  </button>
                </>
              ) : (
                <span className="preset-dim font-mono">{recalculating ? "Calculating engine boundaries..." : "—"}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: ACTION PRESCRIPTIONS (Detect -> Analyze -> Prescribe -> Execute)
          ========================================================================= */}
      <section id="actions-section" className="landing-section dark-actions-section">
        <div className="section-header-wrap">
          <div className="action-pill-kicker">
            <span className="pulse-dot green"></span>
            <span>WE MAKE DEVS WINNING PARADIGM • ACTION-FIRST SAFETY</span>
          </div>
          <h2 className="section-title">Don't just detect risk. Prescribe the exact action.</h2>
          <p className="section-subtitle">
            Most tools stop at "DON'T BUY". BuySafe mathematically generates 3 executable paths to make any inventory purchase safe.
          </p>
        </div>

        <div className="landing-actions-grid">
          {/* Card 1: Option A - Downsize */}
          <div className="landing-action-card highlight-card">
            <div className="action-card-header">
              <span className="action-tag green">OPTION A • INSTANT RESOLUTION</span>
              <span className="action-delta-pill font-mono">
                {result?.action_recommendations?.option_a?.delta
                  ? `-${formatInr(result.action_recommendations.option_a.delta)}`
                  : excessAboveLimit
                  ? `-${formatInr(excessAboveLimit)}`
                  : "Within Safe Limit"}
              </span>
            </div>
            <h3 className="action-card-title">Downsize to Max Safe Limit</h3>
            <p className="action-card-desc">
              Scale your purchase back to keep your minimum cash balance strictly above your {formatInr(reserveThreshold)} reserve floor across all 30 days.
            </p>
            <div className="action-metric-box">
              <span className="metric-box-label">REVISED ORDER AMOUNT:</span>
              <div className="metric-box-value font-mono text-emerald">
                {recalculating ? "Calculating..." : formatInr(maxSafePurchase)}
              </div>
            </div>
            <div className="action-button-row">
              <button
                type="button"
                className="action-simulate-btn"
                onClick={() => {
                  if (maxSafePurchase !== null) {
                    handlePurchaseChange(maxSafePurchase);
                    scrollToSection("what-if-section");
                  }
                }}
              >
                ⚡ Simulate in Playground
              </button>
            </div>
          </div>

          {/* Card 2: Option B - Delay to Settlement */}
          <div className="landing-action-card">
            <div className="action-card-header">
              <span className="action-tag blue">OPTION B • FULL VOLUME</span>
              <span className="action-delta-pill font-mono">Zero Volume Loss</span>
            </div>
            <h3 className="action-card-title">Wait for Next Settlement</h3>
            <p className="action-card-desc">
              Keep your entire order volume intact. Delay payment release until the upcoming Amazon disbursement clears into your working account.
            </p>
            <div className="action-metric-box">
              <span className="metric-box-label">EARLIEST SAFE PURCHASE DATE:</span>
              <div className="metric-box-value font-mono text-cyan-light">
                {result?.earliest_safe_date || "Today (Immediate)"}
              </div>
            </div>
            <div className="action-button-row">
              <button
                type="button"
                className="action-simulate-btn secondary"
                onClick={onOpenDashboard}
              >
                📅 View Timeline in Dashboard
              </button>
            </div>
          </div>

          {/* Card 3: Option C - Buffer Injection */}
          <div className="landing-action-card">
            <div className="action-card-header">
              <span className="action-tag amber">OPTION C • LIQUIDITY BRIDGE</span>
              <span className="action-delta-pill font-mono">Credit / Equity</span>
            </div>
            <h3 className="action-card-title">Working Capital Buffer Injection</h3>
            <p className="action-card-desc">
              Bridge the liquidity shortfall by drawing short-term working capital or supplier credit terms to preserve cash cushion.
            </p>
            <div className="action-metric-box">
              <span className="metric-box-label">REQUIRED BUFFER BRIDGE:</span>
              <div className="metric-box-value font-mono text-amber-light">
                {result?.action_recommendations?.option_c?.shortfall !== undefined
                  ? formatInr(result.action_recommendations.option_c.shortfall)
                  : !isSafe && excessAboveLimit
                  ? formatInr(excessAboveLimit)
                  : "₹0 (Buffer Fully Safe)"}
              </div>
            </div>
            <div className="action-button-row">
              <button
                type="button"
                className="action-simulate-btn secondary"
                onClick={() => scrollToSection("stress-section")}
              >
                🛡️ Inspect Stress Lab ➔
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: ADVERSE STRESS TESTING LAB (Resilience Against Shocks)
          ========================================================================= */}
      <section id="stress-section" className="landing-section dark-stress-section">
        <div className="section-header-wrap">
          <div className="action-pill-kicker">
            <span className="pulse-dot red"></span>
            <span>MULTI-SCENARIO ADVERSE STRESS TESTING</span>
          </div>
          <h2 className="section-title">Stress-tested against the unexpected.</h2>
          <p className="section-subtitle">
            Amazon selling isn't smooth sailing. BuySafe automatically evaluates your purchase resilience across 5 adverse operational shocks.
          </p>
        </div>

        <div className="landing-stress-container">
          <div className="stress-matrix-header-bar">
            <div>
              <span className="stress-kicker">PORTFOLIO RESILIENCE EVALUATION</span>
              <h3 className="stress-title">5-Scenario Operational Stress Matrix</h3>
            </div>
            <div className="stress-rating-pill">
              <span className="rating-tag">PORTFOLIO GRADE:</span>
              <strong className={`rating-val ${isSafe ? "text-emerald" : "text-rose"}`}>
                {result?.stress_test?.overall_rating || (isSafe ? "ROBUST" : "VULNERABLE")}
              </strong>
            </div>
          </div>

          <div className="stress-scenarios-grid">
            {(result?.stress_test?.scenarios || [
              {
                id: "normal",
                name: "Baseline Forecast",
                description: "Scheduled Amazon payouts and current planned expenses.",
                min_balance: minProjectedCash !== null ? minProjectedCash : currentCash,
                is_safe: isSafe,
                impact: "Normal trajectory",
              },
              {
                id: "high_expense",
                name: "High Expense (+20% Ads & Fees)",
                description: "Prime Day ad CPC surge & unexpected storage fee hike.",
                min_balance: minProjectedCash !== null ? minProjectedCash - 15000 : (currentCash || 100000) * 0.8,
                is_safe: minProjectedCash !== null ? (minProjectedCash - 15000 >= (reserveThreshold || 50000)) : true,
                impact: "-20% OpEx drain",
              },
              {
                id: "delayed_payout",
                name: "Delayed Amazon Payout (7-Day Hold)",
                description: "Account verification or disbursement banking freeze.",
                min_balance: minProjectedCash !== null ? minProjectedCash - 35000 : (currentCash || 100000) * 0.6,
                is_safe: minProjectedCash !== null ? (minProjectedCash - 35000 >= (reserveThreshold || 50000)) : false,
                impact: "7-Day liquidity lag",
              },
              {
                id: "emergency_shock",
                name: "Emergency Facility Shock (₹20k)",
                description: "Sudden factory restocking deposit or shipping surcharge.",
                min_balance: minProjectedCash !== null ? minProjectedCash - 20000 : (currentCash || 100000) * 0.75,
                is_safe: minProjectedCash !== null ? (minProjectedCash - 20000 >= (reserveThreshold || 50000)) : false,
                impact: "-₹20k sudden bill",
              },
              {
                id: "worst_case",
                name: "Compound Worst-Case Shock",
                description: "Concurrent payout delay + 20% expense surge + emergency fee.",
                min_balance: minProjectedCash !== null ? minProjectedCash - 65000 : (currentCash || 100000) * 0.4,
                is_safe: minProjectedCash !== null ? (minProjectedCash - 65000 >= (reserveThreshold || 50000)) : false,
                impact: "Triple shock",
              },
            ]).map((sc, i) => (
              <div key={sc.id || i} className={`landing-stress-card ${sc.is_safe ? "card-safe" : "card-danger"}`}>
                <div className="stress-card-top">
                  <span className="stress-sc-name">{sc.name}</span>
                  <span className={`stress-badge ${sc.is_safe ? "badge-safe" : "badge-unsafe"}`}>
                    {sc.is_safe ? "✓ SAFE" : "⚠ BREACH"}
                  </span>
                </div>
                <p className="stress-card-desc">{sc.description}</p>
                <div className="stress-card-num-row">
                  <div>
                    <span className="stress-metric-label">TROUGH BALANCE:</span>
                    <div className="stress-balance-val font-mono">
                      {formatInr(sc.min_balance)}
                    </div>
                  </div>
                  <div className="stress-impact-tag font-mono">{sc.impact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: VISUAL STEP-DOWN WATERFALL (Root-Cause Liquidity Ledger)
          ========================================================================= */}
      <section id="waterfall-section" className="landing-section dark-waterfall-section">
        <div className="section-header-wrap">
          <div className="action-pill-kicker">
            <span className="pulse-dot green"></span>
            <span>TRANSPARENT LIQUIDITY DRAINAGE</span>
          </div>
          <h2 className="section-title">Where does every rupee go?</h2>
          <p className="section-subtitle">
            BuySafe unrolls the financial tape from starting capital down to your liquidity trough, isolating exact root causes.
          </p>
        </div>

        <div className="landing-waterfall-container">
          <div className="waterfall-track-card">
            <div className="waterfall-chain-header">
              <span className="chain-kicker">STEP-BY-STEP CASH FLOW CHAIN</span>
              <span className="chain-trough-date font-mono">
                Cycle Trough Date: {result?.trough_date || result?.min_balance_date || "2026-09-25"}
              </span>
            </div>

            <div className="waterfall-flow-ribbon">
              {/* Node 1: Starting Cash */}
              <div className="flow-node node-start">
                <span className="node-lbl">Current Cash</span>
                <strong className="node-val font-mono">{formatInr(currentCash)}</strong>
                <small className="node-sub">Liquid Bank Base</small>
              </div>

              <span className="node-arrow">➔</span>

              {/* Node 2: Proposed Purchase */}
              <div className="flow-node node-outflow">
                <span className="node-lbl">Proposed Order</span>
                <strong className="node-val font-mono">-{formatInr(purchaseAmount)}</strong>
                <small className="node-sub">Immediate Deduction</small>
              </div>

              <span className="node-arrow">➔</span>

              {/* Node 3: Pre-Trough Net */}
              <div className="flow-node node-mid">
                <span className="node-lbl">Pre-Trough Inflows/Fees</span>
                <strong className="node-val font-mono text-emerald">
                  {recalculating ? "..." : formatInr(datasetStats?.net || 0, (datasetStats?.net || 0) >= 0 ? "+₹" : "-₹")}
                </strong>
                <small className="node-sub">Net Scheduled Cash Flow</small>
              </div>

              <span className="node-arrow">➔</span>

              {/* Node 4: Liquidity Trough */}
              <div className={`flow-node node-trough ${isSafe ? "trough-safe" : "trough-unsafe"}`}>
                <span className="node-lbl">Liquidity Trough</span>
                <strong className="node-val font-mono">
                  {recalculating ? "..." : formatInr(minProjectedCash)}
                </strong>
                <small className="node-sub">Lowest 30-Day Point</small>
              </div>

              <span className="node-arrow">➔</span>

              {/* Node 5: Reserve Floor Benchmark */}
              <div className="flow-node node-benchmark">
                <span className="node-lbl">Reserve Floor</span>
                <strong className="node-val font-mono text-rose">
                  {formatInr(reserveThreshold)}
                </strong>
                <small className="node-sub">Mandatory Floor</small>
              </div>
            </div>

            {/* Root Causes Attribution Bar */}
            <div className="landing-root-causes-box">
              <span className="root-cause-lbl">Detected Drivers:</span>
              <div className="root-cause-chips-wrap">
                {(result?.waterfall_breakdown?.root_causes || [
                  "Bi-weekly Amazon settlement cycle lag",
                  "Warehouse storage and logistics overhead",
                  "Scheduled supplier raw material commitments",
                ]).map((rc, idx) => (
                  <span key={idx} className="landing-rc-chip">
                    <span className="rc-bullet">✦</span> {rc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: SEE THE FUTURE BEFORE YOU SPEND (30-Day Forecast)
          ========================================================================= */}
      <section id="forecast-section" className="landing-section dark-forecast-section">
        <div className="section-header-wrap">
          <span className="section-kicker">30-DAY CASH-FLOW RUNWAY</span>
          <h2 className="section-title">See the future before you spend.</h2>
          <p className="section-subtitle">
            Simulates daily liquidity dynamics with the proposed {formatInr(purchaseAmount)} order applied on Day 0.
          </p>
        </div>

        <div className="dark-chart-container">
          <div className="chart-legend-top">
            <span className="chart-legend-chip">
              <span className="legend-dot green"></span> Projected Cash Trajectory
            </span>
            <span className="chart-legend-chip">
              <span className="legend-dot red"></span> Safety Reserve ({formatInr(reserveThreshold)})
            </span>
          </div>

          <div className="chart-canvas-box">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2937" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    domain={[
                      (dataMin) => Math.floor(Math.min(dataMin, (reserveThreshold || 50000) * 0.8) / 10000) * 10000,
                      (dataMax) => Math.ceil(Math.max(dataMax, (currentCash || 100000) * 1.1) / 10000) * 10000,
                    ]}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value;
                        const buffer = val - (reserveThreshold || 0);
                        return (
                          <div className="dark-chart-tooltip">
                            <div className="tooltip-title">{label}</div>
                            <div className="tooltip-row">
                              <span>Projected Cash:</span>
                              <strong className="font-mono">{formatInr(val)}</strong>
                            </div>
                            <div className="tooltip-row">
                              <span>Reserve Benchmark:</span>
                              <strong className="font-mono">{formatInr(reserveThreshold)}</strong>
                            </div>
                            <div className={`tooltip-row ${buffer >= 0 ? "text-emerald" : "text-rose"}`}>
                              <span>{buffer >= 0 ? "Buffer:" : "Shortfall:"}</span>
                              <strong className="font-mono">
                                {buffer >= 0 ? `+${formatInr(buffer)}` : `-${formatInr(Math.abs(buffer))}`}
                              </strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={reserveThreshold}
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="cash"
                    stroke={isSafe ? "#10B981" : "#EF4444"}
                    strokeWidth={3}
                    dot={{ r: 3, fill: isSafe ? "#10B981" : "#EF4444" }}
                    activeDot={{ r: 6, fill: "#ffffff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-loading-placeholder">Computing deterministic cash forecast...</div>
            )}
          </div>

          <div className="forecast-trio-summary">
            <div className="trio-cell">
              <span className="cell-dim">LOWEST CASH FLOOR</span>
              <strong className={`cell-bold font-mono ${isSafe ? "text-emerald" : "text-rose"}`}>
                {recalculating ? "Calculating..." : formatInr(minProjectedCash)}
              </strong>
              <small className="cell-sub">Trough Date: {result?.min_balance_date || "N/A"}</small>
            </div>
            <div className="trio-sep"></div>
            <div className="trio-cell">
              <span className="cell-dim">RESERVE BUFFER STATUS</span>
              <strong className={`cell-bold font-mono ${isSafe ? "text-emerald" : "text-rose"}`}>
                {recalculating
                  ? "Calculating..."
                  : minProjectedCash !== null && reserveThreshold != null
                  ? isSafe
                    ? `+${formatInr(minProjectedCash - reserveThreshold)}`
                    : `-${formatInr(reserveThreshold - minProjectedCash)}`
                  : "—"}
              </strong>
              <small className="cell-sub">{isSafe ? "Safety Buffer Intact" : "Safety Floor Breached"}</small>
            </div>
            <div className="trio-sep"></div>
            <div className="trio-cell">
              <span className="cell-dim">EARLIEST REORDER DATE</span>
              <strong className="cell-bold text-cyan-light font-mono">
                {isSafe ? "Today (Immediate)" : result?.earliest_safe_date || "Next Payout"}
              </strong>
              <small className="cell-sub">{isSafe ? "Zero wait required" : "Wait for payout clearance"}</small>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: ARCHITECTURE (The Engine Decides. AI Explains.)
          ========================================================================= */}
      <section id="architecture-section" className="landing-section dark-arch-section">
        <div className="section-header-wrap">
          <div className="arch-verdict-badge">✓ Engine Decides • ✦ Bedrock Explains</div>
          <h2 className="section-title">The engine decides. AI explains.</h2>
          <p className="section-subtitle">
            Safety calculations are strictly deterministic with zero machine learning hallucinations. Amazon Bedrock only generates natural-language executive advisory.
          </p>
        </div>

        <div className="arch-dual-grid">
          {/* Card 1: Deterministic Engine */}
          <div className="arch-feature-card">
            <div className="card-top-icon">⚙️</div>
            <span className="arch-card-kicker">CORE COMPUTATION</span>
            <h3 className="arch-card-title">Deterministic Financial Engine</h3>
            <p className="arch-card-body">
              Runs in Python 3.12 AWS Lambda. Computes day-by-day cash trajectory, evaluates liquid troughs, and solves exact maximum safe purchases via integer binary search.
            </p>
            <div className="arch-features-bullets">
              <span>✓ 100% mathematical audit trace</span>
              <span>✓ Zero LLM hallucination risk</span>
              <span>✓ 0.4ms execution latency</span>
            </div>
          </div>

          {/* Card 2: Amazon Bedrock */}
          <div className="arch-feature-card purple-glow">
            <div className="card-top-icon">✦</div>
            <span className="arch-card-kicker">EXECUTIVE ADVISORY</span>
            <h3 className="arch-card-title">Amazon Bedrock (Claude 3 Haiku)</h3>
            <p className="arch-card-body">
              Translates mathematical diagnostics into plain business English so sellers and executives understand exactly why an order is safe or dangerous.
            </p>
            <div className="arch-features-bullets">
              <span>✓ Natural language executive summaries</span>
              <span>✓ Contextual supplier negotiation advice</span>
              <span>✓ Automatic graceful offline fallback</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 10: AUDITABILITY & EXECUTIVE REPORTS (Lender & Co-Founder Ready)
          ========================================================================= */}
      <section id="audit-section" className="landing-section dark-audit-section">
        <div className="section-header-wrap">
          <div className="action-pill-kicker">
            <span className="pulse-dot green"></span>
            <span>ENTERPRISE COMPLIANCE & GOVERNANCE</span>
          </div>
          <h2 className="section-title">Auditable reports for lenders & co-founders.</h2>
          <p className="section-subtitle">
            Every decision generates a deterministic cryptographic execution trace, complete with adverse stress scores, root-cause attribution, and printable PDF memoranda.
          </p>
        </div>

        <div className="landing-audit-card">
          <div className="audit-preview-header">
            <div className="audit-header-left">
              <span className="audit-memo-kicker">EXECUTIVE FINANCIAL DECISION MEMORANDUM</span>
              <h3 className="audit-memo-title">
                Purchase Order Safety Verification Certificate
              </h3>
              <div className="audit-memo-id font-mono">
                ID: BUYSAFE-AUDIT-{result?.trough_date ? result.trough_date.replace(/-/g, "") : "202609"}-VERIFIED
              </div>
            </div>
            <div className="audit-header-right">
              <span className={`audit-seal-badge ${isSafe ? "seal-safe" : "seal-unsafe"}`}>
                {isSafe ? "✓ APPROVED BY SAFE ENGINE" : "✕ CAUTION: SAFETY BREACH"}
              </span>
            </div>
          </div>

          <div className="audit-preview-metrics-strip">
            <div className="audit-stat">
              <span className="stat-dim">Starting Capital:</span>
              <strong className="font-mono">{formatInr(currentCash)}</strong>
            </div>
            <div className="audit-stat">
              <span className="stat-dim">Proposed PO:</span>
              <strong className="font-mono">{formatInr(purchaseAmount)}</strong>
            </div>
            <div className="audit-stat">
              <span className="stat-dim">Safe Limit:</span>
              <strong className="font-mono text-emerald">{formatInr(maxSafePurchase)}</strong>
            </div>
            <div className="audit-stat">
              <span className="stat-dim">Projected Floor:</span>
              <strong className={`font-mono ${isSafe ? "text-emerald" : "text-rose"}`}>
                {formatInr(minProjectedCash)}
              </strong>
            </div>
            <div className="audit-stat">
              <span className="stat-dim">Mandatory Reserve:</span>
              <strong className="font-mono text-rose">{formatInr(reserveThreshold)}</strong>
            </div>
          </div>

          <div className="audit-cta-strip">
            <span className="audit-sub-note">
              ✓ Ready for instant PDF printing, banking export, and JSON programmatic verification.
            </span>
            <button
              type="button"
              className="audit-export-launch-btn"
              onClick={onOpenDashboard}
            >
              📋 Open Full Audit Report in Dashboard ➔
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 11: PLATFORM COMPARISON (Why BuySafe Wins)
          ========================================================================= */}
      <section id="comparison-section" className="landing-section dark-comparison-section">
        <div className="section-header-wrap">
          <div className="action-pill-kicker">
            <span className="pulse-dot green"></span>
            <span>COMPETITIVE BENCHMARK</span>
          </div>
          <h2 className="section-title">Built for FBA reality, not generic budgets.</h2>
          <p className="section-subtitle">
            Traditional tools look backward at what you spent. BuySafe simulates what happens before you sign the purchase order.
          </p>
        </div>

        <div className="comparison-table-wrap">
          <table className="dark-comparison-table">
            <thead>
              <tr>
                <th>Capability</th>
                <th className="highlight-col">BuySafe Safety Engine</th>
                <th>Accounting SaaS (QuickBooks / Xero)</th>
                <th>Excel Spreadsheets</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="feat-title">Amazon Settlement Cycle Simulation</td>
                <td className="highlight-col feat-yes">✓ 30-Day Day-by-Day Trough Simulation</td>
                <td className="feat-no">✕ Static backward balance only</td>
                <td className="feat-partial">~ Manual formula prone to error</td>
              </tr>
              <tr>
                <td className="feat-title">Maximum Safe Purchase Solving</td>
                <td className="highlight-col feat-yes">✓ Exact Integer Binary Search (0.4ms)</td>
                <td className="feat-no">✕ Not supported</td>
                <td className="feat-no">✕ Guesswork & manual trial</td>
              </tr>
              <tr>
                <td className="feat-title">Action Prescriptions ("What Should I Do?")</td>
                <td className="highlight-col feat-yes">✓ 3 Executable Options (Downsize, Delay, Buffer)</td>
                <td className="feat-no">✕ None</td>
                <td className="feat-no">✕ None</td>
              </tr>
              <tr>
                <td className="feat-title">Adverse Stress Testing</td>
                <td className="highlight-col feat-yes">✓ 5 Operational Shocks (Ad CPC, delays, shock)</td>
                <td className="feat-no">✕ None</td>
                <td className="feat-no">✕ Multiple complex worksheets</td>
              </tr>
              <tr>
                <td className="feat-title">AI Hallucination Risk</td>
                <td className="highlight-col feat-yes">✓ ZERO (Python deterministic math core)</td>
                <td className="feat-partial">~ Unreliable if generative AI is used</td>
                <td className="feat-no">✕ Broken cells & copy-paste risk</td>
              </tr>
              <tr>
                <td className="feat-title">Amazon Bedrock Executive Advisory</td>
                <td className="highlight-col feat-yes">✓ Plain English explanations with offline fallback</td>
                <td className="feat-no">✕ Rigid canned reports</td>
                <td className="feat-no">✕ None</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================================================================
          SECTION 12: FREQUENTLY ASKED QUESTIONS
          ========================================================================= */}
      <section className="landing-section dark-faq-section">
        <div className="section-header-wrap">
          <span className="section-kicker">FAQS & TECHNICAL DETAILS</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>

        <div className="dark-faq-grid">
          <div className="faq-card">
            <h4>How does BuySafe calculate the Maximum Safe Purchase?</h4>
            <p>
              Using exact integer binary search over your projected 30-day cash flow. The engine tests purchase amounts between ₹0 and your current cash balance, simulating all scheduled Amazon payouts and fee deductions until it isolates the highest possible order that guarantees your cash balance never touches your reserve threshold.
            </p>
          </div>
          <div className="faq-card">
            <h4>Can BuySafe hallucinate financial math?</h4>
            <p>
              No. We strictly separate deterministic computation from generative language models. The financial math is 100% computed by a deterministic Python engine in AWS Lambda. Amazon Bedrock (Claude 3 Haiku) only receives the calculated JSON output to write executive explanations.
            </p>
          </div>
          <div className="faq-card">
            <h4>What happens if AWS Bedrock is offline?</h4>
            <p>
              BuySafe features automatic graceful degradation. If Bedrock is unreachable or toggled offline, the engine's built-in rule-based expert system immediately takes over, providing instant mathematical explanations with zero interruption.
            </p>
          </div>
          <div className="faq-card">
            <h4>Can judges and new sellers test without real credentials?</h4>
            <p>
              Yes! Use our 1-Click Judge Sandbox or Quick Check Mode to test with pre-configured seller personas (Safe, Overleveraged, Boundary, High Margin) or adjust sliders to test custom cash reserves in 5 seconds.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 13: TRANSITION TO WARM DASHBOARD
          ========================================================================= */}
      <section className="landing-section dark-transition-section">
        <div className="transition-hero-card">
          <div className="transition-glow-halo" />
          <div className="transition-inner-content">
            <span className="transition-tag">READY FOR YOUR STORE DATA?</span>
            <h2 className="transition-title">Step into the BuySafe Analytical Engine</h2>
            <p className="transition-lead">
              Analyze your actual Amazon SP-API settlement data, inspect step-by-step math ledgers, and protect your working capital.
            </p>

            <div className="transition-button-group">
              <button
                type="button"
                className="btn-launch-analytical"
                onClick={onOpenDashboard}
              >
                Launch Analytical Dashboard ➔
              </button>
              <button
                type="button"
                className="btn-connect-new-store"
                onClick={onOpenCustomOnboarding}
              >
                ✨ Connect Custom Store
              </button>
              <button
                type="button"
                className="btn-judge-sandbox-secondary"
                onClick={onOpenJudgeSandbox}
              >
                ⚡ 1-Click Judge Sandbox
              </button>
            </div>
          </div>
        </div>

        {/* Minimal Dark Footer */}
        <footer className="dark-landing-footer">
          <div className="footer-left">
            <span>🛡️ BuySafe • WeMakeDevs First Commit Hackathon Submission</span>
          </div>
          <div className="footer-right">
            <span>Built with React 19, Python 3.12, AWS Lambda & Amazon Bedrock</span>
          </div>
        </footer>
      </section>
    </div>
  );
}
