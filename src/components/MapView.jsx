import React, { useEffect, useRef, useState } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectWardGeoJSON,
  selectGeoJSONStatus,
  selectSelectedWard,
} from '../Redux/slices/wardsSlice.js';
import { setSelectedProperty } from '../Redux/slices/propertiesSlice.js';
import { selectSelectedProperty } from '../Redux/slices/propertiesSlice.js';
import Loader from './Loader.jsx';
import NdbiHeatmapLayer from './NdbiHeatmapLayer.jsx';
import NdbiLegend from './NdbiLegend.jsx';
import './MapView.css';

const VIZAG_CENTER = { lat: 17.6869, lng: 83.2185 };
const VIZAG_ZOOM = 12;

function MapContent({ showPolygons }) {
  const map = useMap();
  const dispatch = useDispatch();
  const wardGeoJSON = useSelector(selectWardGeoJSON);
  const selectedWard = useSelector(selectSelectedWard);
  const selectedProperty = useSelector(selectSelectedProperty);
  const listenerRef = useRef(null);

  // Fit map to selected ward bbox
  useEffect(() => {
    if (!map || !selectedWard?.bbox) return;
    const { north, south, east, west } = selectedWard.bbox;
    if (north == null) return;
    const bounds = new google.maps.LatLngBounds(
      { lat: south, lng: west },
      { lat: north, lng: east }
    );
    map.fitBounds(bounds);
  }, [map, selectedWard]);

  // Render GeoJSON detection polygons
  useEffect(() => {
    if (!map) return;
    map.data.forEach((f) => map.data.remove(f));
    if (listenerRef.current) {
      google.maps.event.removeListener(listenerRef.current);
      listenerRef.current = null;
    }
    if (!wardGeoJSON || !showPolygons) return;

    map.data.addGeoJson(wardGeoJSON);
    map.data.setStyle((feature) => {
      const type = feature.getProperty('detection_type');
      const conf = feature.getProperty('confidence') || 0;
      const isSelected = feature.getProperty('id') === selectedProperty?.id;
      return {
        fillColor: type === 'new_build' ? '#dc3545' : '#ffc107',
        fillOpacity: isSelected ? 0.85 : conf >= 0.8 ? 0.6 : conf >= 0.5 ? 0.4 : 0.2,
        strokeColor: isSelected ? '#fff' : (type === 'new_build' ? '#dc3545' : '#ffc107'),
        strokeWeight: isSelected ? 3 : 2,
      };
    });

    listenerRef.current = map.data.addListener('click', (e) => {
      const id = e.feature.getProperty('id');
      if (id) dispatch(setSelectedProperty(id));
    });

    return () => {
      map.data.forEach((f) => map.data.remove(f));
      if (listenerRef.current) {
        google.maps.event.removeListener(listenerRef.current);
        listenerRef.current = null;
      }
    };
  }, [map, wardGeoJSON, showPolygons, selectedProperty?.id, dispatch]);

  return null;
}

export default function MapView({ choropleth = false, allWardsGeoJSON = null }) {
  const geoJSONStatus = useSelector(selectGeoJSONStatus);
  const [showPolygons, setShowPolygons] = useState(true);
  const [showNdbi, setShowNdbi] = useState(false);

  return (
    <div className="map-view">
      <div className="map-view__controls">
        <button
          className={`map-view__toggle ${showPolygons ? 'map-view__toggle--active' : ''}`}
          onClick={() => setShowPolygons((v) => !v)}
        >
          {showPolygons ? 'Hide' : 'Show'} Change Polygons
        </button>
        <button
          className={`map-view__toggle ${showNdbi ? 'map-view__toggle--active' : ''}`}
          onClick={() => setShowNdbi((v) => !v)}
        >
          {showNdbi ? 'Hide' : 'Show'} NDBI Heatmap
        </button>
      </div>
      {geoJSONStatus === 'loading' && (
        <div className="map-view__loading">
          <Loader size="lg" label="Loading ward data" />
          <span>Loading ward data…</span>
        </div>
      )}
      <Map
        defaultCenter={VIZAG_CENTER}
        defaultZoom={VIZAG_ZOOM}
        {...(import.meta.env.VITE_GOOGLE_MAPS_MAP_ID
          ? { mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID }
          : {})}
        gestureHandling="greedy"
        disableDefaultUI={false}
        style={{ width: '100%', height: '100%' }}
      >
        <MapContent showPolygons={showPolygons} />
        <NdbiHeatmapLayer visible={showNdbi} />
      </Map>
      {showNdbi && <NdbiLegend />}
    </div>
  );
}
