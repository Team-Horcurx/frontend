import React from 'react';
import { motion } from 'framer-motion';
import { MdSatellite } from 'react-icons/md';
import './AppSplash.css';

export default function AppSplash() {
  return (
    <motion.div
      className="app-splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="app-splash__scanner" aria-hidden="true">
        <div className="app-splash__grid" />
        <div className="app-splash__scanline" />
        <span className="app-splash__corner app-splash__corner--tl" />
        <span className="app-splash__corner app-splash__corner--tr" />
        <span className="app-splash__corner app-splash__corner--bl" />
        <span className="app-splash__corner app-splash__corner--br" />
      </div>

      <div className="app-splash__label">
        <MdSatellite className="app-splash__icon" />
        <span className="app-splash__wordmark">GVMC Detection</span>
      </div>
      <span className="app-splash__hint" role="status">Preparing satellite intelligence…</span>
    </motion.div>
  );
}
