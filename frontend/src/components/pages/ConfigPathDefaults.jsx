import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { useMutationWithInvalidate } from '../../hooks/useApi';
import PathConfigForm from '../forms/PathConfigForm';

export default function ConfigPathDefaults() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: QUERY_KEYS.pathDefaults,
    queryFn: () => api.get('/config/path-defaults/get'),
    retry: false,
  });

  const mutation = useMutationWithInvalidate(
    (values) => api.patch('/config/path-defaults/patch', values),
    [QUERY_KEYS.pathDefaults]
  );

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">{t('pages.configPathDefaults.title')}</h2>
          <p className="page__subtitle">{t('pages.configPathDefaults.subtitle')}</p>
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
