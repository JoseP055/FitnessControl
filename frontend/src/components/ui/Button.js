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
      className={`fc-button fc-button--${variant}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner label="Procesando" /> : children}
    </button>
  );
}

export default Button;
