import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdSatellite } from 'react-icons/md';
import DemoModeBadge from './DemoModeBadge.jsx';
import './Navbar.css';

const NAV_LINKS = [
  { path: '/officer',      label: 'Field Officer' },
  { path: '/supervisor',   label: 'Supervisor' },
  { path: '/commissioner', label: 'Commissioner' },
  { path: '/admin',        label: 'Admin' },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__brand">
        <MdSatellite className="navbar__brand-icon" />
        <span className="navbar__brand-text">GVMC Detection</span>
      </NavLink>

      <div className="navbar__links">
        {NAV_LINKS.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `navbar__link${isActive ? ' navbar__link--active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="navbar-active-pill"
                    className="navbar__active-pill"
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}
                <span className="navbar__link-label">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="navbar__end">
        <DemoModeBadge />
      </div>
    </nav>
  );
}
