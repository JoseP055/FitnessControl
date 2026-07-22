function Card({ children, className = "", glass = false }) {
  const classes = ["fc-card", glass ? "fc-card--glass" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes}>
      <div className="fc-card__content">{children}</div>
    </section>
  );
}

export default Card;
