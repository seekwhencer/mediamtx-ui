function normalizeOptions(options = []) {
  return options.map((opt) =>
    typeof opt === 'object' && opt !== null ? { value: opt.value, label: opt.label ?? String(opt.value) } : { value: opt, label: String(opt) }
  );
}

export default function Select({
  label,
  hint,
  error,
  id,
  name,
  options = [],
  placeholder,
  className = '',
  ...rest
}) {
  const selectId = id || name;
  const classes = ['ui-select', className].filter(Boolean).join(' ');
  const normalized = normalizeOptions(options);

  return (
    <div className={`ui-field ${error ? 'has-error' : ''}`.trim()}>
      {label && (
        <label className="ui-field__label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <select id={selectId} name={name} className={classes} aria-invalid={error ? true : undefined} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {normalized.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <span className="ui-field__hint">{hint}</span>}
      {error && <span className="ui-field__error">{error}</span>}
    </div>
  );
}
