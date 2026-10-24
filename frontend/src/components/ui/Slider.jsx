export default function Slider({ value, onChange, min = 0, max = 100, step = 1, label, labelExtra, disabled = false, id, name, previewStyle }) {
  const num = Number(value);
  const safe = Number.isFinite(num) ? num : min;

  return (
    <div className="ui-slider">
      {label && (
        <label className="ui-slider__label" htmlFor={id || name}>
          {label}
          {labelExtra}
        </label>
      )}
      <div className="ui-slider__row">
        <input
          id={id}
          name={name}
          type="range"
          min={min}
          max={max}
          step={step}
          value={safe}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        {previewStyle && (
          <span className="ui-slider__swatch" style={previewStyle} aria-hidden="true" />
        )}
        <span className="ui-slider__value">{Number.isFinite(num) ? num : '–'}</span>
      </div>
    </div>
  );
}
