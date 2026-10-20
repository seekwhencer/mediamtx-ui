import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import ErrorAlert from '../ui/ErrorAlert';

export default function PathsCard({ data, loading, error }) {
  const items = data?.items ?? [];
  const online = items.filter((p) => p.online).length;
  const available = items.filter((p) => p.available).length;

  return (
    <Card
      title="Pfade"
      actions={<Link className="ui-link" to="/paths">Alle Pfade →</Link>}
    >
      {error ? (
        <ErrorAlert error={error} title="Pfade nicht erreichbar" />
      ) : loading ? (
        <Spinner size="sm" label="Pfade laden…" />
      ) : (
        <div className="paths-card__stats">
          <div className="paths-card__stat">
            <span className="paths-card__value">{data?.itemCount ?? '–'}</span>
            <span className="paths-card__label">Pfade gesamt</span>
          </div>
          <div className="paths-card__stat">
            <span className="paths-card__value">{online}</span>
            <span className="paths-card__label">online</span>
          </div>
          <div className="paths-card__stat">
            <span className="paths-card__value">{available}</span>
            <span className="paths-card__label">available</span>
          </div>
        </div>
      )}
    </Card>
  );
}
