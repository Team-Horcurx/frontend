import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { MdSatellite } from 'react-icons/md';
import { FiMenu, FiX } from 'react-icons/fi';
import DemoModeBadge from './DemoModeBadge.jsx';
import './Navbar.css';

const NAV_LINKS = [
  { path: '/officer',      label: 'Field Officer' },
  { path: '/supervisor',   label: 'Supervisor' },
  { path: '/commissioner', label: 'Commissioner' },
  { path: '/admin',        label: 'Admin' },
];

export default function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 8);
  });

  return (
    <>
      <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <NavLink to="/" className="navbar__brand">
          <span className="navbar__brand-icon-wrap">
            <MdSatellite className="navbar__brand-icon" />
          </span>
          <span className="navbar__brand-text">GVMC</span>
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
          <button
            type="button"
            className="navbar__menu-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="navbar-backdrop"
            className="navbar__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setMenuOpen(false)}
          />
        )}
        {menuOpen && (
          <motion.div
            key="navbar-drawer"
            className="navbar__drawer glass-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {NAV_LINKS.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `navbar__drawer-link${isActive ? ' navbar__drawer-link--active' : ''}`
                }
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
