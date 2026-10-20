import GlobalConfigForm from '../forms/GlobalConfigForm';

export default function ConfigGlobal() {
  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h2 className="page__title">Globale Konfiguration</h2>
          <p className="page__subtitle">GlobalConf — alle globalen MediaMTX-Einstellungen.</p>
        </div>
      </header>
      <GlobalConfigForm />
    </div>
  );
}
