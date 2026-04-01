import { NavLink } from "react-router-dom";

const linkStyle = {
  color: "#888",
  textDecoration: "none",
  padding: "4px 0",
  fontSize: "14px",
};

const activeLinkStyle = {
  ...linkStyle,
  color: "#fff",
  borderBottom: "2px solid #4caf50",
};

export function NavBar() {
  return (
    <nav
      style={{
        display: "flex",
        gap: "24px",
        padding: "12px 24px",
        background: "#16213e",
        borderBottom: "1px solid #333",
        alignItems: "center",
      }}
    >
      <span style={{ fontWeight: "bold", color: "#4caf50", fontSize: "14px" }}>
        Cache Experiments
      </span>
      <NavLink to="/" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)} end>
        App
      </NavLink>
      <NavLink to="/learn" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}>
        Learn
      </NavLink>
    </nav>
  );
}
