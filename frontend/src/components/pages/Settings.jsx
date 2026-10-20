import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { localApi } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { useAppSettings, setAppSettings } from '../../services/appSettings';
import FormBuilder from '../forms/FormBuilder';
import { SERVER_SETTINGS_CATALOG, APP_SETTINGS_CATALOG } from '../forms/fieldCatalog';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function Settings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // --- Server-Settings (API) ---
  const { data, isPending, error } = useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: () => localApi.get('/api/settings'),
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
      // Token-Regel: leer = löschen (FormBuilder normalisiert '' → null).
      if (body.mediamtxAuthToken == null) body.mediamtxAuthToken = '';
      return localApi.patch('/api/settings', body);
    },
    onSuccess: (res) => {
      setServerResult(res.data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings });
    },
    onError: () => setServerResult(null),
  });

  // --- App-Settings (lokal) ---
  const appSettings = useAppSettings();
  const [appSaved, setAppSaved] = useState(false);

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
          initialValues={appSettings}
          onSubmit={saveApp}
          submitLabel={t('pages.settings.saveApp')}
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
