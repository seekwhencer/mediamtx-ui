import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import React from 'react';
import { renderToString } from 'react-dom/server';

export function renderProbe() {
  function Probe() {
    const q = useQuery({ queryKey: ['probe'], queryFn: async () => 'ok', retry: false });
    return React.createElement('div', null, 'probe:' + (q.isPending ? 'pending' : q.data));
  }
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderToString(React.createElement(QueryClientProvider, { client: qc }, React.createElement(Probe)));
}
