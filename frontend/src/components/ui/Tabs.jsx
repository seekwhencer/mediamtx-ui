import { useState } from 'react';

export default function Tabs({ items, defaultTab = 0, className = '' }) {
  const [active, setActive] = useState(defaultTab);

  return (
    <div className={['tabs', className].filter(Boolean).join(' ')}>
      <div className="tabs__list" role="tablist">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`tabs__tab${i === active ? ' is-active' : ''}`}
            onClick={() => setActive(i)}
          >
            {it.label}
          </button>
        ))}
      </div>
      {items.map((it, i) => (
        <div
          key={it.id}
          className={`tabs__panel${i === active ? ' is-active' : ''}`}
          role="tabpanel"
          hidden={i !== active}
        >
          {it.content}
        </div>
      ))}
    </div>
  );
}
