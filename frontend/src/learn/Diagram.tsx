import { Arrow } from "./Arrow";
import type { DiagramState } from "./scenarios";

interface BoxProps {
  label: string;
  sublabel: string;
  color: string;
  active: boolean;
  badge?: string | null;
  badgeColor?: string;
}

function Box({ label, sublabel, color, active, badge, badgeColor }: BoxProps) {
  return (
    <div style={{ textAlign: "center", transition: "opacity 0.3s", opacity: active ? 1 : 0.3 }}>
      <div
        style={{
          width: "110px",
          height: "70px",
          border: `2px solid ${color}`,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active ? `${color}15` : "transparent",
          fontWeight: "bold",
          fontSize: "14px",
          color: "#eee",
          boxShadow: active ? `0 0 12px ${color}40` : "none",
          transition: "all 0.3s",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "10px", color: "#888", marginTop: "4px" }}>{sublabel}</div>
      {badge && (
        <div
          style={{
            fontSize: "11px",
            fontWeight: "bold",
            marginTop: "4px",
            color: badgeColor,
            animation: "badge-pop 0.3s ease-out",
          }}
        >
          {badge}
        </div>
      )}
    </div>
  );
}

interface DiagramProps {
  state: DiagramState;
}

export function Diagram({ state }: DiagramProps) {
  const varnishBadgeColor =
    state.varnishStatus === "HIT"
      ? "#4caf50"
      : state.varnishStatus === "MISS"
        ? "#f44336"
        : state.varnishStatus === "PASS"
          ? "#ff9800"
          : undefined;

  // Determine which arrows to show and their directions
  const showTopRow = !state.arrowBrowserToExpress && !state.arrowExpressToBrowser;
  const showDirectRow = state.arrowBrowserToExpress || state.arrowExpressToBrowser;

  return (
    <div style={{ padding: "24px", maxWidth: "700px", margin: "0 auto" }}>
      {showTopRow && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Box label="Browser" sublabel="TanStack Query" color="#2196f3" active={state.browserActive} />
          <Arrow
            active={state.arrowBrowserToVarnish || state.arrowVarnishToBrowser}
            reverse={state.arrowVarnishToBrowser && !state.arrowBrowserToVarnish}
            label={state.arrowBrowserToVarnish ? state.arrowLabel : state.arrowVarnishToBrowser ? state.responseLabel : null}
          />
          <Box
            label="Varnish"
            sublabel="Reverse Proxy"
            color="#ff9800"
            active={state.varnishActive}
            badge={state.varnishStatus}
            badgeColor={varnishBadgeColor}
          />
          <Arrow
            active={state.arrowVarnishToExpress || state.arrowExpressToVarnish}
            reverse={state.arrowExpressToVarnish && !state.arrowVarnishToExpress}
            label={state.arrowVarnishToExpress ? state.arrowLabel : state.arrowExpressToVarnish ? state.responseLabel : null}
          />
          <Box label="Express" sublabel="In-memory data" color="#9c27b0" active={state.expressActive} />
        </div>
      )}
      {showDirectRow && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Box label="Browser" sublabel="TanStack Query" color="#2196f3" active={state.browserActive} />
          <Arrow
            active={state.arrowBrowserToExpress || state.arrowExpressToBrowser}
            reverse={state.arrowExpressToBrowser && !state.arrowBrowserToExpress}
            label={state.arrowBrowserToExpress ? state.arrowLabel : state.arrowExpressToBrowser ? state.responseLabel : null}
          />
          <Box
            label="Varnish"
            sublabel="Bypassed"
            color="#ff9800"
            active={false}
          />
          <div style={{ flex: 1 }} />
          <Box label="Express" sublabel="In-memory data" color="#9c27b0" active={state.expressActive} />
        </div>
      )}
    </div>
  );
}
