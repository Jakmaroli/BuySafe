import React, { useState } from "react";

/**
 * StressTestMatrix
 * 
 * Simulates the proposed inventory purchase under 5 adverse stress test scenarios.
 * Answers: "What happens if things don't go according to plan?"
 * Evaluates financial resilience vs. fragility.
 */
export default function StressTestMatrix({
  stressTest = [],
  purchaseAmount = 0,
  reserveThreshold = 60000,
}) {
  const [selectedScenarioKey, setSelectedScenarioKey] = useState("normal");

  if (!stressTest || stressTest.length === 0) {
    return (
      <div className="stress-matrix-loading">
        <span>Running stress resilience simulations...</span>
      </div>
    );
  }

  const selectedScenario = stressTest.find((s) => s.key === selectedScenarioKey) || stressTest[0];

  const getResilienceBadgeClass = (resilience) => {
    switch (resilience) {
      case "ROBUST":
        return "badge-resilience-robust";
      case "STABLE":
        return "badge-resilience-stable";
      case "VULNERABLE":
        return "badge-resilience-vulnerable";
      case "FRAGILE":
        return "badge-resilience-fragile";
      case "CRITICAL":
      default:
        return "badge-resilience-critical";
    }
  };

  return (
    <div className="stress-test-matrix-panel">
      <div className="stress-header">
        <div>
          <span className="stress-kicker">ADVERSE MARKET SIMULATION</span>
          <h3 className="stress-title">Financial Resilience Stress Test</h3>
        </div>
        <div className="stress-header-note">
          <span>
            Simulates order safety under payout delays, expense spikes, and emergency shocks.
          </span>
        </div>
      </div>

      {/* Scenarios Table */}
      <div className="stress-table-wrap">
        <table className="stress-table">
          <thead>
            <tr>
              <th>SCENARIO</th>
              <th>STATUS</th>
              <th>PROJECTED FLOOR</th>
              <th>SHORTFALL / BUFFER</th>
              <th>RESILIENCE TIER</th>
            </tr>
          </thead>
          <tbody>
            {stressTest.map((sc) => {
              const isSafe = sc.status === "SAFE";
              const isSelected = sc.key === selectedScenarioKey;
              const buffer = sc.min_balance - reserveThreshold;

              return (
                <tr
                  key={sc.key}
                  className={`stress-row ${isSelected ? "row-selected" : ""} ${
                    isSafe ? "row-safe" : "row-unsafe"
                  }`}
                  onClick={() => setSelectedScenarioKey(sc.key)}
                >
                  <td className="cell-scenario-name">
                    <div className="scenario-main-name">
                      <span className="scenario-icon">
                        {sc.key === "normal"
                          ? "📊"
                          : sc.key === "high_expense"
                          ? "📈"
                          : sc.key === "delayed_payout"
                          ? "⏳"
                          : sc.key === "emergency_shock"
                          ? "⚡"
                          : "🚨"}
                      </span>
                      <strong>{sc.name}</strong>
                    </div>
                    <span className="scenario-brief-desc">{sc.description}</span>
                  </td>

                  <td>
                    <span className={`status-pill-small ${isSafe ? "pill-safe" : "pill-unsafe"}`}>
                      {isSafe ? "✓ SAFE" : "✕ DON'T BUY"}
                    </span>
                  </td>

                  <td className="font-mono">
                    <span className={isSafe ? "text-emerald" : "text-rose"}>
                      ₹{Number(sc.min_balance).toLocaleString("en-IN")}
                    </span>
                  </td>

                  <td className="font-mono">
                    {isSafe ? (
                      <span className="text-emerald bold">
                        +₹{buffer.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="text-rose bold">
                        -₹{sc.shortfall.toLocaleString("en-IN")}
                      </span>
                    )}
                  </td>

                  <td>
                    <span className={`resilience-badge ${getResilienceBadgeClass(sc.resilience)}`}>
                      {sc.resilience}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scenario Detail Callout */}
      {selectedScenario && (
        <div className="stress-detail-callout">
          <div className="callout-badge-row">
            <span className="callout-tag">SCENARIO BREAKDOWN: {selectedScenario.name.toUpperCase()}</span>
            <span
              className={`callout-verdict ${
                selectedScenario.status === "SAFE" ? "verdict-safe" : "verdict-unsafe"
              }`}
            >
              {selectedScenario.status === "SAFE"
                ? "✓ PASSES SAFETY THRESHOLD"
                : "✕ BREACHES SAFETY THRESHOLD"}
            </span>
          </div>
          <p className="callout-explanation">{selectedScenario.description}</p>
          <div className="callout-metrics-strip font-mono">
            <span>
              Proposed Order: <strong>₹{Number(purchaseAmount).toLocaleString("en-IN")}</strong>
            </span>
            <span>•</span>
            <span>
              Trough Cash:{" "}
              <strong
                className={selectedScenario.status === "SAFE" ? "text-emerald" : "text-rose"}
              >
                ₹{Number(selectedScenario.min_balance).toLocaleString("en-IN")}
              </strong>
            </span>
            <span>•</span>
            <span>
              Reserve Floor: <strong>₹{Number(reserveThreshold).toLocaleString("en-IN")}</strong>
            </span>
            <span>•</span>
            <span>
              Resilience: <strong>{selectedScenario.resilience}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
