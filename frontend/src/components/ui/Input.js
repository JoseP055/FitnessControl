function Input({ id, label, helperText, ...props }) {
  return (
    <div className="fc-field">
      <label className="fc-field__label" htmlFor={id}>
        {label}
      </label>
      <input className="fc-input" id={id} {...props} />
      {helperText ? <small className="fc-text-eyebrow">{helperText}</small> : null}
    </div>
  );
}

export default Input;
