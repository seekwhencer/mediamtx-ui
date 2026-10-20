import FormBuilder from './FormBuilder';
import { INTERNAL_USER_CATALOG } from './fieldCatalog';

// InternalUser-Formular (dünn): Submit-Endpoint kommt von der Page.
// - Add:     POST   /config/internal-users/add
// - Edit:    PATCH  /config/internal-users/patch/{id}
// - Replace: POST   /config/internal-users/replace/{id}
export default function InternalUserForm({ initialValues, onSubmit, submitLabel = 'Save', disabled = false }) {
  return (
    <FormBuilder
      catalog={INTERNAL_USER_CATALOG}
      initialValues={initialValues}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      disabled={disabled}
    />
  );
}
