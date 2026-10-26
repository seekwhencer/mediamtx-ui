import Card from '../ui/Card';

/**
 * KPI-Karte: Label (Card-Titel), Wert (Card-Value), optional Sub (z. B. Bytes/s),
 * optional children-Slot (z. B. Sparkline).
 */
export default function MetricCard({ label, value, sub, children }) {
  return (
    <Card title={label} value={value ?? '–'}>
      {sub != null && sub !== '' && <span className="metric-card__sub">{sub}</span>}
      {children}
    </Card>
  );
}
