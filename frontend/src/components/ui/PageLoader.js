import logo from "../../assets/logo.png";

function PageLoader({ label = "Cargando..." }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ display: "grid", justifyItems: "center", gap: "1rem" }}>
        <img src={logo} alt="FitnessControl" className="fc-page-loader__logo" />
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="fc-spinner" aria-hidden="true" />
          <span style={{ color: "rgba(242, 238, 245, 0.72)" }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

export default PageLoader;
