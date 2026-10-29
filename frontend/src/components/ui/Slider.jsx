export default function Slider({ value, onChange, min = 0, max = 100, step = 1, label, labelExtra, disabled = false, id, name, previewStyle }) {
  const num = Number(value);
  const safe = Number.isFinite(num) ? num : min;
  const clamped = Math.min(max, Math.max(min, safe));

  const span = max - min || 1;
  const pct = ((clamped - min) / span) * 100;

  return (
    <div className="ui-slider">
      {label && (
        <label className="ui-slider__label" htmlFor={id || name}>
          {label}
          {labelExtra}
        </label>
      )}
      <div className="ui-slider__row">
        <div className="ui-slider__track-wrap">
          <div className="ui-slider__track" aria-hidden="true" />
          <div
            className="ui-slider__range"
            style={{ left: 0, right: `${100 - pct}%` }}
            aria-hidden="true"
          />
          <input
            id={id}
            name={name}
            type="range"
            className="ui-slider__input"
            min={min}
            max={max}
            step={step}
            value={safe}
            disabled={disabled}
            onChange={(e) => onChange(parseFloat(e.target.value))}
          />
        </div>
        {previewStyle && (
          <span className="ui-slider__swatch" style={previewStyle} aria-hidden="true" />
        )}
        <span className="ui-slider__value">{Number.isFinite(num) ? num : '–'}</span>
      </div>
    </div>
  );
}
