import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutationWithInvalidate } from '../../hooks/useApi';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import InternalUserForm from '../forms/InternalUserForm';

export default function InternalUsers() {
  // Users live in the global config (authInternalUsers) — there is no
  // /config/internal-users/* endpoint. Same request as the global config page.
  const query = useQuery({
    queryKey: QUERY_KEYS.globalConfig,
    queryFn: () => api.get('/config/global/get'),
    retry: false,
  });
  const users = query.data?.authInternalUsers ?? [];

  // dialog: { mode: 'add' } | { mode: 'edit'|'replace', row } | { mode: 'delete', row }
  const [dialog, setDialog] = useState(null);

  const addMut = useMutationWithInvalidate((user) => api.post('/config/internal-users/add', user), [
    QUERY_KEYS.globalConfig,
  ]);
  const editMut = useMutationWithInvalidate(
    (v) => api.patch(`/config/internal-users/patch/${encodeURIComponent(v.id)}`, v.user),
    [QUERY_KEYS.globalConfig]
  );
  const replaceMut = useMutationWithInvalidate(
    (v) => api.post(`/config/internal-users/replace/${encodeURIComponent(v.id)}`, v.user),
    [QUERY_KEYS.globalConfig]
  );
  const deleteMut = useMutationWithInvalidate(
    (id) => api.delete(`/config/internal-users/delete/${encodeURIComponent(id)}`),
    [QUERY_KEYS.globalConfig]
  );

  const close = () => setDialog(null);

  const columns = [
    { key: 'user', label: 'User' },
    { key: 'ips', label: 'IPs', render: (row) => (Array.isArray(row.ips) && row.ips.length ? row.ips.join(', ') : '–') },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (row) =>
        Array.isArray(row.permissions) && row.permissions.length
          ? row.permissions.map((p) => `${p.action}:${p.path}`).join(', ')
          : '–',
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (row) => (
        <div className="rowactions">
          <Button variant="ghost" size="sm" onClick={() => setDialog({ mode: 'edit', row })}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDialog({ mode: 'replace', row })}>
            Replace
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDialog({ mode: 'delete', row })}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">Interne Benutzer</h2>
          <p className="page__subtitle">Interne Auth-Benutzer (authInternalUsers aus der globalen Config).</p>
        </div>
        <Button variant="primary" onClick={() => setDialog({ mode: 'add' })}>
          + Add User
        </Button>
      </header>

      <DataTable
        columns={columns}
        data={users}
        loading={query.isPending}
        error={query.error}
        emptyMessage="No internal users"
      />

      <Modal title="Add User" isOpen={dialog?.mode === 'add'} onClose={close}>
        <InternalUserForm
          key="add"
          initialValues={{}}
          onSubmit={(user) => addMut.mutateAsync(user).then(close)}
          submitLabel="Add"
        />
      </Modal>

      <Modal
        title={`${dialog?.mode === 'edit' ? 'Edit' : 'Replace'} User: ${dialog?.row?.user ?? ''}`}
        isOpen={dialog?.mode === 'edit' || dialog?.mode === 'replace'}
        onClose={close}
      >
        {dialog && (dialog.mode === 'edit' || dialog.mode === 'replace') && (
          <InternalUserForm
            key={`${dialog.mode}-${dialog.row.id}`}
            initialValues={(() => {
              const { id, pos, ...user } = dialog.row;
              return user;
            })()}
            onSubmit={(user) =>
              (dialog.mode === 'edit' ? editMut : replaceMut).mutateAsync({ id: dialog.row.id, user }).then(close)
            }
            submitLabel={dialog.mode === 'edit' ? 'Save' : 'Replace'}
          />
        )}
      </Modal>

      <Modal
        title="Delete User"
        isOpen={dialog?.mode === 'delete'}
        onClose={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMut.isPending}
              onClick={() => deleteMut.mutateAsync(dialog?.row?.id).then(close)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>
          Delete user <strong>{dialog?.row?.user}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
