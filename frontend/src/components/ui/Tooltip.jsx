import { useId } from 'react';
import { Info } from 'lucide-react';

// Kleine Info-Tooltip-Komponente (keine externe Library).
// Rendert ein fokussierbares Info-Icon + Tooltip-Text.
// Sichtbar bei hover + focus, versteckt bei leave/blur (CSS).
// Barrierefreiheit: button aria-label = Text, Tooltip role="tooltip" via aria-describedby.
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
