import React from 'react';
import { useSelector } from 'react-redux';
import WardSelector from '../components/WardSelector.jsx';
import StatsBar from '../components/StatsBar.jsx';
import MapView from '../components/MapView.jsx';
import PropertyList from '../components/PropertyList.jsx';
import ConfidenceCard from '../components/ConfidenceCard.jsx';
import VerifyPanel from '../components/VerifyPanel.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import DemoModeBadge from '../components/DemoModeBadge.jsx';
import { selectSelectedProperty, selectPropertiesError } from '../Redux/slices/propertiesSlice.js';
import { selectWardsError } from '../Redux/slices/wardsSlice.js';
import './FieldOfficerView.css';

export default function FieldOfficerView() {
  const selectedProperty = useSelector(selectSelectedProperty);
  const propertiesError = useSelector(selectPropertiesError);
  const wardsError = useSelector(selectWardsError);
  const error = propertiesError || wardsError;

  return (
    <div className="officer-view">
      <DemoModeBadge />
      <div className="officer-view__content">
        <div className="officer-view__topbar">
          <h1 className="officer-view__title">Field Officer</h1>
          <WardSelector />
        </div>
        {error && (
          <div className="view-error-banner">
            Failed to load data: {error}
          </div>
        )}
        <StatsBar />
        <div className="officer-view__main">
          <div className="officer-view__map">
            <MapView />
          </div>
          <div className="officer-view__sidebar">
            <PropertyList />
            {selectedProperty && (
              <>
                <ConfidenceCard />
                <VerifyPanel />
              </>
            )}
          </div>
        </div>
      </div>
      <ChatPanel />
    </div>
  );
}
