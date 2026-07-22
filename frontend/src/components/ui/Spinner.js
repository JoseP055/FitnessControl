function Spinner({ label = "Cargando" }) {
  return (
    <span className="fc-button__label" aria-live="polite">
      <span className="fc-spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export default Spinner;
