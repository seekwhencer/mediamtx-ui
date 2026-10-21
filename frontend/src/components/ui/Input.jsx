export default function Input({
  label,
  labelExtra,
  hint,
  error,
  id,
  name,
  mono = false,
  className = '',
  ...rest
}) {
  const inputId = id || name;
  const classes = ['ui-input', mono ? 'ui-input--mono' : '', className].filter(Boolean).join(' ');

  const field = (
    <div className={`ui-field ${error ? 'has-error' : ''}`.trim()}>
      {label && (
        <label className="ui-field__label" htmlFor={inputId}>
          {label}
          {labelExtra}
        </label>
      )}
      <input id={inputId} name={name} className={classes} aria-invalid={error ? true : undefined} {...rest} />
      {hint && !error && <span className="ui-field__hint">{hint}</span>}
      {error && <span className="ui-field__error">{error}</span>}
    </div>
  );

  return field;
}
