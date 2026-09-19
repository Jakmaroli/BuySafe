import React from "react";

/**
 * ActionRecommendations
 * 
 * Interactive decision layer that answers: "What should I do instead?"
 * Provides 1-click simulations to make an unsafe purchase safe, or scale a safe purchase.
 */
export default function ActionRecommendations({
  recommendations = [],
  isSafe = true,
  purchaseAmount = 0,
  shortfall = 0,
  onApplyPurchase,
  onApplyCash,
  recalculating = false,
}) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="action-recommendations-panel">
      <div className="action-panel-header">
        <div className="action-header-left">
          <span className="action-kicker-badge">
            {isSafe ? "DECISION GUIDANCE" : "HOW TO MAKE IT SAFE"}
          </span>
          <h3 className="action-panel-title">
            {isSafe ? "Optimization Pathways" : "Prescribed Action Options"}
          </h3>
        </div>
        <div className="action-header-meta">
          <span className="action-sub-text">
            {isSafe
              ? "Your safety buffer is preserved. Here are scale and execution options."
              : `Order exceeds safety boundary by ₹${(shortfall || 0).toLocaleString("en-IN")}. Choose a simulation to resolve.`}
          </span>
        </div>
      </div>

      <div className="action-cards-grid">
        {recommendations.map((rec) => {
          const isDownsize = rec.id === "downsize";
          const isWait = rec.id === "wait";
          const isInject = rec.id === "inject_capital";
          const isProceed = rec.id === "proceed";
          const isUpsize = rec.id === "upsize";

          return (
            <div
              key={rec.id}
              className={`action-option-card ${
                isDownsize
                  ? "card-accent-emerald"
                  : isWait
                  ? "card-accent-cyan"
                  : isInject
                  ? "card-accent-amber"
                  : isProceed
                  ? "card-accent-emerald"
                  : "card-accent-purple"
              }`}
            >
              <div className="action-card-top">
                <span className="action-type-chip">{rec.badge}</span>
                <span className="action-option-id">
                  {isDownsize ? "OPTION A" : isWait ? "OPTION B" : isInject ? "OPTION C" : "ACTION"}
                </span>
              </div>

              <h4 className="action-card-title">{rec.title}</h4>
              <p className="action-card-desc">{rec.description}</p>

              {/* Metric Delta Visualizer */}
              <div className="action-metric-box">
                {isDownsize && (
                  <div className="action-delta-row">
                    <span className="metric-tag">Order Adjustment</span>
                    <div className="metric-flow font-mono">
                      <span className="strikethrough text-rose">₹{Number(rec.current_value).toLocaleString("en-IN")}</span>
                      <span className="flow-arrow">➔</span>
                      <span className="text-emerald bold">₹{Number(rec.target_value).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                )}

                {isWait && (
                  <div className="action-delta-row">
                    <span className="metric-tag">Execution Date</span>
                    <div className="metric-flow font-mono">
                      <span className="text-charcoal-light">Today</span>
                      <span className="flow-arrow">➔</span>
                      <span className="text-cyan bold">{rec.target_value}</span>
                    </div>
                  </div>
                )}

                {isInject && (
                  <div className="action-delta-row">
                    <span className="metric-tag">Working Capital</span>
                    <div className="metric-flow font-mono">
                      <span className="text-amber bold">+₹{Number(rec.delta).toLocaleString("en-IN")}</span>
                      <span className="metric-sublabel">required buffer</span>
                    </div>
                  </div>
                )}

                {isUpsize && (
                  <div className="action-delta-row">
                    <span className="metric-tag">Max Scale Target</span>
                    <div className="metric-flow font-mono">
                      <span className="text-emerald bold">₹{Number(rec.target_value).toLocaleString("en-IN")}</span>
                      <span className="metric-sublabel">zero buffer breach</span>
                    </div>
                  </div>
                )}

                {isProceed && (
                  <div className="action-delta-row">
                    <span className="metric-tag">Status Verification</span>
                    <div className="metric-flow font-mono text-emerald bold">
                      ✓ Ready for PO
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="action-btn-wrap">
                {isDownsize && (
                  <button
                    type="button"
                    className="action-trigger-btn btn-downsize"
                    disabled={recalculating}
                    onClick={() => onApplyPurchase && onApplyPurchase(rec.target_value)}
                  >
                    ⚡ {rec.button_text}
                  </button>
                )}

                {isWait && (
                  <button
                    type="button"
                    className="action-trigger-btn btn-wait"
                    disabled={recalculating}
                    onClick={() => {
                      alert(`Simulation: Postponing purchase order to ${rec.target_value} clears safely after Amazon settlement payout arrives.`);
                    }}
                  >
                    📅 {rec.button_text}
                  </button>
                )}

                {isInject && (
                  <button
                    type="button"
                    className="action-trigger-btn btn-inject"
                    disabled={recalculating}
                    onClick={() => onApplyCash && onApplyCash(rec.target_value)}
                  >
                    💼 {rec.button_text}
                  </button>
                )}

                {isUpsize && (
                  <button
                    type="button"
                    className="action-trigger-btn btn-upsize"
                    disabled={recalculating}
                    onClick={() => onApplyPurchase && onApplyPurchase(rec.target_value)}
                  >
                    🚀 {rec.button_text}
                  </button>
                )}

                {isProceed && (
                  <button
                    type="button"
                    className="action-trigger-btn btn-proceed"
                    disabled={recalculating}
                    onClick={() => {
                      alert(`Order Verified: ₹${Number(purchaseAmount).toLocaleString("en-IN")} is mathematically safe to issue.`);
                    }}
                  >
                    ✓ {rec.button_text}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
