import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { useMutationWithInvalidate } from '../../hooks/useApi';
import PathConfigForm from '../forms/PathConfigForm';

export default function ConfigPathDetail() {
  const { t } = useTranslation();
  const { name } = useParams();
  const decoded = decodeURIComponent(name || '');

  const query = useQuery({
    queryKey: QUERY_KEYS.configPath(decoded),
    queryFn: () => api.get(`/config/paths/get/${encodeURIComponent(decoded)}`),
    retry: false,
  });

  const mutation = useMutationWithInvalidate(
    (values) => api.patch(`/config/paths/patch/${encodeURIComponent(decoded)}`, values),
    [QUERY_KEYS.configPaths, QUERY_KEYS.configPath(decoded)]
  );

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">{t('pages.configPathDetail.title', { name: decoded })}</h2>
          <p className="page__subtitle">
            <Link className="ui-link" to="/config/paths">
              {t('pages.configPathDetail.allPaths')}
            </Link>
          </p>
        </div>
      </header>
      <PathConfigForm
        initialValues={query.data}
        loading={query.isPending}
        loadError={query.error}
        onSubmit={(values) => mutation.mutateAsync(values)}
        submitLabel={t('common.save')}
      />
    </div>
  );
}
