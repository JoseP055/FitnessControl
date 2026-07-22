function PageLoader({ label = "Cargando..." }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
        <span className="fc-spinner" aria-hidden="true" />
        <span style={{ color: "rgba(242, 238, 245, 0.72)" }}>{label}</span>
      </div>
    </div>
  );
}

export default PageLoader;
