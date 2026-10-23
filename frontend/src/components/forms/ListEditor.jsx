import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import Button from '../ui/Button';
import FormField from './FormField';

function defaultItem(schema) {
  const item = {};
  for (const f of schema) {
    if (f.type === 'toggle') item[f.name] = false;
    else if (f.type === 'tags' || f.type === 'tags-number' || f.type === 'multi-select' || f.type === 'list') item[f.name] = [];
    else if (f.type === 'select') item[f.name] = (f.options?.[0] && typeof f.options[0] === 'object' ? f.options[0].value : f.options?.[0]) ?? '';
    else item[f.name] = '';
  }
  return item;
}

export default function ListEditor({ value = [], itemSchema = [], onChange, idPrefix = 'fb-list', label }) {
  const { t } = useTranslation();
  const add = () => onChange([...value, defaultItem(itemSchema)]);
  const removeAt = (i) => onChange(value.filter((_, idx) => idx !== i));
  const updateAt = (i, name, v) => onChange(value.map((item, idx) => (idx === i ? { ...item, [name]: v } : item)));

  return (
    <div className="listeditor">
      {label && <label className="ui-field__label">{label}</label>}
      {value.length === 0 && <p className="listeditor__empty">{t('form.noEntries')}</p>}
      {value.map((item, i) => (
        <div key={i} className="listeditor__row">
          <div className="listeditor__fields">
            {itemSchema.map((f) => (
              <FormField key={f.name} field={f} value={item[f.name]} onChange={(v) => updateAt(i, f.name, v)} idPrefix={`${idPrefix}-${i}`} />
            ))}
          </div>
          <button
            type="button"
            className="ui-btn ui-btn--danger ui-btn--sm listeditor__remove"
            onClick={() => removeAt(i)}
            aria-label={t('form.removeRow', { n: i + 1 })}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <Button type="button" className="listeditor__btn--add-row" variant="primary" icon={Plus} onClick={add}>
        {t('form.addRow')}
      </Button>
    </div>
  );
}
