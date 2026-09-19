import React from "react";

/**
 * VisualWaterfall
 * 
 * Visualizes the step-by-step cash flow from starting capital to liquidity trough.
 * Replaces walls of text with an intuitive visual step-down diagram and root causes.
 */
export default function VisualWaterfall({
  waterfall,
  isSafe = true,
}) {
  if (!waterfall) {
    return (
      <div className="waterfall-panel-loading">
        <span>Generating visual cash step-down diagram...</span>
      </div>
    );
  }

  const { steps = [], root_causes = [], shortfall = 0, buffer = 0, trough_date } = waterfall;

  return (
    <div className="visual-waterfall-panel">
      <div className="waterfall-header">
        <div>
          <span className="waterfall-kicker">STEP-BY-STEP CASH FLOW</span>
          <h3 className="waterfall-title">
            {isSafe ? "Why Is This Order Safe?" : "Why Did This Order Trigger DON'T BUY?"}
          </h3>
        </div>
        <div className="waterfall-summary-pill">
          <span className={`pill-dot ${isSafe ? "dot-emerald" : "dot-rose"}`}></span>
          <span className="pill-text font-mono">
            {isSafe
              ? `+₹${buffer.toLocaleString("en-IN")} Reserve Margin`
              : `-₹${shortfall.toLocaleString("en-IN")} Reserve Deficit`}
          </span>
        </div>
      </div>

      {/* Interactive Step-Down Sequence */}
      <div className="waterfall-steps-track">
        {steps.map((step, idx) => {
          const isNeg = step.amount < 0;
          const isTrough = step.type === "trough";
          const isBench = step.type === "benchmark";
          const isSubtotal = step.type === "subtotal";
          const isStart = step.type === "start";

          return (
            <React.Fragment key={idx}>
              <div
                className={`waterfall-node ${
                  isTrough
                    ? isSafe
                      ? "node-trough-safe"
                      : "node-trough-unsafe"
                    : isBench
                    ? "node-benchmark"
                    : isSubtotal
                    ? "node-subtotal"
                    : isStart
                    ? "node-start"
                    : isNeg
                    ? "node-negative"
                    : "node-positive"
                }`}
              >
                <div className="node-top-label">{step.label}</div>
                <div className="node-amount font-mono">
                  {step.amount < 0
                    ? `-₹${Math.abs(step.amount).toLocaleString("en-IN")}`
                    : `₹${Number(step.amount).toLocaleString("en-IN")}`}
                </div>
                {isTrough && (
                  <span className="node-sub-tag font-mono">
                    Trough: {trough_date || "Cycle Low"}
                  </span>
                )}
                {isBench && (
                  <span className="node-sub-tag font-mono">
                    Must Not Cross
                  </span>
                )}
              </div>

              {idx < steps.length - 1 && (
                <div className="waterfall-flow-connector">
                  <span className="flow-chevron">➔</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Root Cause Analysis Pills */}
      <div className="waterfall-root-causes-bar">
        <div className="root-cause-label">
          <span>{isSafe ? "Contributing Factors:" : "Root Cause Drivers:"}</span>
        </div>
        <div className="root-cause-tags-group">
          {root_causes.map((cause, i) => (
            <div key={i} className={`root-cause-chip ${isSafe ? "chip-safe" : "chip-unsafe"}`}>
              <span className="chip-bullet">{isSafe ? "✓" : "⚠"}</span>
              <span className="chip-text">{cause}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
