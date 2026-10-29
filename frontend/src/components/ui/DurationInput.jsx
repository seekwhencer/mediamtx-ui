import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Einheiten in Ausgabe-Reihenfolge (größte → kleinste).
const UNITS = ['y', 'mo', 'w', 'd', 'h', 'm', 's', 'ms'];

// Anzeige-Reihenfolge der Zeilen (kleinste → größte, beginnend mit ms).
const DISPLAY_UNITS = ['ms', 's', 'm', 'h', 'd', 'w', 'mo', 'y'];

// Vermeidet Float-Artefakte (0.1 + 0.2 = 0.30000000000000004).
function formatNumber(n) {
  const rounded = Math.round(n * 1e6) / 1e6;
  return String(rounded);
}

// Zerlegt eine Duration-String in ein Objekt { unit: number }.
// ns/us werden in ms umgerechnet.
function parseDurationToUnits(value) {
  if (value == null) return {};
  const str = String(value).trim();
  if (!str) return {};

  const re = /(\d+(?:\.\d+)?)(ns|µs|us|ms|mo|s|m|h|d|w|y)/g;
  const result = {};
  let match;
  while ((match = re.exec(str)) !== null) {
    const num = parseFloat(match[1]);
    let unit = match[2];
    if (unit === 'µs') unit = 'us';
    if (unit === 'ns' || unit === 'us') {
      const ms = unit === 'ns' ? num * 0.000001 : num * 0.001;
      result.ms = (result.ms || 0) + ms;
    } else {
      result[unit] = (result[unit] || 0) + num;
    }
  }
  return result;
}

// Erzeugt die Zeichenfolge aus dem Objekt { unit: number }.
function unitsToDuration(units) {
  const parts = [];
  for (const unit of UNITS) {
    const raw = units[unit];
    if (raw == null || raw === '') continue;
    const num = parseFloat(raw);
    if (Number.isFinite(num) && num > 0) {
      parts.push(`${formatNumber(num)}${unit}`);
    }
  }
  return parts.join('');
}

export default function DurationInput({
  label,
  labelExtra,
  hint,
  error,
  id,
  name,
  placeholder,
  className = '',
  value,
  onChange,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [units, setUnits] = useState({});

  const rootRef = useRef(null);
  const delayRef = useRef(null);
  const repeatRef = useRef(null);

  // Beim Ändern des externen Werts internen Zustand neu initialisieren.
  useEffect(() => {
    setUnits(parseDurationToUnits(value));
  }, [value]);

  // Außenklick schließt das Dropdown.
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Escape schließt das Dropdown.
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const clearRepeat = () => {
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    if (repeatRef.current) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  };

  // Timer bei Unmount aufräumen.
  useEffect(() => clearRepeat, []);

  const increment = (unit, delta) => {
    setUnits((prev) => {
      const raw = prev[unit];
      const current = raw == null || raw === '' ? 0 : parseFloat(raw);
      const base = Number.isFinite(current) ? current : 0;
      const next = Math.max(0, base + delta);
      return { ...prev, [unit]: formatNumber(next) };
    });
  };

  // Sofort einmal, dann nach Verzögerung automatisch wiederholen (Long-Press).
  const startRepeat = (unit, delta) => {
    clearRepeat();
    increment(unit, delta);
    delayRef.current = setTimeout(() => {
      repeatRef.current = setInterval(() => increment(unit, delta), 100);
    }, 400);
  };

  const handleOk = () => {
    onChange(unitsToDuration(units));
    setOpen(false);
  };

  // Eine Einheit als Zeile: Label, Input, +1, -1, +10, -10.
  const renderUnit = (unit) => (
    <div key={unit} className="duration-input__row">
      <span className="duration-input__label">
        {t(`durationInput.units.${unit}`, { defaultValue: unit })}
      </span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        className="duration-input__field"
        value={units[unit] ?? ''}
        onChange={(e) => setUnits((prev) => ({ ...prev, [unit]: e.target.value }))}
        aria-label={t(`durationInput.units.${unit}`, { defaultValue: unit })}
      />
      <button
        type="button"
        className="duration-input__btn"
        onPointerDown={() => startRepeat(unit, 1)}
        onPointerUp={clearRepeat}
        onPointerLeave={clearRepeat}
        onPointerCancel={clearRepeat}
      >
        +1
      </button>
      <button
        type="button"
        className="duration-input__btn"
        onPointerDown={() => startRepeat(unit, -1)}
        onPointerUp={clearRepeat}
        onPointerLeave={clearRepeat}
        onPointerCancel={clearRepeat}
      >
        -1
      </button>
      <button
        type="button"
        className="duration-input__btn"
        onPointerDown={() => startRepeat(unit, 10)}
        onPointerUp={clearRepeat}
        onPointerLeave={clearRepeat}
        onPointerCancel={clearRepeat}
      >
        +10
      </button>
      <button
        type="button"
        className="duration-input__btn"
        onPointerDown={() => startRepeat(unit, -10)}
        onPointerUp={clearRepeat}
        onPointerLeave={clearRepeat}
        onPointerCancel={clearRepeat}
      >
        -10
      </button>
    </div>
  );

  const displayValue = value || placeholder || '';

  return (
    <div
      ref={rootRef}
      className={`ui-field duration-input ${error ? 'has-error' : ''} ${className}`.trim()}
    >
      {label && (
        <label className="ui-field__label" htmlFor={id || name}>
          {label}
          {labelExtra}
        </label>
      )}
      <button
        type="button"
        id={id || name}
        className={`duration-input__trigger ${open ? 'is-open' : ''}`}
        onClick={() => (open ? setOpen(false) : setOpen(true))}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className={`duration-input__value ${!value ? 'is-empty' : ''}`}>{displayValue}</span>
        <span className="duration-input__arrow" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div
          className="duration-input__panel"
          role="dialog"
          aria-label={label || t('durationInput.title', { defaultValue: 'Duration' })}
        >
          <div className="duration-input__rows">
            {DISPLAY_UNITS.map(renderUnit)}
          </div>

          <div className="duration-input__actions">
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setOpen(false)}>
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={handleOk}>
              {t('durationInput.ok', { defaultValue: 'OK' })}
            </button>
          </div>
        </div>
      )}

      {hint && !error && <span className="ui-field__hint">{hint}</span>}
      {error && <span className="ui-field__error">{error}</span>}
    </div>
  );
}
