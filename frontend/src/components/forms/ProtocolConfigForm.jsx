import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { useMutationWithInvalidate } from '../../hooks/useApi';
import { useProtocolEnabled } from '../../hooks/useProtocolEnabled';
import FormBuilder from './FormBuilder';
import { GLOBAL_CONF_CATALOG } from './fieldCatalog';

const PROTOCOL_GROUPS = {
  hls: 'HLS',
  moq: 'MoQ',
  rtmp: 'RTMP',
  rtsp: 'RTSP',
  srt: 'SRT',
  webrtc: 'WebRTC',
};

export default function ProtocolConfigForm({ protocol }) {
  const { t } = useTranslation();
  const enabled = useProtocolEnabled(protocol);
  const group = PROTOCOL_GROUPS[protocol];

  const catalog = useMemo(
    () => GLOBAL_CONF_CATALOG.filter((f) => f.group === group),
    [group]
  );

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

  const freshLoaded = query.isSuccess && query.dataUpdatedAt > saveTimeRef.current;

  useEffect(() => {
    if (restarting && freshLoaded) {
      restartingRef.current = false;
      setRestarting(false);
    }
  }, [restarting, freshLoaded]);

  const showRestarting = restarting && !freshLoaded;

  return (
    <FormBuilder
      catalog={catalog}
      initialValues={query.data}
      loading={query.isPending || showRestarting}
      loadError={showRestarting ? null : query.error}
      loadingLabel={showRestarting ? t('form.mediamtxRestarting') : t('form.loadingConfig')}
      onSubmit={(values) => mutation.mutateAsync(values)}
      submitLabel={t('common.save')}
      collapsible
      initialOpen={!enabled}
    />
  );
}
