import FormBuilder from './FormBuilder';
import { PATH_CONF_CATALOG } from './fieldCatalog';

// PathConf form (thin): data + submit come from the page.
// - Path Defaults: GET /config/path-defaults/get → PATCH /config/path-defaults/patch
// - Path Add:     initialValues={} → POST /config/paths/add/{name}
// - Path Edit:    initialValues=PathConf → PATCH /config/paths/patch/{name}
// - Path Replace: initialValues=PathConf → POST /config/paths/replace/{name}
// - Path Detail:  GET /config/paths/get/{name} → PATCH /config/paths/patch/{name}
export default function PathConfigForm({
  initialValues,
  onSubmit,
  submitLabel,
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
