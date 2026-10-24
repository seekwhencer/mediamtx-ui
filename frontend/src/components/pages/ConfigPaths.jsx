import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Plus, Pencil, RotateCw, Trash2 } from 'lucide-react';
import { useListQuery, useMutationWithInvalidate } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { api } from '../../api/client';
import { QUERY_KEYS } from '../../services/queryKeys';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import Tooltip from '../ui/Tooltip';
import PathConfigForm from '../forms/PathConfigForm';
import { splitUrlAuth } from '../../utils/splitUrlAuth';

export default function ConfigPaths() {
  const { t } = useTranslation();
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
      const msg = t('pages.configPaths.nameRequired');
      setNameError(msg);
      throw new Error(msg);
    }
    setNameError(null);
    await addMut.mutateAsync({ name, conf });
    close();
  };

  const columns = [
    { key: 'name', label: t('pages.configPaths.name') },
    {
      key: 'source',
      label: t('pages.configPaths.source'),
      render: (row) => {
        const { url, auth } = splitUrlAuth(row.source);
        if (url == null || url === '') return '–';
        return (
          <>
            {url}
            {auth ? <Tooltip text={auth} /> : null}
          </>
        );
      },
    },
    {
      key: 'record',
      label: t('pages.configPaths.record'),
      render: (row) => <Badge color={row.record ? 'green' : 'gray'}>{row.record ? t('common.on') : t('common.off')}</Badge>,
    },
    {
      key: 'alwaysAvailable',
      label: t('pages.configPaths.alwaysAvailable'),
      render: (row) => <Badge color={row.alwaysAvailable ? 'green' : 'gray'}>{row.alwaysAvailable ? t('common.on') : t('common.off')}</Badge>,
    },
    { key: 'forward', label: t('pages.configPaths.forward'), render: (row) => (Array.isArray(row.forward) ? row.forward.length : 0) },
    { key: 'maxReaders', label: t('pages.configPaths.maxReaders') },
    {
      key: 'actions',
      label: t('pages.configPaths.actions'),
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
          <h2 className="page__title">{t('pages.configPaths.title')}</h2>
          <p className="page__subtitle">{t('pages.configPaths.subtitle')}</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setDialog({ mode: 'add' })}>
          {t('pages.configPaths.addPath')}
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
        emptyMessage={t('pages.configPaths.noPaths')}
      />

      <Modal title={t('pages.configPaths.addPathModal')} isOpen={dialog?.mode === 'add'} onClose={close}>
        <div className="formdialog">
          <Input
            label={t('pages.configPaths.name')}
            value={newName}
            placeholder="cam1"
            error={nameError}
            onChange={(e) => {
              setNewName(e.target.value);
              setNameError(null);
            }}
          />
          <p className="formdialog__hint">{t('pages.configPaths.optionalHint')}</p>
          <PathConfigForm key="add" initialValues={{}} onSubmit={submitAdd} submitLabel={t('common.add')} />
        </div>
      </Modal>

      <Modal
        title={
          dialog?.mode === 'edit'
            ? t('pages.configPaths.editPath', { name: dialog?.row?.name ?? '' })
            : t('pages.configPaths.replacePath', { name: dialog?.row?.name ?? '' })
        }
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
            submitLabel={dialog.mode === 'edit' ? t('common.save') : t('common.replace')}
          />
        )}
      </Modal>

      <Modal
        title={t('pages.configPaths.deletePath')}
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
              onClick={() => deleteMut.mutateAsync(dialog?.row?.name).then(close)}
            >
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p>
          <Trans i18nKey="pages.configPaths.deletePathConfirm" values={{ name: dialog?.row?.name }} />
        </p>
      </Modal>
    </div>
  );
}
