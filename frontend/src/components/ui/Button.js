import Spinner from "./Spinner";

function Button({
  children,
  variant = "primary",
  loading = false,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`fc-button fc-button--${variant} ${loading ? "is-loading" : ""}`}
      disabled={loading || props.disabled}
      aria-busy={loading}
      {...props}
    >
      <span className="fc-button__label">
        {loading ? <Spinner /> : null}
        <span className={loading ? "fc-button__content is-loading" : "fc-button__content"}>
          {children}
        </span>
      </span>
    </button>
  );
}

export default Button;
