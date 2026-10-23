import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="page notfound">
      <div className="notfound__code" aria-hidden="true">
        <SearchX size={48} />
        404
      </div>
      <h2 className="page__title">{t('pages.notFound.title')}</h2>
      <p className="page__subtitle">{t('pages.notFound.subtitle')}</p>
      <Link to="/" className="ui-btn ui-btn--primary">
        {t('pages.notFound.backToDashboard')}
      </Link>
    </div>
  );
}
