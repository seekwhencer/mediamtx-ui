import { Link } from 'react-router-dom';
import Card from '../ui/Card';

const LINKS = [
  { to: '/config/global', label: 'Globale Konfiguration' },
  { to: '/config/path-defaults', label: 'Path Defaults' },
  { to: '/config/internal-users', label: 'Interne Benutzer' },
  { to: '/config/paths', label: 'Pfad-Konfigurationen' },
];

export default function QuickLinks() {
  return (
    <Card title="Schnellzugriff">
      <ul className="quicklinks">
        {LINKS.map((l) => (
          <li key={l.to}>
            <Link className="ui-link" to={l.to}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
