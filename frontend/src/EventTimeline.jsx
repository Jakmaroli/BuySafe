import React, { useState } from "react";

/**
 * EventTimeline
 * 
 * Interactive chronological money timeline visualizing scheduled cash flow events.
 * Identifies the exact sequence of drains leading into the liquidity trough.
 */
export default function EventTimeline({
  eventTimeline = [],
  purchaseAmount = 0,
  minBalanceDate,
}) {
  const [selectedEventIndex, setSelectedEventIndex] = useState(null);

  if (!eventTimeline || eventTimeline.length === 0) {
    return (
      <div className="timeline-loading">
        <span>Mapping chronological cash flow events...</span>
      </div>
    );
  }

  return (
    <div className="event-timeline-panel">
      <div className="timeline-header">
        <div>
          <span className="timeline-kicker">INTERACTIVE MONEY TIMELINE</span>
          <h3 className="timeline-title">Scheduled Cash Events & Trough Sequence</h3>
        </div>
        <div className="timeline-header-badges">
          <span className="timeline-badge-trough font-mono">
            🎯 Trough Date: {minBalanceDate || "Cycle Low"}
          </span>
        </div>
      </div>

      <p className="timeline-guidance">
        Events occurring <strong>before</strong> the trough date directly determine whether an order breaches your reserve threshold.
      </p>

      <div className="timeline-track-wrap">
        <div className="timeline-track-line"></div>

        <div className="timeline-nodes-list">
          {/* Day 0: Proposed Purchase */}
          <div className="timeline-entry-node node-proposed-purchase">
            <div className="entry-marker">🛒</div>
            <div className="entry-card">
              <div className="entry-card-top">
                <span className="entry-date font-mono">DAY 0 • TODAY</span>
                <span className="entry-type-chip chip-purchase">PROPOSED PO</span>
              </div>
              <div className="entry-title">Inventory Purchase Order</div>
              <div className="entry-amount font-mono text-rose">
                -₹{Number(purchaseAmount).toLocaleString("en-IN")}
              </div>
              <span className="entry-desc">Applied immediately to starting cash</span>
            </div>
          </div>

          {/* Scheduled CSV Events */}
          {eventTimeline.map((item, idx) => {
            const isIncome = ["amazon_payout", "refund", "income", "inflow"].includes(item.type?.toLowerCase());
            const isSelected = selectedEventIndex === idx;

            return (
              <div
                key={idx}
                className={`timeline-entry-node ${
                  item.is_trough_date ? "node-is-trough" : ""
                } ${item.is_before_trough ? "node-before-trough" : "node-after-trough"}`}
                onClick={() => setSelectedEventIndex(isSelected ? null : idx)}
              >
                <div className={`entry-marker ${isIncome ? "marker-income" : "marker-expense"}`}>
                  {isIncome ? "💰" : "📦"}
                </div>

                <div className={`entry-card ${isSelected ? "card-selected" : ""}`}>
                  <div className="entry-card-top">
                    <span className="entry-date font-mono">{item.date}</span>
                    <span
                      className={`entry-type-chip ${
                        isIncome ? "chip-income" : "chip-expense"
                      }`}
                    >
                      {item.type.replace("_", " ").toUpperCase()}
                    </span>
                    {item.is_trough_date && (
                      <span className="entry-trough-badge">LOWEST POINT</span>
                    )}
                  </div>

                  <div className="entry-title">{item.description}</div>

                  <div
                    className={`entry-amount font-mono ${
                      isIncome ? "text-emerald" : "text-rose"
                    }`}
                  >
                    {isIncome ? "+" : "-"}₹{Number(item.amount).toLocaleString("en-IN")}
                  </div>

                  <div className="entry-footer">
                    <span className="entry-sub">
                      {item.is_before_trough
                        ? "⚠ Impacts safety boundary"
                        : "✓ Occurs after trough recovery"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
