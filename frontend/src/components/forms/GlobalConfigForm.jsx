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
    // MediaMTX restarts after a global save. While the upstream
    // is unreachable (502 / upstream_unreachable), keep retrying
    // until it responds again.
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

  // A fresh load has happened when the config was successfully
  // loaded again after the save (dataUpdatedAt > save time).
  const freshLoaded = query.isSuccess && query.dataUpdatedAt > saveTimeRef.current;

  // Once the config is loaded again, reset the restarting state.
  useEffect(() => {
    if (restarting && freshLoaded) {
      restartingRef.current = false;
      setRestarting(false);
    }
  }, [restarting, freshLoaded]);

  // Until a fresh load exists after the save: show spinner +
  // hint instead of "Load failed".
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
