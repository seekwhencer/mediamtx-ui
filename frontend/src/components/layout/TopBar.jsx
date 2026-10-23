import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { titleKeyForPath } from './navItems';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'it', label: 'IT' },
];

export default function TopBar() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const refetchInterval = useAutoRefresh();

  const info = useQuery({
    queryKey: QUERY_KEYS.info,
    queryFn: () => api.get('/info'),
    refetchInterval,
    retry: false,
  });

  const status = info.isPending ? 'pending' : info.isError ? 'offline' : 'online';

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="layout__topbar">
      <h1 className="topbar__title">{t(titleKeyForPath(pathname))}</h1>
      <div className="topbar__actions">
        <Badge color={status === 'online' ? 'green' : status === 'offline' ? 'red' : 'gray'}>
          {status === 'online' ? t('topbar.online') : status === 'offline' ? t('topbar.offline') : t('topbar.connecting')}
        </Badge>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          className={refreshing ? 'is-refreshing' : ''}
          onClick={handleRefresh}
        >
          {t('topbar.refresh')}
        </Button>
        <div className="topbar__lang" role="group" aria-label={t('topbar.language')}>
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`ui-btn ui-btn--sm topbar__lang-btn${i18n.language === l.code ? ' is-active' : ''}`}
              onClick={() => changeLanguage(l.code)}
              aria-pressed={i18n.language === l.code}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
