import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page notfound">
      <div className="notfound__code" aria-hidden="true">404</div>
      <h2 className="page__title">Seite nicht gefunden</h2>
      <p className="page__subtitle">Der angefragte Pfad existiert nicht.</p>
      <Link to="/" className="ui-btn ui-btn--primary">
        Zurück zum Dashboard
      </Link>
    </div>
  );
}
