import { useTranslation } from 'react-i18next';
import GlobalConfigForm from '../forms/GlobalConfigForm';

export default function ConfigGlobal() {
  const { t } = useTranslation();

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">{t('pages.configGlobal.title')}</h2>
          <p className="page__subtitle">{t('pages.configGlobal.subtitle')}</p>
        </div>
      </header>
      <GlobalConfigForm />
    </div>
  );
}
