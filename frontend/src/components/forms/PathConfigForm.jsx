import FormBuilder from './FormBuilder';
import { PATH_CONF_CATALOG } from './fieldCatalog';

// PathConf-Formular (dünn): Daten + Submit kommen von der Page.
// - Path Defaults: GET /config/path-defaults/get → PATCH /config/path-defaults/patch
// - Pfad-Add:     initialValues={} → POST /config/paths/add/{name}
// - Pfad-Edit:    initialValues=PathConf → PATCH /config/paths/patch/{name}
// - Pfad-Replace: initialValues=PathConf → POST /config/paths/replace/{name}
// - Pfad-Detail:  GET /config/paths/get/{name} → PATCH /config/paths/patch/{name}
export default function PathConfigForm({
  initialValues,
  onSubmit,
  submitLabel = 'Save',
  loading = false,
  loadError = null,
  disabled = false,
}) {
  return (
    <FormBuilder
      catalog={PATH_CONF_CATALOG}
      initialValues={initialValues}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      loading={loading}
      loadError={loadError}
      disabled={disabled}
    />
  );
}
