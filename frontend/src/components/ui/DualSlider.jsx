function toPair(value, min) {
  if (Array.isArray(value) && value.length === 2) {
    const a = Number(value[0]);
    const b = Number(value[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return [a, b];
    }
  }
  return [min, min];
}

export default function DualSlider({ value, onChange, min = 0, max = 100, step = 1, label, labelExtra, labels = [], disabled = false, id, name }) {
  const [a, b] = toPair(value, min);

  const setAt = (index, v) => {
    const next = [a, b];
    next[index] = Math.min(max, Math.max(min, v));
    onChange(next);
  };

  const renderRow = (index, subLabel) => {
    const v = index === 0 ? a : b;
    const span = max - min || 1;
    const pct = ((v - min) / span) * 100;
    return (
      <div className="ui-dualslider__row" key={index}>
        <span className="ui-dualslider__sublabel">{subLabel}</span>
        <div className="ui-dualslider__track-wrap">
          <div className="ui-dualslider__track" aria-hidden="true" />
          <div
            className="ui-dualslider__range"
            style={{ left: 0, right: `${100 - pct}%` }}
            aria-hidden="true"
          />
          <input
            type="range"
            className="ui-dualslider__input"
            min={min}
            max={max}
            step={step}
            value={v}
            disabled={disabled}
            aria-label={subLabel || label || `value ${index + 1}`}
            onChange={(e) => setAt(index, parseFloat(e.target.value))}
          />
        </div>
        <span className="ui-dualslider__value">{v}</span>
      </div>
    );
  };

  return (
    <div className="ui-dualslider">
      {label && (
        <label className="ui-dualslider__label" htmlFor={id || name}>
          {label}
          {labelExtra}
        </label>
      )}
      {renderRow(0, labels[0])}
      {renderRow(1, labels[1])}
    </div>
  );
}
