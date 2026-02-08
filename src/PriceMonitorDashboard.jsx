import { useState, useMemo } from "react";

// --- Mock Data ---
const MORRIS_MN = { lat: 45.5869, lng: -95.9138 };

const facilities = [
  { id: 1, name: "Farmers Cooperative Elevator", city: "Hanley Falls", state: "MN", distance: 32 },
  { id: 2, name: "Farmward Cooperative", city: "Benson", state: "MN", distance: 21 },
  { id: 3, name: "CFS Cooperative", city: "Hancock", state: "MN", distance: 12 },
  { id: 4, name: "Nexus Cooperative", city: "Willmar", state: "MN", distance: 42 },
  { id: 5, name: "Canby Grain", city: "Canby", state: "MN", distance: 48 },
  { id: 6, name: "Meadowland Farmers Coop", city: "Appleton", state: "MN", distance: 28 },
  { id: 7, name: "Prairie Grain Partners", city: "Montevideo", state: "MN", distance: 38 },
  { id: 8, name: "Centra Sota Cooperative", city: "St. Cloud", state: "MN", distance: 112 },
];

const contracts = ["Mar 26 (H)", "May 26 (K)", "Jul 26 (N)", "Sep 26 (U)", "Dec 26 (Z)"];

function generatePrices(commodity) {
  const base = commodity === "corn" ? 4.52 : 10.28;
  const spread = commodity === "corn" ? 0.45 : 0.85;
  return facilities.map((f) => {
    const cash = +(base + (Math.random() - 0.5) * spread).toFixed(2);
    const basis = +(cash - base + (Math.random() - 0.3) * 0.15).toFixed(2);
    const prevCash = +(cash + (Math.random() - 0.5) * 0.18).toFixed(2);
    const pctChange = +(((cash - prevCash) / prevCash) * 100).toFixed(2);
    return {
      ...f,
      cash,
      basis,
      prevCash,
      pctChange,
      contract: contracts[Math.floor(Math.random() * 3)],
      delivery: ["Spot", "Feb 15–28", "Mar 1–15", "Apr 1–30"][Math.floor(Math.random() * 4)],
      updated: "Feb 06, 2026 4:32 PM",
      alert: Math.abs(pctChange) > 5,
    };
  });
}

function generateHistory(commodity) {
  const base = commodity === "corn" ? 4.4 : 10.1;
  const days = 30;
  const data = [];
  let price = base;
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    price += (Math.random() - 0.48) * 0.06;
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      futures: +price.toFixed(2),
      avgCash: +(price - 0.12 + (Math.random() - 0.5) * 0.08).toFixed(2),
    });
  }
  return data;
}

function generateAlerts(commodity) {
  const names = facilities.map((f) => f.name);
  const base = commodity === "corn" ? 4.5 : 10.2;
  return [
    {
      id: 1,
      facility: names[4],
      type: "Cash Bid",
      oldVal: +(base + 0.32).toFixed(2),
      newVal: +(base - 0.02).toFixed(2),
      pct: -7.1,
      date: "Feb 06",
      time: "4:32 PM",
    },
    {
      id: 2,
      facility: names[1],
      type: "Basis",
      oldVal: -0.18,
      newVal: -0.31,
      pct: -72.2,
      date: "Feb 06",
      time: "4:30 PM",
    },
    {
      id: 3,
      facility: names[6],
      type: "Cash Bid",
      oldVal: +(base + 0.05).toFixed(2),
      newVal: +(base + 0.38).toFixed(2),
      pct: 6.8,
      date: "Feb 05",
      time: "4:45 PM",
    },
  ];
}

// --- Mini Chart Component ---
function SparkChart({ data, color, height = 120 }) {
  if (!data.length) return null;
  const vals = data.map((d) => d.futures);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.futures - min) / range) * (h - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  const cashPoints = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.avgCash - min) / range) * (h - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: `${h}px` }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <polyline
        points={cashPoints}
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="3,2"
        opacity="0.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// --- Main Dashboard ---
export default function PriceMonitorDashboard() {
  const [commodity, setCommodity] = useState("corn");
  const [view, setView] = useState("prices");
  const [sortCol, setSortCol] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const prices = useMemo(() => generatePrices(commodity), [commodity]);
  const history = useMemo(() => generateHistory(commodity), [commodity]);
  const alerts = useMemo(() => generateAlerts(commodity), [commodity]);

  const isCorn = commodity === "corn";
  const accent = isCorn ? "#D4920B" : "#3A7D44";
  const accentLight = isCorn ? "#FDF3E0" : "#E8F5E9";
  const accentDark = isCorn ? "#8B6508" : "#2E5E34";
  const bg = "#FAFAF7";
  const cardBg = "#FFFFFF";
  const textPrimary = "#1A1A18";
  const textSecondary = "#6B6B63";
  const borderColor = "#E5E5DF";

  const lastFutures = history.length ? history[history.length - 1].futures : 0;
  const prevFutures = history.length > 1 ? history[history.length - 2].futures : lastFutures;
  const futuresChange = +(((lastFutures - prevFutures) / prevFutures) * 100).toFixed(2);
  const avgCash = +(prices.reduce((s, p) => s + p.cash, 0) / prices.length).toFixed(2);
  const avgBasis = +(prices.reduce((s, p) => s + p.basis, 0) / prices.length).toFixed(2);

  const sorted = [...prices].sort((a, b) => {
    let va = a[sortCol],
      vb = b[sortCol];
    if (typeof va === "string") {
      va = va.toLowerCase();
      vb = vb.toLowerCase();
    }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ opacity: 0.3, fontSize: 10 }}>⇅</span>;
    return <span style={{ fontSize: 10 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div
      style={{
        fontFamily: "'Instrument Sans', 'DM Sans', system-ui, sans-serif",
        background: bg,
        minHeight: "100vh",
        color: textPrimary,
      }}
    >
      {/* Header */}
      <header
        style={{
          background: textPrimary,
          color: "#FAFAF7",
          padding: "0",
          borderBottom: `3px solid ${accent}`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  color: textPrimary,
                }}
              >
                {isCorn ? "C" : "S"}
              </div>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    fontFamily: "'Instrument Sans', 'DM Sans', system-ui",
                  }}
                >
                  Regional Price Monitor
                </h1>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                  Morris, MN · 150mi radius · Updated Feb 06, 2026
                </p>
              </div>
            </div>

            {/* Commodity Toggle */}
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: 3,
                gap: 2,
              }}
            >
              {["corn", "soybeans"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCommodity(c)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                    transition: "all 0.2s",
                    background: commodity === c ? (c === "corn" ? "#D4920B" : "#3A7D44") : "transparent",
                    color: commodity === c ? "#fff" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {c === "corn" ? "🌽 Corn" : "🫘 Soybeans"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>
        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
          {[
            {
              label: "Futures Settlement",
              value: `$${lastFutures.toFixed(2)}`,
              sub: `${futuresChange >= 0 ? "+" : ""}${futuresChange}%`,
              subColor: futuresChange >= 0 ? "#3A7D44" : "#C62828",
            },
            { label: "Avg Cash Bid", value: `$${avgCash}`, sub: `${prices.length} facilities`, subColor: textSecondary },
            { label: "Avg Basis", value: `${avgBasis >= 0 ? "+" : ""}${avgBasis}`, sub: "vs nearby contract", subColor: textSecondary },
            {
              label: "Active Alerts",
              value: alerts.length,
              sub: "> 5% threshold",
              subColor: alerts.length > 0 ? "#C62828" : textSecondary,
            },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                background: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 10,
                padding: "16px 18px",
                borderTop: `3px solid ${i === 0 ? accent : "transparent"}`,
              }}
            >
              <p style={{ margin: 0, fontSize: 11, color: textSecondary, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                {card.label}
              </p>
              <p
                style={{
                  margin: "6px 0 4px",
                  fontSize: 26,
                  fontWeight: 700,
                  fontFamily: "'Instrument Sans', 'DM Sans', monospace",
                  letterSpacing: "-0.02em",
                }}
              >
                {card.value}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: card.subColor, fontWeight: 500 }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 10,
            padding: "18px 20px",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>30-Day Price Trend</h3>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: textSecondary }}>
                <span style={{ display: "inline-block", width: 14, height: 2, background: accent, marginRight: 6, verticalAlign: "middle" }} />
                Futures
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 2,
                    background: accent,
                    marginRight: 6,
                    marginLeft: 14,
                    verticalAlign: "middle",
                    opacity: 0.5,
                    borderTop: `1px dashed ${accent}`,
                  }}
                />
                Avg Cash Bid
              </p>
            </div>
            <div style={{ fontSize: 11, color: textSecondary }}>$/bu</div>
          </div>
          <SparkChart data={history} color={accent} height={140} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: textSecondary, marginTop: 4, padding: "0 2px" }}>
            <span>{history[0]?.date}</span>
            <span>{history[Math.floor(history.length / 2)]?.date}</span>
            <span>{history[history.length - 1]?.date}</span>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: `2px solid ${borderColor}` }}>
          {[
            { key: "prices", label: "Current Prices" },
            { key: "alerts", label: `Alerts (${alerts.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                padding: "10px 18px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: view === tab.key ? accent : textSecondary,
                borderBottom: view === tab.key ? `2px solid ${accent}` : "2px solid transparent",
                marginBottom: -2,
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Prices Table */}
        {view === "prices" && (
          <div
            style={{
              background: cardBg,
              border: `1px solid ${borderColor}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F5F5F0", borderBottom: `1px solid ${borderColor}` }}>
                    {[
                      { key: "name", label: "Facility" },
                      { key: "distance", label: "Dist (mi)" },
                      { key: "cash", label: "Cash Bid" },
                      { key: "basis", label: "Basis" },
                      { key: "contract", label: "Contract" },
                      { key: "delivery", label: "Delivery" },
                      { key: "pctChange", label: "Δ %" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        style={{
                          padding: "10px 14px",
                          textAlign: col.key === "name" ? "left" : "right",
                          fontWeight: 600,
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          color: textSecondary,
                          cursor: "pointer",
                          userSelect: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col.label} <SortIcon col={col.key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: `1px solid ${borderColor}`,
                        background: row.alert ? (isCorn ? "#FFF8E7" : "#F1F9F1") : "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "11px 14px", fontWeight: 600 }}>
                        <div>{row.name}</div>
                        <div style={{ fontSize: 11, color: textSecondary, fontWeight: 400 }}>
                          {row.city}, {row.state}
                        </div>
                      </td>
                      <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: "monospace", color: textSecondary }}>
                        {row.distance}
                      </td>
                      <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                        ${row.cash.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: row.basis >= 0 ? "#3A7D44" : "#C62828",
                        }}
                      >
                        {row.basis >= 0 ? "+" : ""}
                        {row.basis.toFixed(2)}
                      </td>
                      <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 12, color: textSecondary }}>{row.contract}</td>
                      <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 12, color: textSecondary }}>{row.delivery}</td>
                      <td
                        style={{
                          padding: "11px 14px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: 600,
                          color: row.pctChange >= 0 ? "#3A7D44" : "#C62828",
                        }}
                      >
                        {row.alert && (
                          <span
                            style={{
                              display: "inline-block",
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "#C62828",
                              marginRight: 6,
                              verticalAlign: "middle",
                              animation: "pulse 1.5s ease-in-out infinite",
                            }}
                          />
                        )}
                        {row.pctChange >= 0 ? "+" : ""}
                        {row.pctChange}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "10px 14px", fontSize: 11, color: textSecondary, borderTop: `1px solid ${borderColor}` }}>
              {prices.length} facilities · Prices in $/bu · Last scrape: Feb 06, 2026 4:32 PM CST
            </div>
          </div>
        )}

        {/* Alerts */}
        {view === "alerts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {alerts.map((a) => (
              <div
                key={a.id}
                style={{
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderLeft: `4px solid ${a.pct >= 0 ? "#3A7D44" : "#C62828"}`,
                  borderRadius: 10,
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
                    {a.facility}
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: accentLight,
                        color: accentDark,
                        fontWeight: 600,
                      }}
                    >
                      {a.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: textSecondary }}>
                    {a.date} at {a.time}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600 }}>
                    <span style={{ color: textSecondary }}>${a.oldVal}</span>
                    <span style={{ margin: "0 6px", color: textSecondary }}>→</span>
                    <span>${a.newVal}</span>
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: "monospace",
                      color: a.pct >= 0 ? "#3A7D44" : "#C62828",
                      marginTop: 2,
                    }}
                  >
                    {a.pct >= 0 ? "+" : ""}
                    {a.pct}%
                  </div>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: textSecondary, padding: "6px 0" }}>
              Showing alerts exceeding ±5% threshold · {isCorn ? "Corn" : "Soybeans"} only
            </div>
          </div>
        )}

        {/* Footer */}
        <footer
          style={{
            marginTop: 32,
            paddingTop: 16,
            borderTop: `1px solid ${borderColor}`,
            fontSize: 11,
            color: textSecondary,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>Corn & Soybean Regional Price Monitor · Morris, MN 150mi radius</span>
          <span>Data from public elevator bids & CME settlements · Prototype</span>
        </footer>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        * { box-sizing: border-box; }
        table tr:hover td { background: rgba(0,0,0,0.015); }
        button:hover { opacity: 0.88; }
      `}</style>
    </div>
  );
}
