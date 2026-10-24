import FormBuilder from './FormBuilder';
import { INTERNAL_USER_CATALOG } from './fieldCatalog';

// InternalUser form (thin): data + submit come from the page.
// - Add:     POST   /config/internal-users/add
// - Edit:    PATCH  /config/internal-users/patch/{id}
// - Replace: POST   /config/internal-users/replace/{id}
// - Detail:  GET    /config/internal-users/get/{id} → PATCH /config/internal-users/patch/{id}
export default function InternalUserForm({
  initialValues,
  onSubmit,
  submitLabel,
  loading = false,
  loadError = null,
  disabled = false,
}) {
  return (
    <FormBuilder
      catalog={INTERNAL_USER_CATALOG}
      initialValues={initialValues}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      loading={loading}
      loadError={loadError}
      disabled={disabled}
    />
  );
}
