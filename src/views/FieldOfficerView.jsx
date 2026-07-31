import React from 'react';
import { useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import WardSelector from '../components/WardSelector.jsx';
import StatsBar from '../components/StatsBar.jsx';
import MapView from '../components/MapView.jsx';
import PropertyList from '../components/PropertyList.jsx';
import ConfidenceCard from '../components/ConfidenceCard.jsx';
import VerifyPanel from '../components/VerifyPanel.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import PageMotion from '../components/PageMotion.jsx';
import { selectSelectedProperty, selectPropertiesError } from '../Redux/slices/propertiesSlice.js';
import { selectWardsError } from '../Redux/slices/wardsSlice.js';
import './FieldOfficerView.css';

export default function FieldOfficerView() {
  const selectedProperty = useSelector(selectSelectedProperty);
  const propertiesError = useSelector(selectPropertiesError);
  const wardsError = useSelector(selectWardsError);
  const error = propertiesError || wardsError;

  return (
    <PageMotion className="officer-view">
      <div className="officer-view__map">
        <MapView />
      </div>

      <div className="officer-view__overlay">
        <div className="officer-view__toolbar glass-panel">
          <div className="officer-view__topbar">
            <h1 className="officer-view__title">Field Officer</h1>
            <WardSelector />
          </div>
          {error && (
            <div className="view-error-banner officer-view__error">
              Failed to load data: {error}
            </div>
          )}
          <StatsBar />
        </div>

        <div className="officer-view__panel glass-panel">
          <PropertyList />
          <AnimatePresence mode="wait">
            {selectedProperty && (
              <motion.div
                key={selectedProperty.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="officer-view__detail"
              >
                <ConfidenceCard />
                <VerifyPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ChatPanel />
    </PageMotion>
  );
}
