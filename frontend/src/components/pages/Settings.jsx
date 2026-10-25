import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { localApi, api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { useAppSettings, setAppSettings } from '../../services/appSettings';
import FormBuilder from '../forms/FormBuilder';
import { SERVER_SETTINGS_CATALOG, APP_SETTINGS_CATALOG } from '../forms/fieldCatalog';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

// Extract the port from an address like ':8888' or 'host:8888'.
function portFromAddress(address) {
  if (!address || typeof address !== 'string') return '';
  const match = address.match(/:(\d+)$/);
  return match ? match[1] : '';
}

export default function Settings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // --- Server settings (API) ---
  const { data, isPending, error } = useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: () => localApi.get('/api/settings').then((res) => res.data),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const [serverResult, setServerResult] = useState(null);

  const saveServer = useMutation({
    mutationFn: (values) => {
      const body = { ...values };
      delete body.runtimeKeys;
      delete body.restartKeys;
      // Token rule: empty = delete (FormBuilder normalizes '' → null).
      if (body.mediamtxAuthToken == null) body.mediamtxAuthToken = '';
      return localApi.patch('/api/settings', body);
    },
    onSuccess: (res) => {
      setServerResult(res.data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings });
    },
    onError: () => setServerResult(null),
  });

  // --- App settings (local) ---
  const appSettings = useAppSettings();
  const [appSaved, setAppSaved] = useState(false);

  // Fetch the MediaMTX global config to derive default base URLs.
  const { data: globalConfig, isPending: globalConfigPending } = useQuery({
    queryKey: QUERY_KEYS.globalConfig,
    queryFn: () => api.get('/config/global/get'),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Default base URLs: current browser origin + port from the MediaMTX config
  // (playbackAddress / hlsAddress). If the config address is empty, fall back
  // to the browser's current port.
  const { defaultPlaybackBaseUrl, defaultHlsBaseUrl } = useMemo(() => {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    if (!origin) return { defaultPlaybackBaseUrl: '', defaultHlsBaseUrl: '' };
    const url = new URL(origin);
    const protocol = url.protocol;
    const host = url.hostname;
    const browserPort = url.port;

    const playbackPort = portFromAddress(globalConfig?.playbackAddress) || browserPort;
    const hlsPort = portFromAddress(globalConfig?.hlsAddress) || browserPort;

    const buildUrl = (port) => {
      if (!host) return '';
      return port ? `${protocol}//${host}:${port}` : `${protocol}//${host}`;
    };

    return {
      defaultPlaybackBaseUrl: buildUrl(playbackPort),
      defaultHlsBaseUrl: buildUrl(hlsPort),
    };
  }, [globalConfig]);

  // When an app setting is empty, show the computed default in the form.
  const appInitialValues = useMemo(() => {
    const values = { ...appSettings };
    if (!values.playbackBaseUrl && defaultPlaybackBaseUrl) {
      values.playbackBaseUrl = defaultPlaybackBaseUrl;
    }
    if (!values.hlsBaseUrl && defaultHlsBaseUrl) {
      values.hlsBaseUrl = defaultHlsBaseUrl;
    }
    return values;
  }, [appSettings, defaultPlaybackBaseUrl, defaultHlsBaseUrl]);

  const saveApp = (values) => {
    setAppSettings(values);
    setAppSaved(true);
    setTimeout(() => setAppSaved(false), 3000);
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">{t('pages.settings.title')}</h2>
          <p className="page__subtitle">{t('pages.settings.subtitle')}</p>
        </div>
      </header>

      <Card title={t('pages.settings.server')}>
        <FormBuilder
          catalog={SERVER_SETTINGS_CATALOG}
          initialValues={data}
          onSubmit={(values) => saveServer.mutateAsync(values)}
          submitLabel={t('pages.settings.saveServer')}
          loading={isPending}
          loadError={error}
        />
        {serverResult && (
          <div className="settings__result">
            {serverResult.applied.map((k) => (
              <Badge key={k} color="green">{t('pages.settings.applied', { key: k })}</Badge>
            ))}
            {serverResult.restartRequired.map((k) => (
              <Badge key={k} color="amber">{t('pages.settings.restartRequired', { key: k })}</Badge>
            ))}
            {serverResult.applied.length === 0 && serverResult.restartRequired.length === 0 && (
              <span className="settings__result-none">{t('pages.settings.noChanges')}</span>
            )}
          </div>
        )}
      </Card>

      <Card title={t('pages.settings.app')}>
        <FormBuilder
          catalog={APP_SETTINGS_CATALOG}
          initialValues={globalConfigPending ? null : appInitialValues}
          onSubmit={saveApp}
          submitLabel={t('pages.settings.saveApp')}
          loading={globalConfigPending}
        />
        {appSaved && (
          <div className="settings__result">
            <Badge color="green">{t('pages.settings.appSaved')}</Badge>
          </div>
        )}
      </Card>
    </div>
  );
}
