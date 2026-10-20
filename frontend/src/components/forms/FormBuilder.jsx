import { useEffect, useMemo, useState } from 'react';
import FormField from './FormField';
import Button from '../ui/Button';
import ErrorAlert from '../ui/ErrorAlert';
import Spinner from '../ui/Spinner';
import { getGroups, validateValues, normalizeForSubmit } from './fieldCatalog';

export default function FormBuilder({
  catalog,
  initialValues,
  onSubmit,
  submitLabel = 'Save',
  loading = false,
  loadError = null,
  disabled = false,
  loadingLabel = 'Loading config…',
}) {
  const groups = useMemo(() => getGroups(catalog), [catalog]);

  // Synchron initialisieren (lazy), wenn initialValues beim Mount vorliegen
  // (Modal-Flows + SSR). Asynchrone Daten (Query) kommen über den Effect unten.
  const [values, setValues] = useState(() => (initialValues ? { ...initialValues } : null));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => new Set(groups.length ? [groups[0][0]] : []));

  // Werte initialisieren, sobald initialValues asynchron ankommen (einmalig).
  useEffect(() => {
    if (values === null && initialValues) setValues(initialValues);
  }, [initialValues, values]);

  const setValue = (name, v) => {
    setValues((prev) => ({ ...(prev || {}), [name]: v }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const toggleGroup = (group) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!values) return;
    const errs = validateValues(catalog, values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setSubmitError(null);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(normalizeForSubmit(catalog, values));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) return <ErrorAlert error={loadError} title="Load failed" />;
  if (loading || values === null) {
    return (
      <div className="table__loading">
        <Spinner label={loadingLabel} />
        <span className="table__loading-label">{loadingLabel}</span>
      </div>
    );
  }

  return (
    <form className="formbuilder" onSubmit={handleSubmit} noValidate>
      {groups.map(([group, fields]) => (
        <details key={group} className="formbuilder__group" open={openGroups.has(group)}>
          <summary
            className="formbuilder__group-title"
            onClick={(e) => {
              e.preventDefault();
              toggleGroup(group);
            }}
          >
            <span>{group}</span>
            <span className="formbuilder__group-count">{fields.length}</span>
          </summary>
          <div className="formbuilder__fields">
            {fields.map((field) => (
              <FormField
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={(v) => setValue(field.name, v)}
                error={errors[field.name]}
              />
            ))}
          </div>
        </details>
      ))}
      <div className="formbuilder__actions">
        {saved && <span className="formbuilder__saved">Saved ✓</span>}
        <Button type="submit" variant="primary" loading={submitting} disabled={disabled}>
          {submitLabel}
        </Button>
      </div>
      {submitError && <ErrorAlert error={submitError} title="Save failed" />}
    </form>
  );
}
