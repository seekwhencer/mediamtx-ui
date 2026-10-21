export default function Toggle({ checked, onChange, label, labelExtra, disabled = false, id, name }) {
  return (
    <label className={`ui-toggle ${disabled ? 'is-disabled' : ''}`.trim()}>
      <input
        type="checkbox"
        role="switch"
        id={id}
        name={name}
        checked={!!checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="ui-toggle__track" aria-hidden="true">
        <span className="ui-toggle__thumb" />
      </span>
      {label && (
        <span className="ui-toggle__label">
          {label}
          {labelExtra}
        </span>
      )}
    </label>
  );
}
