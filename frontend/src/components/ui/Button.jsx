export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  icon: Icon,
  children,
  ...rest
}) {
  const classes = [
    'ui-btn',
    `ui-btn--${variant}`,
    size !== 'md' ? `ui-btn--${size}` : '',
    loading ? 'is-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading && <span className="ui-btn__spinner" aria-hidden="true" />}
      {Icon && <Icon size={16} className="ui-btn__icon" />}
      <span className="ui-btn__label">{children}</span>
    </button>
  );
}
