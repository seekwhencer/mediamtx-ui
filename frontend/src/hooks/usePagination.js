import { useState } from 'react';
import { getAppSettings } from '../services/appSettings';

export function usePagination(defaultItemsPerPage) {
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(
    defaultItemsPerPage ?? getAppSettings().itemsPerPage
  );
  return { page, setPage, itemsPerPage, setItemsPerPage };
}
