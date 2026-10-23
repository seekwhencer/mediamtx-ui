import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation, Trans } from 'react-i18next';
import { Plus, Pencil, RotateCw, Trash2 } from 'lucide-react';
import { useMutationWithInvalidate } from '../../hooks/useApi';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import InternalUserForm from '../forms/InternalUserForm';

export default function InternalUsers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Users come from the /config/internal-users/list endpoint, which returns
  // runtime IDs + one-based positions (needed for the detail route + mutations).
  const query = useQuery({
    queryKey: QUERY_KEYS.internalUsers,
    queryFn: () => api.get('/config/internal-users/list'),
    retry: false,
  });
  const users = query.data?.items ?? [];

  // dialog: { mode: 'add' } | { mode: 'edit'|'replace', row } | { mode: 'delete', row }
  const [dialog, setDialog] = useState(null);

  const addMut = useMutationWithInvalidate((user) => api.post('/config/internal-users/add', user), [
    QUERY_KEYS.internalUsers,
  ]);
  const editMut = useMutationWithInvalidate(
    (v) => api.patch(`/config/internal-users/patch/${encodeURIComponent(v.id)}`, v.user),
    [QUERY_KEYS.internalUsers]
  );
  const replaceMut = useMutationWithInvalidate(
    (v) => api.post(`/config/internal-users/replace/${encodeURIComponent(v.id)}`, v.user),
    [QUERY_KEYS.internalUsers]
  );
  const deleteMut = useMutationWithInvalidate(
    (id) => api.delete(`/config/internal-users/delete/${encodeURIComponent(id)}`),
    [QUERY_KEYS.internalUsers]
  );

  const close = () => setDialog(null);

  const columns = [
    { key: 'user', label: t('pages.internalUsers.user') },
    { key: 'ips', label: t('pages.internalUsers.ips'), render: (row) => (Array.isArray(row.ips) && row.ips.length ? row.ips.join(', ') : '–') },
    {
      key: 'permissions',
      label: t('pages.internalUsers.permissions'),
      render: (row) =>
        Array.isArray(row.permissions) && row.permissions.length
          ? row.permissions.map((p) => `${p.action}:${p.path}`).join(', ')
          : '–',
    },
    {
      key: 'actions',
      label: t('pages.internalUsers.actions'),
      sortable: false,
      render: (row) => (
        <div className="rowactions" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setDialog({ mode: 'edit', row })}>
            {t('common.edit')}
          </Button>
          <Button variant="ghost" size="sm" icon={RotateCw} onClick={() => setDialog({ mode: 'replace', row })}>
            {t('common.replace')}
          </Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDialog({ mode: 'delete', row })}>
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">{t('pages.internalUsers.title')}</h2>
          <p className="page__subtitle">{t('pages.internalUsers.subtitle')}</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setDialog({ mode: 'add' })}>
          {t('pages.internalUsers.addUser')}
        </Button>
      </header>

      <DataTable
        columns={columns}
        data={users}
        loading={query.isPending}
        error={query.error}
        onRowClick={(row) => navigate(`/config/internal-users/${encodeURIComponent(row.id)}`)}
        emptyMessage={t('pages.internalUsers.noUsers')}
      />

      <Modal title={t('pages.internalUsers.addUser')} isOpen={dialog?.mode === 'add'} onClose={close}>
        <InternalUserForm
          key="add"
          initialValues={{}}
          onSubmit={(user) => addMut.mutateAsync(user).then(close)}
          submitLabel={t('common.add')}
        />
      </Modal>

      <Modal
        title={
          dialog?.mode === 'edit'
            ? t('pages.internalUsers.editUser', { name: dialog?.row?.user ?? '' })
            : t('pages.internalUsers.replaceUser', { name: dialog?.row?.user ?? '' })
        }
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
            submitLabel={dialog.mode === 'edit' ? t('common.save') : t('common.replace')}
          />
        )}
      </Modal>

      <Modal
        title={t('pages.internalUsers.deleteUser')}
        isOpen={dialog?.mode === 'delete'}
        onClose={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              loading={deleteMut.isPending}
              onClick={() => deleteMut.mutateAsync(dialog?.row?.id).then(close)}
            >
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p>
          <Trans
            i18nKey="pages.internalUsers.deleteUserConfirm"
            values={{ name: dialog?.row?.user }}
          />
        </p>
      </Modal>
    </div>
  );
}
