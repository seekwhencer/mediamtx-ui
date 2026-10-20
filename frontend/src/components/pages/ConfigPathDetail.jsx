import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { useMutationWithInvalidate } from '../../hooks/useApi';
import PathConfigForm from '../forms/PathConfigForm';

export default function ConfigPathDetail() {
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
          <h2 className="page__title">Pfad-Konfiguration: {decoded}</h2>
          <p className="page__subtitle">
            <Link className="ui-link" to="/config/paths">
              ← Alle Pfade
            </Link>
          </p>
        </div>
      </header>
      <PathConfigForm
        initialValues={query.data}
        loading={query.isPending}
        loadError={query.error}
        onSubmit={(values) => mutation.mutateAsync(values)}
        submitLabel="Save"
      />
    </div>
  );
}
