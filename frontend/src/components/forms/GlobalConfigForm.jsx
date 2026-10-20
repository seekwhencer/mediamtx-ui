import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { useMutationWithInvalidate } from '../../hooks/useApi';
import FormBuilder from './FormBuilder';
import { GLOBAL_CONF_CATALOG } from './fieldCatalog';

export default function GlobalConfigForm() {
  const { t } = useTranslation();
  const [restarting, setRestarting] = useState(false);
  const restartingRef = useRef(false);
  const saveTimeRef = useRef(0);

  const markRestarting = () => {
    saveTimeRef.current = Date.now();
    restartingRef.current = true;
    setRestarting(true);
  };

  const query = useQuery({
    queryKey: QUERY_KEYS.globalConfig,
    queryFn: () => api.get('/config/global/get'),
    // MediaMTX startet nach einem Global-Save neu. Solange der Upstream
    // nicht erreichbar ist (502 / upstream_unreachable), immer wieder
    // versuchen, bis er wieder antwortet.
    retry: (failureCount, error) => {
      const upstreamDown = error?.code === 'upstream_unreachable' || error?.status === 502;
      return restartingRef.current && upstreamDown && failureCount < 500;
    },
    retryDelay: () => 2000,
  });

  const mutation = useMutationWithInvalidate(
    async (values) => {
      await api.patch('/config/global/patch', values);
      markRestarting();
    },
    [QUERY_KEYS.globalConfig]
  );

  // Ein frisches Laden liegt vor, wenn die Config nach dem Save erneut
  // erfolgreich geladen wurde (dataUpdatedAt > Save-Zeitpunkt).
  const freshLoaded = query.isSuccess && query.dataUpdatedAt > saveTimeRef.current;

  // Sobald die Config wieder geladen ist, Restart-Zustand zurücksetzen.
  useEffect(() => {
    if (restarting && freshLoaded) {
      restartingRef.current = false;
      setRestarting(false);
    }
  }, [restarting, freshLoaded]);

  // Solange nach dem Save noch kein frisches Laden vorliegt: Spinner +
  // Hinweis statt "Load failed" zeigen.
  const showRestarting = restarting && !freshLoaded;

  return (
    <FormBuilder
      catalog={GLOBAL_CONF_CATALOG}
      initialValues={query.data}
      loading={query.isPending || showRestarting}
      loadError={showRestarting ? null : query.error}
      loadingLabel={showRestarting ? t('form.mediamtxRestarting') : t('form.loadingConfig')}
      onSubmit={(values) => mutation.mutateAsync(values)}
      submitLabel={t('common.save')}
    />
  );
}
