import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { titleForPath } from './navItems';

export default function TopBar() {
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

  return (
    <header className="layout__topbar">
      <h1 className="topbar__title"></h1>
      <div className="topbar__actions">
        <Badge color={status === 'online' ? 'green' : status === 'offline' ? 'red' : 'gray'}>
          {status === 'online' ? 'online' : status === 'offline' ? 'offline' : 'verbinde…'}
        </Badge>
        <Button variant="secondary" size="sm" loading={refreshing} onClick={handleRefresh}>
          Aktualisieren
        </Button>
      </div>
    </header>
  );
}
