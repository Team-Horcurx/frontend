import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useSelector } from 'react-redux';
import { selectNdbiGrid, selectNdbiLegend } from '../Redux/slices/ndbiSlice.js';

const FALLBACK_COLOR = '#28a745';

export default function NdbiHeatmapLayer({ visible }) {
  const map = useMap();
  const grid = useSelector(selectNdbiGrid);
  const legend = useSelector(selectNdbiLegend);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    const layer = new google.maps.Data({ map });
    layerRef.current = layer;
    return () => {
      layer.setMap(null);
      layerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    layer.forEach((f) => layer.remove(f));
    if (!visible || !grid) return;

    layer.addGeoJson(grid);
    layer.setStyle((feature) => {
      const bucket = feature.getProperty('bucket');
      const color = legend?.[bucket]?.color ?? FALLBACK_COLOR;
      return {
        fillColor: color,
        fillOpacity: 0.45,
        strokeWeight: 0,
        clickable: false,
      };
    });
  }, [map, grid, legend, visible]);

  return null;
}
