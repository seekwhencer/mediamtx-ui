import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localApi } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { useAppSettings, setAppSettings } from '../../services/appSettings';
import FormBuilder from '../forms/FormBuilder';
import { SERVER_SETTINGS_CATALOG, APP_SETTINGS_CATALOG } from '../forms/fieldCatalog';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function Settings() {
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
          <h2 className="page__title">Einstellungen</h2>
          <p className="page__subtitle">
            Server-Settings (persistiert, API) und App-Settings (dieser Browser, localStorage).
          </p>
        </div>
      </header>

      <Card title="Server">
        <FormBuilder
          catalog={SERVER_SETTINGS_CATALOG}
          initialValues={data}
          onSubmit={(values) => saveServer.mutateAsync(values)}
          submitLabel="Server speichern"
          loading={isPending}
          loadError={error}
        />
        {serverResult && (
          <div className="settings__result">
            {serverResult.applied.map((k) => (
              <Badge key={k} color="green">{k} — angewendet</Badge>
            ))}
            {serverResult.restartRequired.map((k) => (
              <Badge key={k} color="amber">{k} — Restart erforderlich</Badge>
            ))}
            {serverResult.applied.length === 0 && serverResult.restartRequired.length === 0 && (
              <span className="settings__result-none">Keine Änderungen.</span>
            )}
          </div>
        )}
      </Card>

      <Card title="App (dieser Browser)">
        <FormBuilder
          catalog={APP_SETTINGS_CATALOG}
          initialValues={appSettings}
          onSubmit={saveApp}
          submitLabel="App speichern"
        />
        {appSaved && (
          <div className="settings__result">
            <Badge color="green">App-Settings gespeichert</Badge>
          </div>
        )}
      </Card>
    </div>
  );
}
