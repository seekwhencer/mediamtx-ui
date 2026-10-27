import { useTranslation } from 'react-i18next';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Toggle from '../ui/Toggle';
import Slider from '../ui/Slider';
import TagInput from '../ui/TagInput';
import MultiSelect from '../ui/MultiSelect';
import ListEditor from './ListEditor';
import Tooltip from '../ui/Tooltip';
import { primaryColorForHue } from '../../utils/primaryColor';
import { radiusForFactor } from '../../utils/radius';

const FULL_WIDTH_TYPES = new Set(['list', 'multi-select']);
// These types render their own error message (via the error prop).
const SELF_ERROR_TYPES = new Set(['text', 'password', 'number', 'duration', 'size', 'command', 'path', 'select', 'source']);

export default function FormField({ field, value, onChange, error, idPrefix = 'fb' }) {
  const { t } = useTranslation();
  const id = `${idPrefix}-${field.name}`;
  const span = FULL_WIDTH_TYPES.has(field.type) ? 'formbuilder__field--full' : '';

  // Translated label + placeholder (labelKey/placeholderKey → i18n, otherwise raw).
  const label = field.labelKey ? t(field.labelKey, { defaultValue: field.label }) : field.label;
  const placeholder = field.placeholderKey
    ? t(field.placeholderKey, { defaultValue: field.placeholder })
    : field.placeholder;

  // Tooltip text (descriptionKey → i18n, otherwise the raw description as fallback).
  const tooltipText = field.descriptionKey
    ? t(field.descriptionKey, { defaultValue: field.description })
    : field.description;
  const labelExtra = tooltipText ? <Tooltip text={tooltipText} /> : null;

  const renderControl = () => {
    switch (field.type) {
      case 'toggle':
        return <Toggle checked={!!value} onChange={onChange} label={label} labelExtra={labelExtra} id={id} name={field.name} />;
      case 'number':
        return (
          <Input
            id={id}
            name={field.name}
            label={label}
            labelExtra={labelExtra}
            type="number"
            value={value ?? ''}
            min={field.min}
            max={field.max}
            step={field.step}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            error={error}
          />
        );
      case 'slider': {
        let previewStyle;
        if (field.colorPreview) {
          const color = primaryColorForHue(value);
          if (color) previewStyle = { backgroundColor: color };
        } else if (field.radiusPreview) {
          const radius = radiusForFactor(value);
          if (radius) previewStyle = { borderRadius: radius };
        }
        return (
          <Slider
            value={value ?? field.min ?? 0}
            onChange={onChange}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            label={label}
            labelExtra={labelExtra}
            id={id}
            name={field.name}
            previewStyle={previewStyle}
          />
        );
      }
      case 'select':
        return (
          <Select
            id={id}
            name={field.name}
            label={label}
            labelExtra={labelExtra}
            value={value ?? ''}
            options={field.options || []}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            error={error}
          />
        );
      case 'source': {
        // source = freier String (URL) ODER einer der festen Werte.
        // Select-Wert wird aus dem source-Wert abgeleitet:
        //   fester Wert → dieser Wert, sonst → 'url' (Inputfeld sichtbar).
        const SPECIAL_SOURCE_VALUES = ['publisher', 'rpiCamera', 'redirect'];
        const isSpecial = SPECIAL_SOURCE_VALUES.includes(value);
        const selectValue = isSpecial ? value : 'url';
        const inputValue = isSpecial ? '' : (value ?? '');

        const handleSelectChange = (e) => {
          const v = e.target.value;
          if (v === 'url') {
            // Zu "Url" wechseln: fester Wert → leeren, sonst aktuellen String behalten.
            onChange(SPECIAL_SOURCE_VALUES.includes(value) ? '' : (value ?? ''));
          } else {
            onChange(v);
          }
        };

        const sourceOptions = [
          { value: 'url', label: t('enums.sourceMode.url', { defaultValue: 'Url' }) },
          { value: 'publisher', label: t('enums.sourceMode.publisher', { defaultValue: 'publisher' }) },
          { value: 'rpiCamera', label: t('enums.sourceMode.rpiCamera', { defaultValue: 'rpiCamera' }) },
          { value: 'redirect', label: t('enums.sourceMode.redirect', { defaultValue: 'redirect' }) },
        ];

        return (
          <>
            <Select
              id={id}
              name={field.name}
              label={label}
              labelExtra={labelExtra}
              value={selectValue}
              options={sourceOptions}
              onChange={handleSelectChange}
              error={error}
            />
            {selectValue === 'url' && (
              <Input
                id={`${id}-url`}
                name={`${field.name}-url`}
                label={t('fields.sourceUrl', { defaultValue: 'URL' })}
                type="text"
                mono
                value={inputValue}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
              />
            )}
          </>
        );
      }
      case 'multi-select':
        return (
          <MultiSelect
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
            options={field.options || []}
            label={label}
            labelExtra={labelExtra}
            name={field.name}
          />
        );
      case 'tags':
        return (
          <TagInput
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
            type="string"
            label={label}
            labelExtra={labelExtra}
            placeholder={placeholder}
            name={field.name}
          />
        );
      case 'tags-number':
        return (
          <TagInput
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
            type="number"
            label={label}
            labelExtra={labelExtra}
            placeholder={placeholder}
            name={field.name}
          />
        );
      case 'list':
        return <ListEditor value={Array.isArray(value) ? value : []} itemSchema={field.itemSchema || []} onChange={onChange} idPrefix={`${idPrefix}-${field.name}`} label={label} />;
      case 'password':
        return (
          <Input
            id={id}
            name={field.name}
            label={label}
            labelExtra={labelExtra}
            type="password"
            value={value ?? ''}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            error={error}
          />
        );
      case 'text':
      case 'duration':
      case 'size':
      case 'command':
      case 'path': {
        const mono = ['command', 'path', 'duration', 'size'].includes(field.type);
        if (field.multiline) {
          return (
            <div className={`ui-field ${error ? 'has-error' : ''}`.trim()}>
              <label className="ui-field__label" htmlFor={id}>
                {label}
                {labelExtra}
              </label>
              <textarea
                id={id}
                name={field.name}
                className={`ui-input ${mono ? 'ui-input--mono' : ''}`}
                rows={6}
                value={value ?? ''}
                placeholder={placeholder}
                aria-invalid={error ? true : undefined}
                onChange={(e) => onChange(e.target.value)}
              />
            </div>
          );
        }
        return (
          <Input
            id={id}
            name={field.name}
            label={label}
            labelExtra={labelExtra}
            type="text"
            mono={mono}
            value={value ?? ''}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            error={error}
          />
        );
      }
      default:
        return (
          <Input
            id={id}
            name={field.name}
            label={label}
            labelExtra={labelExtra}
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            error={error}
          />
        );
    }
  };

  const selfError = SELF_ERROR_TYPES.has(field.type) && !field.multiline;

  return (
    <div className={`formbuilder__field ${span}`.trim()}>
      {field.restartRequired && (
        <span className="ui-badge ui-badge--amber formbuilder__restart-badge">{t('form.restartRequired')}</span>
      )}
      {renderControl()}
      {error && !selfError && <span className="ui-field__error">{error}</span>}
    </div>
  );
}
