export default function ErrorAlert({ error, title = 'Error' }) {
  const msg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
  const code = error?.code;
  const status = error?.status;
  const meta = [code, status ? `HTTP ${status}` : null].filter(Boolean).join(' · ');

  return (
    <div className="ui-erroralert" role="alert">
      <strong>{title}</strong>
      <span>{msg}</span>
      {meta && <code className="ui-erroralert__meta">{meta}</code>}
    </div>
  );
}
