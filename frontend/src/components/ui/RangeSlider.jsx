function toRange(value, min, max) {
  const clamp = (n) => Math.min(max, Math.max(min, n));
  if (Array.isArray(value) && value.length === 2) {
    const a = Number(value[0]);
    const b = Number(value[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return [clamp(Math.min(a, b)), clamp(Math.max(a, b))];
    }
  }
  return [min, max];
}

export default function RangeSlider({ value, onChange, min = 0, max = 100, step = 1, label, labelExtra, disabled = false, id, name }) {
  const [lo, hi] = toRange(value, min, max);

  // When both thumbs overlap, the lower thumb must stay grabbable:
  // at the bottom edge the upper thumb is on top (drag up to expand),
  // everywhere else the lower thumb is on top (drag down to shrink).
  const loOnTop = lo === hi ? lo > min : false;

  const handleLo = (e) => {
    const v = Math.min(max, Math.max(min, parseFloat(e.target.value)));
    onChange([Math.min(v, hi), hi]);
  };

  const handleHi = (e) => {
    const v = Math.min(max, Math.max(min, parseFloat(e.target.value)));
    onChange([lo, Math.max(v, lo)]);
  };

  const span = max - min || 1;
  const pctLo = ((lo - min) / span) * 100;
  const pctHi = ((hi - min) / span) * 100;

  return (
    <div className="ui-rangeslider">
      {label && (
        <label className="ui-rangeslider__label" htmlFor={id || name}>
          {label}
          {labelExtra}
        </label>
      )}
      <div className="ui-rangeslider__row">
        <div className="ui-rangeslider__track-wrap">
          <div className="ui-rangeslider__track" aria-hidden="true" />
          <div
            className="ui-rangeslider__range"
            style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }}
            aria-hidden="true"
          />
          <input
            id={id}
            name={name}
            type="range"
            className="ui-rangeslider__input"
            style={{ zIndex: loOnTop ? 5 : 3 }}
            min={min}
            max={max}
            step={step}
            value={lo}
            disabled={disabled}
            aria-label={label ? `${label} (von)` : 'von'}
            onChange={handleLo}
          />
          <input
            name={name ? `${name}-hi` : undefined}
            type="range"
            className="ui-rangeslider__input"
            style={{ zIndex: loOnTop ? 4 : 5 }}
            min={min}
            max={max}
            step={step}
            value={hi}
            disabled={disabled}
            aria-label={label ? `${label} (bis)` : 'bis'}
            onChange={handleHi}
          />
        </div>
        <span className="ui-rangeslider__value">
          {lo} – {hi}
        </span>
      </div>
    </div>
  );
}
