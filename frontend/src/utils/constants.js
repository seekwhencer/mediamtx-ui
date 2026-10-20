// Badge-Töne: gray, green, red, amber, blue
export const STATUS_COLORS = {
  idle: 'gray',
  read: 'green',
  publish: 'green',
  forwarding: 'green',
  running: 'green',
  online: 'green',
  available: 'green',
  enabled: 'green',
  error: 'red',
  offline: 'red',
  unavailable: 'red',
  disabled: 'gray',
};

// Übersetztes Enum-Label: enums.<name>.<value> aus locales/*.json.
// Unbekannte Werte fallen auf den rohen Wert zurück (defaultValue).
export function enumLabel(enumName, value, t) {
  const v = value ?? '–';
  return t(`enums.${enumName}.${v}`, { defaultValue: String(v) });
}
