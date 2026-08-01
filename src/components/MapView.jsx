import React, { useEffect, useRef, useState } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectWardGeoJSON,
  selectGeoJSONStatus,
  selectSelectedWard,
  selectWards,
} from '../Redux/slices/wardsSlice.js';
import { setSelectedProperty, selectProperties } from '../Redux/slices/propertiesSlice.js';
import { selectSelectedProperty } from '../Redux/slices/propertiesSlice.js';
import Loader from './Loader.jsx';
import './MapView.css';

const VIZAG_CENTER = { lat: 17.6869, lng: 83.2185 };
const VIZAG_ZOOM = 12;

function ndbiColor(delta) {
  if (delta >= 0.3) return '#c0392b';
  if (delta >= 0.2) return '#e67e22';
  if (delta >= 0.1) return '#f1c40f';
  if (delta > 0)   return '#f9e79f';
  return '#ecf0f1';
}

function MapContent({ showPolygons, choropleth, allWardsData, heatmap }) {
  const map = useMap();
  const dispatch = useDispatch();
  const wardGeoJSON = useSelector(selectWardGeoJSON);
  const selectedWard = useSelector(selectSelectedWard);
  const selectedProperty = useSelector(selectSelectedProperty);
  const wards = useSelector(selectWards);
  const properties = useSelector(selectProperties);
  const listenerRef = useRef(null);
  const choroplethLayerRef = useRef([]);
  const heatmapCirclesRef = useRef([]);

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

  // Choropleth: ward bbox rectangles colored by avg NDBI delta
  useEffect(() => {
    if (!map || !choropleth || !allWardsData?.length || !wards?.length) return;

    choroplethLayerRef.current.forEach((rect) => rect.setMap(null));
    choroplethLayerRef.current = [];

    allWardsData.forEach((wardStat) => {
      const ward = wards.find((w) => String(w.id) === String(wardStat.wardId));
      if (!ward?.bbox) return;
      const { north, south, east, west } = ward.bbox;
      if (north == null) return;

      const rect = new google.maps.Rectangle({
        bounds: { north, south, east, west },
        fillColor: ndbiColor(wardStat.avgNdbiDelta ?? 0),
        fillOpacity: 0.35,
        strokeColor: ndbiColor(wardStat.avgNdbiDelta ?? 0),
        strokeOpacity: 0.6,
        strokeWeight: 1,
        map,
      });

      const infoWindow = new google.maps.InfoWindow();
      rect.addListener('click', (e) => {
        infoWindow.setContent(
          `<div style="font-size:13px;padding:4px 6px">
            <strong>${wardStat.wardName ?? `Ward ${wardStat.wardId}`}</strong><br/>
            Avg NDBI Δ: ${(wardStat.avgNdbiDelta ?? 0).toFixed(3)}<br/>
            Max NDBI Δ: ${(wardStat.maxNdbiDelta ?? 0).toFixed(3)}<br/>
            Detections: ${wardStat.totalDetections ?? 0}
          </div>`
        );
        infoWindow.setPosition(e.latLng);
        infoWindow.open(map);
      });

      choroplethLayerRef.current.push(rect);
    });

    return () => {
      choroplethLayerRef.current.forEach((rect) => rect.setMap(null));
      choroplethLayerRef.current = [];
    };
  }, [map, choropleth, allWardsData, wards]);

  // Heatmap: one circle per property at its exact lat/lng, sized by area, colored by ndbi_delta
  useEffect(() => {
    heatmapCirclesRef.current.forEach((c) => c.setMap(null));
    heatmapCirclesRef.current = [];

    if (!map || !heatmap || !properties?.length) return;

    const infoWindow = new google.maps.InfoWindow();

    properties.forEach((prop) => {
      if (prop.lat == null || prop.lng == null) return;
      const radius = Math.max(18, Math.sqrt(prop.areaSqm ?? 100) * 2.5);
      const color = ndbiColor(prop.ndbiDelta ?? 0);
      const isSelected = prop.id === selectedProperty?.id;

      const circle = new google.maps.Circle({
        center: { lat: Number(prop.lat), lng: Number(prop.lng) },
        radius,
        fillColor: color,
        fillOpacity: isSelected ? 0.9 : 0.65,
        strokeColor: color,
        strokeOpacity: 1,
        strokeWeight: isSelected ? 2.5 : 1,
        map,
        clickable: true,
        zIndex: isSelected ? 10 : 3,
      });

      circle.addListener('click', () => {
        infoWindow.setContent(
          `<div style="font-size:13px;padding:4px 6px;min-width:160px">
            <strong>${prop.id}</strong><br/>
            NDBI Δ: <b>${(prop.ndbiDelta ?? 0).toFixed(3)}</b><br/>
            Type: ${prop.detectionType?.replace('_', ' ')}<br/>
            Area: ${prop.areaSqm ?? '—'} m²<br/>
            Year: ${prop.baselineYear ?? '?'}–${prop.comparisonYear ?? '?'}
          </div>`
        );
        infoWindow.setPosition({ lat: Number(prop.lat), lng: Number(prop.lng) });
        infoWindow.open(map);
        dispatch(setSelectedProperty(prop.id));
      });

      heatmapCirclesRef.current.push(circle);
    });

    return () => {
      heatmapCirclesRef.current.forEach((c) => c.setMap(null));
      heatmapCirclesRef.current = [];
      infoWindow.close();
    };
  }, [map, heatmap, properties, selectedProperty?.id, dispatch]);

  return null;
}

export default function MapView({ choropleth = false, allWardsData = null, heatmap = false }) {
  const geoJSONStatus = useSelector(selectGeoJSONStatus);
  const [showPolygons, setShowPolygons] = useState(true);

  return (
    <div className="map-view">
      {/* Hide/Show Change Polygons button — commented out until GeoJSON is uploaded to S3
      {!choropleth && (
        <div className="map-view__controls">
          <button
            className={`map-view__toggle ${showPolygons ? 'map-view__toggle--active' : ''}`}
            onClick={() => setShowPolygons((v) => !v)}
          >
            {showPolygons ? 'Hide' : 'Show'} Change Polygons
          </button>
        </div>
      )}
      */}
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
        <MapContent
          showPolygons={showPolygons}
          choropleth={choropleth}
          allWardsData={allWardsData}
          heatmap={heatmap}
        />
      </Map>
      {(choropleth || heatmap) && (
        <div className="map-view__legend">
          <div className="map-view__legend-title">
            {choropleth ? 'NDBI Activity' : 'NDBI Delta'}
          </div>
          <div className="map-view__legend-item">
            <span className="map-view__legend-swatch map-view__legend-swatch--high" />
            <span>≥0.30 High</span>
          </div>
          <div className="map-view__legend-item">
            <span className="map-view__legend-swatch map-view__legend-swatch--moderate" />
            <span>≥0.20 Moderate</span>
          </div>
          <div className="map-view__legend-item">
            <span className="map-view__legend-swatch map-view__legend-swatch--low" />
            <span>≥0.10 Low</span>
          </div>
          <div className="map-view__legend-item">
            <span className="map-view__legend-swatch map-view__legend-swatch--minimal" />
            <span>&lt;0.10 Minimal</span>
          </div>
          <div className="map-view__legend-item">
            <span className="map-view__legend-swatch map-view__legend-swatch--none" />
            <span>No data</span>
          </div>
        </div>
      )}
    </div>
  );
}
