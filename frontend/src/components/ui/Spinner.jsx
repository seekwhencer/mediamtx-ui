export default function Spinner({ size = 'md', label = 'Loading…', className = '' }) {
  const classes = ['ui-spinner', size !== 'md' ? `ui-spinner--${size}` : '', className].filter(Boolean).join(' ');
  return (
    <span className={classes} role="status" aria-label={label}>
      <span className="ui-spinner__sr">{label}</span>
    </span>
  );
}
