import { useId } from 'react';
import { Info } from 'lucide-react';

// Small info tooltip component (no external library).
// Renders a focusable info icon + tooltip text.
// Visible on hover + focus, hidden on leave/blur (CSS).
// Accessibility: button aria-label = text, tooltip role="tooltip" via aria-describedby.
export default function Tooltip({ text }) {
  const id = useId();
  if (!text) return null;
  return (
    <span className="ui-tooltip">
      <button
        type="button"
        className="ui-tooltip__trigger"
        aria-label={text}
        aria-describedby={id}
        onClick={(e) => e.stopPropagation()}
      >
        <Info size={14} />
      </button>
      <span className="ui-tooltip__content" role="tooltip" id={id}>
        {text}
      </span>
    </span>
  );
}
