import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import ErrorAlert from '../ui/ErrorAlert';

export default function ProtocolCard({ title, to, metrics, error }) {
  const loading = metrics.some((m) => m.loading);

  return (
    <Card
      title={title}
      actions={to && <Link className="ui-link" to={to}>Details →</Link>}
    >
      {error ? (
        <ErrorAlert error={error} title={`${title} nicht erreichbar`} />
      ) : loading ? (
        <Spinner size="sm" label={`${title} lädt…`} />
      ) : (
        <ul className="protocol-card__metrics">
          {metrics.map((m) => (
            <li key={m.label}>
              <span className="protocol-card__label">{m.label}</span>
              <span className="protocol-card__value">{m.value ?? '–'}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
