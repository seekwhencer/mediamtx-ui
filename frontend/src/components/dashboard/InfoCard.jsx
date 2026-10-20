import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import ErrorAlert from '../ui/ErrorAlert';
import { formatDate } from '../../utils/formatDate';

export default function InfoCard({ info, loading, error }) {
  return (
    <Card title="Instanz">
      {error ? (
        <ErrorAlert error={error} title="MediaMTX nicht erreichbar" />
      ) : loading ? (
        <Spinner size="sm" label="Instanz lädt…" />
      ) : (
        <dl className="info-card__rows">
          <div className="info-card__row">
            <dt>Version</dt>
            <dd>{info?.version ?? '–'}</dd>
          </div>
          <div className="info-card__row">
            <dt>Startzeit</dt>
            <dd>{formatDate(info?.started)}</dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
