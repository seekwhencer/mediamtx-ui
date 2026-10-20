import Input from '../ui/Input';
import Select from '../ui/Select';
import Toggle from '../ui/Toggle';
import Slider from '../ui/Slider';
import TagInput from '../ui/TagInput';
import MultiSelect from '../ui/MultiSelect';
import ListEditor from './ListEditor';
import Markdown from '../ui/Markdown';

const FULL_WIDTH_TYPES = new Set(['list', 'multi-select']);
// Diese Typen rendern ihre eigene Fehlermeldung (via error-Prop).
const SELF_ERROR_TYPES = new Set(['text', 'password', 'number', 'duration', 'size', 'command', 'path', 'select']);

export default function FormField({ field, value, onChange, error, idPrefix = 'fb' }) {
  const id = `${idPrefix}-${field.name}`;
  const span = FULL_WIDTH_TYPES.has(field.type) ? 'formbuilder__field--full' : '';

  const renderControl = () => {
    switch (field.type) {
      case 'toggle':
        return <Toggle checked={!!value} onChange={onChange} label={field.label} id={id} name={field.name} />;
      case 'number':
        return (
          <Input
            id={id}
            name={field.name}
            label={field.label}
            type="number"
            value={value ?? ''}
            min={field.min}
            max={field.max}
            step={field.step}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            error={error}
          />
        );
      case 'slider':
        return (
          <Slider
            value={value ?? field.min ?? 0}
            onChange={onChange}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            label={field.label}
            id={id}
            name={field.name}
          />
        );
      case 'select':
        return (
          <Select
            id={id}
            name={field.name}
            label={field.label}
            value={value ?? ''}
            options={field.options || []}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            error={error}
          />
        );
      case 'multi-select':
        return (
          <MultiSelect
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
            options={field.options || []}
            label={field.label}
            name={field.name}
          />
        );
      case 'tags':
        return (
          <TagInput
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
            type="string"
            label={field.label}
            placeholder={field.placeholder}
            name={field.name}
          />
        );
      case 'tags-number':
        return (
          <TagInput
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
            type="number"
            label={field.label}
            placeholder={field.placeholder}
            name={field.name}
          />
        );
      case 'list':
        return <ListEditor value={Array.isArray(value) ? value : []} itemSchema={field.itemSchema || []} onChange={onChange} idPrefix={`${idPrefix}-${field.name}`} />;
      case 'password':
        return (
          <Input
            id={id}
            name={field.name}
            label={field.label}
            type="password"
            value={value ?? ''}
            placeholder={field.placeholder}
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
                {field.label}
              </label>
              <textarea
                id={id}
                name={field.name}
                className={`ui-input ${mono ? 'ui-input--mono' : ''}`}
                rows={6}
                value={value ?? ''}
                placeholder={field.placeholder}
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
            label={field.label}
            type="text"
            mono={mono}
            value={value ?? ''}
            placeholder={field.placeholder}
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
            label={field.label}
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
      {field.description && <Markdown text={field.description} className="formbuilder__desc" />}
      {field.restartRequired && (
        <span className="ui-badge ui-badge--amber formbuilder__restart-badge">Restart required</span>
      )}
      {renderControl()}
      {error && !selfError && <span className="ui-field__error">{error}</span>}
    </div>
  );
}
