function optionValue(opt) {
  return typeof opt === 'object' && opt !== null ? opt.value : opt;
}

function optionLabel(opt) {
  return typeof opt === 'object' && opt !== null ? opt.label ?? String(opt.value) : String(opt);
}

export default function MultiSelect({ value = [], onChange, options = [], label, labelExtra, disabled = false, name }) {
  const toggle = (opt) => {
    const v = optionValue(opt);
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  return (
    <div className="ui-multiselect" role="group" aria-label={label}>
      {label && (
        <span className="ui-multiselect__label">
          {label}
          {labelExtra}
        </span>
      )}
      <div className="ui-multiselect__options">
        {options.map((opt) => {
          const v = optionValue(opt);
          return (
            <label key={String(v)} className="ui-multiselect__option">
              <input
                type="checkbox"
                name={name}
                value={v}
                checked={value.includes(v)}
                disabled={disabled}
                onChange={() => toggle(opt)}
              />
              <span>{optionLabel(opt)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
