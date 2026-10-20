export default function Card({ title, value, actions, children, className = '' }) {
  const classes = ['ui-card', className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      {(title || actions) && (
        <header className="ui-card__header">
          {title && <h3 className="ui-card__title">{title}</h3>}
          {actions && <div className="ui-card__actions">{actions}</div>}
        </header>
      )}
      {value !== undefined && <div className="ui-card__value">{value}</div>}
      {children && <div className="ui-card__body">{children}</div>}
    </div>
  );
}
