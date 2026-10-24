import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { useMutationWithInvalidate } from '../../hooks/useApi';
import InternalUserForm from '../forms/InternalUserForm';

export default function InternalUserDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const decoded = decodeURIComponent(id || '');

  const query = useQuery({
    queryKey: QUERY_KEYS.internalUser(decoded),
    queryFn: () => api.get(`/config/internal-users/get/${encodeURIComponent(decoded)}`),
    retry: false,
  });

  const mutation = useMutationWithInvalidate(
    (values) => api.patch(`/config/internal-users/patch/${encodeURIComponent(decoded)}`, values),
    [QUERY_KEYS.internalUsers, QUERY_KEYS.internalUser(decoded)]
  );

  // id + pos are runtime fields (InternalUser schema) and do not belong in the
  // submit (AuthInternalUser schema) — filter them out before the form.
  const user = query.data
    ? (() => {
        const { id: _id, pos: _pos, ...rest } = query.data;
        return rest;
      })()
    : undefined;

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">{t('pages.internalUserDetail.title', { name: query.data?.user ?? decoded })}</h2>
          <p className="page__subtitle">
            <Link className="ui-link ui-link--icon" to="/config/internal-users">
              <ArrowLeft size={14} />
              {t('pages.internalUserDetail.allUsers')}
            </Link>
          </p>
        </div>
      </header>
      <InternalUserForm
        initialValues={user}
        loading={query.isPending}
        loadError={query.error}
        onSubmit={(values) => mutation.mutateAsync(values)}
        submitLabel={t('common.save')}
      />
    </div>
  );
}
