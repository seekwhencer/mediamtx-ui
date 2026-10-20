import { STATUS_COLORS } from '../../utils/constants';

export default function Badge({ value, type = 'status', color, children, className = '' }) {
  const text = children !== undefined ? children : String(value ?? '–');
  const tone = color || (type === 'status' ? STATUS_COLORS[String(value).toLowerCase()] : 'gray') || 'gray';
  const classes = ['ui-badge', `ui-badge--${tone}`, className].filter(Boolean).join(' ');
  return <span className={classes}>{text}</span>;
}
