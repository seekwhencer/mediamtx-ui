import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import Button from './Button';

export default function KickButton({ onKick, loading = false, label }) {
  const { t } = useTranslation();
  return (
    <Button variant="danger" size="sm" icon={LogOut} loading={loading} onClick={onKick}>
      {label ?? t('common.kick')}
    </Button>
  );
}
