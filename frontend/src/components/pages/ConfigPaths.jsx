import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListQuery, useMutationWithInvalidate } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import PathConfigForm from '../forms/PathConfigForm';

export default function ConfigPaths() {
  const navigate = useNavigate();
  const { page, setPage, itemsPerPage, setItemsPerPage } = usePagination();

  const list = useListQuery(QUERY_KEYS.configPaths, (p) => api.get('/config/paths/list', p), { page, itemsPerPage });

  // dialog: { mode: 'add' } | { mode: 'edit'|'replace', row } | { mode: 'delete', row }
  const [dialog, setDialog] = useState(null);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState(null);

  const addMut = useMutationWithInvalidate(
    (v) => api.post(`/config/paths/add/${encodeURIComponent(v.name)}`, v.conf),
    [QUERY_KEYS.configPaths]
  );
  const editMut = useMutationWithInvalidate(
    (v) => api.patch(`/config/paths/patch/${encodeURIComponent(v.name)}`, v.conf),
    [QUERY_KEYS.configPaths]
  );
  const replaceMut = useMutationWithInvalidate(
    (v) => api.post(`/config/paths/replace/${encodeURIComponent(v.name)}`, v.conf),
    [QUERY_KEYS.configPaths]
  );
  const deleteMut = useMutationWithInvalidate(
    (name) => api.delete(`/config/paths/delete/${encodeURIComponent(name)}`),
    [QUERY_KEYS.configPaths]
  );

  const close = () => {
    setDialog(null);
    setNewName('');
    setNameError(null);
  };

  const submitAdd = async (conf) => {
    const name = newName.trim();
    if (!name) {
      setNameError('Name is required');
      throw new Error('Name is required');
    }
    setNameError(null);
    await addMut.mutateAsync({ name, conf });
    close();
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'source', label: 'Source' },
    {
      key: 'record',
      label: 'Record',
      render: (row) => <Badge color={row.record ? 'green' : 'gray'}>{row.record ? 'on' : 'off'}</Badge>,
    },
    {
      key: 'alwaysAvailable',
      label: 'Always Available',
      render: (row) => <Badge color={row.alwaysAvailable ? 'green' : 'gray'}>{row.alwaysAvailable ? 'on' : 'off'}</Badge>,
    },
    { key: 'forward', label: 'Forward', render: (row) => (Array.isArray(row.forward) ? row.forward.length : 0) },
    { key: 'maxReaders', label: 'Max Readers' },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (row) => (
        <div className="rowactions" onClick={(e) => e.stopPropagation()}>
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
          <h2 className="page__title">Pfad-Konfigurationen</h2>
          <p className="page__subtitle">Path-CRUD: Add, Edit (PATCH), Replace (POST), Delete.</p>
        </div>
        <Button variant="primary" onClick={() => setDialog({ mode: 'add' })}>
          + Add Path
        </Button>
      </header>

      <DataTable
        columns={columns}
        data={list.data?.items}
        loading={list.isPending}
        error={list.error}
        pagination={{
          page,
          pageCount: list.data?.pageCount ?? 1,
          itemsPerPage,
          itemCount: list.data?.itemCount,
          onPageChange: setPage,
          onItemsPerPageChange: (n) => {
            setItemsPerPage(n);
            setPage(0);
          },
        }}
        onRowClick={(row) => navigate(`/config/paths/${encodeURIComponent(row.name)}`)}
        emptyMessage="No paths configured"
      />

      <Modal title="Add Path" isOpen={dialog?.mode === 'add'} onClose={close}>
        <div className="formdialog">
          <Input
            label="Name"
            value={newName}
            placeholder="cam1"
            error={nameError}
            onChange={(e) => {
              setNewName(e.target.value);
              setNameError(null);
            }}
          />
          <p className="formdialog__hint">Optional: configure the path now, or later on its detail page.</p>
          <PathConfigForm key="add" initialValues={{}} onSubmit={submitAdd} submitLabel="Add" />
        </div>
      </Modal>

      <Modal
        title={`${dialog?.mode === 'edit' ? 'Edit' : 'Replace'} Path: ${dialog?.row?.name ?? ''}`}
        isOpen={dialog?.mode === 'edit' || dialog?.mode === 'replace'}
        onClose={close}
      >
        {dialog && (dialog.mode === 'edit' || dialog.mode === 'replace') && (
          <PathConfigForm
            key={`${dialog.mode}-${dialog.row.name}`}
            initialValues={(() => {
              const { name, ...conf } = dialog.row;
              return conf;
            })()}
            onSubmit={(conf) =>
              (dialog.mode === 'edit' ? editMut : replaceMut).mutateAsync({ name: dialog.row.name, conf }).then(close)
            }
            submitLabel={dialog.mode === 'edit' ? 'Save' : 'Replace'}
          />
        )}
      </Modal>

      <Modal
        title="Delete Path"
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
              onClick={() => deleteMut.mutateAsync(dialog?.row?.name).then(close)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>
          Delete path <strong>{dialog?.row?.name}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
