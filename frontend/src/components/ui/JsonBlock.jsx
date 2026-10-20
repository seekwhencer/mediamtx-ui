export default function JsonBlock({ data, title, className = '' }) {
  if (data === null || data === undefined) {
    return <span className="jsonblock__empty">–</span>;
  }

  return (
    <div className={['jsonblock', className].filter(Boolean).join(' ')}>
      {title && <div className="jsonblock__title">{title}</div>}
      <pre className="jsonblock__pre">
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </div>
  );
}
