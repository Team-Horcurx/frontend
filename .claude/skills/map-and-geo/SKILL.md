# Map and Geo Skill

## Skill Metadata
- **Name:** map-and-geo
- **Type:** Google Maps, GeoJSON & Satellite Imagery Reference
- **Target:** GVMC Change-Detection Dashboard
- **Objective:** Build and maintain map components using @vis.gl/react-google-maps

---

## 1. Package & Setup

```bash
npm install @vis.gl/react-google-maps
```

**API key** in `.env`:
```
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

Enable in Google Cloud Console:
- Maps JavaScript API (required)
- Geocoding API (optional — only if address search is added)

**Wrap the entire app** in `src/App.jsx`:
```jsx
import { APIProvider } from '@vis.gl/react-google-maps';

<APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
  <BrowserRouter>…</BrowserRouter>
</APIProvider>
```

---

## 2. Basic Map Component

```jsx
// src/components/MapView.jsx
import React, { useEffect, useRef } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import './MapView.css';

const VIZAG_CENTER = { lat: 17.6869, lng: 83.2185 };
const VIZAG_ZOOM = 12;

export default function MapView({ geoJSON, wardBbox, onPropertySelect }) {
    return (
        <div className="map-view">
            <Map
                defaultCenter={VIZAG_CENTER}
                defaultZoom={VIZAG_ZOOM}
                mapTypeId="satellite"   // satellite imagery as default
                gestureHandling="cooperative"
                disableDefaultUI={false}
            >
                <GeoJSONLayer geoJSON={geoJSON} onPropertySelect={onPropertySelect} />
                <WardBoundsFitter bbox={wardBbox} />
            </Map>
        </div>
    );
}
```

```css
/* MapView.css */
.map-view {
    width: 100%;
    height: 100%;
    min-height: 400px;
}
```

---

## 3. GeoJSON Polygon Layer

Google Maps uses the `Data` layer (`google.maps.Data`) for GeoJSON rendering.

```jsx
// src/components/GeoJSONLayer.jsx — render inside <Map>
import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

export default function GeoJSONLayer({ geoJSON, onPropertySelect }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !geoJSON) return;

        // Add GeoJSON features to the Data layer
        map.data.addGeoJson(geoJSON);

        // Style per detection_type and confidence
        map.data.setStyle((feature) => {
            const type = feature.getProperty('detection_type');
            const conf = feature.getProperty('confidence') || 0;
            const fillOpacity = conf >= 0.8 ? 0.6 : conf >= 0.5 ? 0.4 : 0.2;

            return {
                fillColor:   type === 'new_build' ? '#dc3545' : '#ffc107',
                fillOpacity,
                strokeColor: type === 'new_build' ? '#dc3545' : '#ffc107',
                strokeWeight: 2,
                strokeOpacity: fillOpacity + 0.2,
            };
        });

        // Click handler
        const listener = map.data.addListener('click', (event) => {
            const propertyId = event.feature.getProperty('id');
            if (propertyId && onPropertySelect) onPropertySelect(propertyId);
        });

        // Cleanup on ward change (key={wardId} on GeoJSONLayer forces remount)
        return () => {
            google.maps.event.removeListener(listener);
            map.data.forEach(f => map.data.remove(f));
        };
    }, [map, geoJSON]);

    return null;
}
```

---

## 4. Choropleth (CommissionerView)

Ward boundaries colored by unassessed count:

```jsx
// src/components/ChoroplethLayer.jsx
import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

export default function ChoroplethLayer({ wardsGeoJSON, wardStats, onWardSelect }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !wardsGeoJSON) return;

        const maxCount = Math.max(
            ...Object.values(wardStats).map(w => w.unassessed_count || 0),
            1
        );

        map.data.addGeoJson(wardsGeoJSON);
        map.data.setStyle((feature) => {
            const wardId = feature.getProperty('id');
            const count = wardStats[wardId]?.unassessed_count || 0;
            const intensity = count / maxCount;

            // White → orange → red gradient
            const r = 255;
            const g = Math.round(255 * (1 - intensity * 0.8));
            const b = Math.round(255 * (1 - intensity));

            return {
                fillColor: `rgb(${r},${g},${b})`,
                fillOpacity: 0.3 + intensity * 0.5,
                strokeColor: '#666',
                strokeWeight: 1,
            };
        });

        const listener = map.data.addListener('click', (event) => {
            const wardId = event.feature.getProperty('id');
            if (wardId && onWardSelect) onWardSelect(wardId);
        });

        return () => {
            google.maps.event.removeListener(listener);
            map.data.forEach(f => map.data.remove(f));
        };
    }, [map, wardsGeoJSON, wardStats]);

    return null;
}
```

---

## 5. Ward Bounds Fitting

```jsx
// src/components/WardBoundsFitter.jsx — render inside <Map>
import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

export default function WardBoundsFitter({ bbox }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !bbox) return;
        const bounds = new google.maps.LatLngBounds(
            { lat: bbox.south, lng: bbox.west },
            { lat: bbox.north, lng: bbox.east }
        );
        map.fitBounds(bounds, { padding: 40 }); // 40px padding
    }, [map, bbox]);

    return null;
}
```

---

## 6. Before/After Satellite Toggle

Google Maps has no built-in side-by-side slider. Implement as a toggle overlay panel:

```jsx
// Floating control in MapView
const [showDetections, setShowDetections] = useState(true);

// Toggle Detection Layer visibility
useEffect(() => {
    if (!map) return;
    map.data.setStyle((feature) => ({
        ...existingStyle(feature),
        visible: showDetections,
    }));
}, [map, showDetections]);

// Floating button in JSX
<div className="map-view__toggle">
    <button
        className={`map-toggle-btn ${showDetections ? 'map-toggle-btn--active' : ''}`}
        onClick={() => setShowDetections(v => !v)}
    >
        {showDetections ? 'Hide Detections' : 'Show Detections'}
    </button>
</div>
```

For a richer 2022/2024 visual comparison, if the EC2 pipeline saves PNG imagery tiles to S3:
```jsx
// GroundOverlay for stored satellite PNG
const overlay = new google.maps.GroundOverlay(
    presignedImageUrl,
    { north: bbox.north, south: bbox.south, east: bbox.east, west: bbox.west }
);
overlay.setMap(map);
```

---

## 7. GeoJSON Fetch Pattern (Two-Step)

GeoJSON polygons come from S3 via a presigned URL:

```javascript
// src/Redux/slices/wardsSlice.js
export const fetchWardChanges = createAsyncThunk(
    'wards/fetchChanges',
    async (wardId, { rejectWithValue }) => {
        try {
            // Step 1: get presigned URL from Lambda
            const { data } = await api.get(`/api/wards/${wardId}/changes`);
            // Step 2: fetch actual GeoJSON from S3
            const res = await fetch(data.presigned_url || data.url);
            if (!res.ok) throw new Error('S3 fetch failed');
            const geoJSON = await res.json();
            return { wardId, geoJSON };
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);
```

---

## 8. Map Type Switching

```jsx
// satellite (default — shows imagery) vs roadmap vs hybrid
<Map mapTypeId="satellite" />   // pure satellite
<Map mapTypeId="hybrid" />      // satellite + road labels (recommended)
<Map mapTypeId="roadmap" />     // standard map
```

Use `hybrid` for the best experience — satellite imagery with street/ward labels visible.

---

## 9. Property Marker (Custom Pin)

```jsx
// src/components/PropertyMarker.jsx
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

export default function PropertyMarker({ property, isSelected, onClick }) {
    const isNewBuild = property.detectionType === 'new_build';

    return (
        <AdvancedMarker
            position={{ lat: property.lat, lng: property.lng }}
            onClick={() => onClick(property.id)}
        >
            <Pin
                background={isNewBuild ? '#dc3545' : '#ffc107'}
                borderColor={isSelected ? '#0d6efd' : 'white'}
                glyphColor="white"
                scale={isSelected ? 1.4 : 1.0}
            />
        </AdvancedMarker>
    );
}
```

> Use `<AdvancedMarker>` (not legacy `<Marker>`) — it is the current @vis.gl API.
> Requires `mapId` on the `<Map>` component for `AdvancedMarker` to work:
> ```jsx
> <Map mapId="gvmc-map" …>
> ```

---

## 10. Common Mistakes

| Mistake | Fix |
|---------|-----|
| `AdvancedMarker` renders nothing | Add `mapId="any-string"` to `<Map>` |
| GeoJSON polygons don't clear on ward change | Return cleanup from `useEffect` + use `key={wardId}` |
| `useMap()` returns null | Only call inside components rendered inside `<Map>` |
| Map doesn't fill container | Give `.map-view` a fixed height in CSS |
| Bounds not fitting ward | Pass correct `{ lat: south, lng: west }` / `{ lat: north, lng: east }` to `LatLngBounds` |
| `google is not defined` | Only call `new google.maps.*` inside effects that run after map is loaded |
