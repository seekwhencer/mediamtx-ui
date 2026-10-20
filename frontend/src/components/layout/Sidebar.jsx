import { NavLink } from 'react-router-dom';
import { NAV_SECTIONS } from './navItems';

export default function Sidebar() {
  return (
    <aside className="layout__sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">MTX</span>
        <span className="sidebar__name">mediamtx ui</span>
      </div>
      <nav className="sidebar__nav" aria-label="Hauptnavigation">
        {NAV_SECTIONS.map((section) => (
          <div className="sidebar__section" key={section.label}>
            <div className="sidebar__section-label">{section.label}</div>
            <ul className="sidebar__list">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
