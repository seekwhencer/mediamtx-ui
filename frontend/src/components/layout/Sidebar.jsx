import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV_SECTIONS } from './navItems';

export default function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="layout__sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">MTX</span>
        <span className="sidebar__name">mediamtx ui</span>
      </div>
      <nav className="sidebar__nav" aria-label={t('nav.overview')}>
        {NAV_SECTIONS.map((section) => (
          <div className="sidebar__section" key={section.labelKey}>
            <div className="sidebar__section-label">{t(section.labelKey)}</div>
            <ul className="sidebar__list">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
                    >
                      {Icon && <Icon size={16} className="sidebar__link-icon" />}
                      <span className="sidebar__link-label">{t(item.labelKey)}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
