export function formatDate(isoString) {
  if (!isoString) return '–';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return String(isoString);
  return d.toLocaleString();
}

export default formatDate;
