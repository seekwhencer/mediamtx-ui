import Button from './Button';

export default function KickButton({ onKick, loading = false, label = 'Kick' }) {
  return (
    <Button variant="danger" size="sm" loading={loading} onClick={onKick}>
      {label}
    </Button>
  );
}
