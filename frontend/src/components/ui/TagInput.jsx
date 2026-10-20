import { useState } from 'react';

export default function TagInput({ value = [], onChange, type = 'string', label, placeholder, disabled = false, id, name }) {
  const [draft, setDraft] = useState('');

  const commit = (raw) => {
    const parts = String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const part of parts) {
      if (type === 'number') {
        const n = Number(part);
        if (Number.isFinite(n) && !next.includes(n)) next.push(n);
      } else if (!next.includes(part)) {
        next.push(part);
      }
    }
    onChange(next);
    setDraft('');
  };

  const removeAt = (index) => onChange(value.filter((_, i) => i !== index));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      removeAt(value.length - 1);
    }
  };

  return (
    <div className="ui-taginput">
      {label && (
        <label className="ui-taginput__label" htmlFor={id || name}>
          {label}
        </label>
      )}
      <div className="ui-taginput__box">
        {value.map((tag, i) => (
          <span key={`${tag}-${i}`} className="ui-taginput__pill">
            {String(tag)}
            <button
              type="button"
              className="ui-taginput__remove"
              onClick={() => removeAt(i)}
              aria-label={`Remove ${tag}`}
              disabled={disabled}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          name={name}
          className="ui-taginput__input"
          value={draft}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
        />
      </div>
    </div>
  );
}
