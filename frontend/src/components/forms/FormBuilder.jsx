import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, CircleCheckBig, Settings } from 'lucide-react';
import FormField from './FormField';
import Button from '../ui/Button';
import ErrorAlert from '../ui/ErrorAlert';
import Spinner from '../ui/Spinner';
import { getGroups, validateValues, normalizeForSubmit } from './fieldCatalog';

export default function FormBuilder({
  catalog,
  initialValues,
  onSubmit,
  submitLabel,
  loading = false,
  loadError = null,
  disabled = false,
  loadingLabel,
  collapsible = false,
  initialOpen = true,
}) {
  const { t } = useTranslation();
  if (submitLabel == null) submitLabel = t('common.save');
  if (loadingLabel == null) loadingLabel = t('form.loadingConfig');
  const groups = useMemo(() => getGroups(catalog), [catalog]);
  const [collapsibleOpen, setCollapsibleOpen] = useState(initialOpen);
  const userInteractedRef = useRef(false);

  // Sync the collapsible state with the initialOpen prop until the user
  // interacts (e.g. the enabled state resolves asynchronously after mount).
  useEffect(() => {
    if (!userInteractedRef.current) setCollapsibleOpen(initialOpen);
  }, [initialOpen]);

  // Initialize synchronously (lazy) when initialValues are present at mount
  // (modal flows + SSR). Async data (query) arrives via the effect below.
  const [values, setValues] = useState(() => (initialValues ? { ...initialValues } : null));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => new Set(groups.length ? [groups[0][0]] : []));
  const [scrollToken, setScrollToken] = useState(0);
  const scrollTargetRef = useRef(null);

  // Initialize values once initialValues arrive asynchronously (one-time).
  useEffect(() => {
    if (values === null && initialValues) setValues(initialValues);
  }, [initialValues, values]);

  // After clicking a subnav group: the group is open → scroll smoothly to it.
  useEffect(() => {
    if (scrollToken === 0) return;
    const group = scrollTargetRef.current;
    if (group == null) return;
    const el = document.querySelector(`.formbuilder__group[data-group="${CSS.escape(group)}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [scrollToken]);

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

  // Subnav: open the group and mark it as the scroll target.
  const openGroup = (group) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.add(group);
      return next;
    });
    scrollTargetRef.current = group;
    setScrollToken((n) => n + 1);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!values) return;
    const errs = validateValues(catalog, values, t);
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

  if (loadError) return <ErrorAlert error={loadError} title={t('form.loadFailed')} />;
  if (loading || values === null) {
    return (
      <div className="table__loading">
        <Spinner label={loadingLabel} />
        <span className="table__loading-label">{loadingLabel}</span>
      </div>
    );
  }

  const renderFields = (fields) => (
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
  );

  const actions = (
    <div className="formbuilder__actions">
      {saved && (
        <span className="formbuilder__saved">
          <CircleCheckBig size={14} />
          {t('form.saved')}
        </span>
      )}
      <Button type="submit" variant="primary" icon={Save} loading={submitting} disabled={disabled}>
        {submitLabel}
      </Button>
    </div>
  );

  // Single group (e.g. internal user): no subnav, no summary,
  // always expanded — just the fields in one card.
  if (groups.length === 1) {
    const [group, fields] = groups[0];

    if (collapsible) {
      return (
        <form className="formbuilder" onSubmit={handleSubmit} noValidate>
          <Button
            variant="secondary"
            icon={Settings}
            className={`formbuilder__settings-toggle${collapsibleOpen ? ' is-open' : ''}`}
            onClick={() => {
              userInteractedRef.current = true;
              setCollapsibleOpen((o) => !o);
            }}
          >
            {t('form.settings')}
          </Button>
          {collapsibleOpen && (
            <>
              <div className="formbuilder__group">{renderFields(fields)}</div>
              {actions}
            </>
          )}
          {submitError && <ErrorAlert error={submitError} title={t('form.saveFailed')} />}
        </form>
      );
    }

    return (
      <form className="formbuilder" onSubmit={handleSubmit} noValidate>
        <div className="formbuilder__group">{renderFields(fields)}</div>
        {actions}
        {submitError && <ErrorAlert error={submitError} title={t('form.saveFailed')} />}
      </form>
    );
  }

  return (
    <>
      <nav className="formbuilder__subnav" aria-label={t('form.groupsNav')}>
        {groups.map(([group]) => (
          <button
            key={group}
            type="button"
            className={`formbuilder__subnav-btn${openGroups.has(group) ? ' is-active' : ''}`}
            onClick={() => openGroup(group)}
          >
            {t(`groups.${group}`, { defaultValue: group })}
          </button>
        ))}
      </nav>
      <form className="formbuilder" onSubmit={handleSubmit} noValidate>
        {groups.map(([group, fields]) => (
          <details key={group} className="formbuilder__group" data-group={group} open={openGroups.has(group)}>
            <summary
              className="formbuilder__group-title"
              onClick={(e) => {
                e.preventDefault();
                toggleGroup(group);
              }}
            >
              <span>{t(`groups.${group}`, { defaultValue: group })}</span>
              <span className="formbuilder__group-count">{fields.length}</span>
            </summary>
            {renderFields(fields)}
          </details>
        ))}
        {actions}
        {submitError && <ErrorAlert error={submitError} title={t('form.saveFailed')} />}
      </form>
    </>
  );
}
