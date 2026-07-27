import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function Input({ id, label, helperText, type, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="fc-field">
      <label className="fc-field__label" htmlFor={id}>
        {label}
      </label>
      {isPassword ? (
        <div className="fc-input-wrapper">
          <input className="fc-input" id={id} type={resolvedType} {...props} />
          <button
            type="button"
            className="fc-input-toggle"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      ) : (
        <input className="fc-input" id={id} type={type} {...props} />
      )}
      {helperText ? <small className="fc-text-eyebrow">{helperText}</small> : null}
    </div>
  );
}

export default Input;
