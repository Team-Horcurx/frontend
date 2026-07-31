# Writing Test Cases Skill

## Skill Metadata
- **Name:** writing-test-cases
- **Type:** Testing Patterns & Reference
- **Target:** GVMC Change-Detection Dashboard
- **Objective:** Write meaningful, self-contained tests for GVMC components and Redux slices

---

## 1. Testing Stack

All packages in `package.json` — no installation needed:

| Package | Purpose |
|---------|---------|
| `vitest` | Test runner (globals auto-imported — no import needed) |
| `@testing-library/react` | Render React components |
| `@testing-library/user-event` | Simulate user interactions (v14 — all async: `await userEvent.click()`) |
| `@testing-library/jest-dom` | Custom matchers (`toBeInTheDocument`, etc.) |

> Vitest globals (`describe`, `it`, `test`, `expect`, `vi`) are auto-imported.
> Use `vi.mock(...)` instead of `jest.mock(...)`.

---

## 2. Running Tests

```bash
npm run test                                   # single run
npm run test:watch                             # watch mode
npm run test -- --coverage                     # with coverage
npm run test -- ConfidenceCard                 # single test file by name
npm run test -- -t "renders verification"      # by test name
```

---

## 3. Folder Structure

```
src/
└── tests/
    ├── slices/
    │   ├── PropertiesSliceFetchMapping.test.js
    │   ├── PropertiesSliceVerifyStatus.test.js
    │   ├── WardsSliceGeoJSONFetch.test.js
    │   └── StatsSliceAllWardsAggregation.test.js
    └── components/
        ├── ConfidenceCardSignalBreakdown.test.jsx
        ├── VerifyPanelStatusSubmit.test.jsx
        └── PropertyListFilterSorting.test.jsx
```

### Naming Rules

- File name: `{Subject}{WhatIsBeingTested}.test.js` — describes the behaviour, not a ticket
- Never include ticket/issue IDs in file names or inside test descriptions

---

## 4. No Authentication Required

Unlike the WMS platform, this project has **no authentication**. Tests do not need `loginBeforeTests` or any session setup. Redux thunks call public API endpoints directly.

```js
// No login needed — skip beforeAll(loginBeforeTests)
// afterAll(() => localStorage.clear()) is still good practice
```

---

## 5. Self-Contained Test Data

All test data defined at the top of each test file using factory functions — never import from shared payloads files.

### Standard Factories

```js
// ─── Self-Contained Test Data ─────────────────────────────────────────────────

const makeProperty = (overrides = {}) => ({
    id: `PROP-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ward_id: 1,
    lat: 17.7231,
    lng: 83.2951,
    area_sqm: 120.5,
    detection_type: 'new_build',
    confidence: 0.82,
    confidence_breakdown: {
        ndbi_delta: 0.85,
        area_delta: 0.70,
        osm_status: 1.0,
        ndvi_drop: 0.60,
        db_match: 0.0,
    },
    detected_at: '2024-03-15T10:30:00Z',
    s3_geojson_key: 'geojson/ward_1_changes.json',
    ...overrides,
});

const makeWard = (overrides = {}) => ({
    id: Math.floor(Math.random() * 98) + 1,
    name: `Ward ${Date.now()}`,
    bbox: { north: 17.8, south: 17.6, east: 83.4, west: 83.1 },
    geojson_s3: 'geojson/ward_boundary.json',
    ...overrides,
});

const makeVerificationStatus = (overrides = {}) => ({
    property_id: `PROP-${Date.now()}`,
    status: 'pending',
    updated_by: 'test-officer',
    updated_at: new Date().toISOString(),
    notes: '',
    ...overrides,
});

const makeListResponse = (items, total = items.length) => ({
    data: items,
    total,
});

const INITIAL_STATE = {
    items: [],
    selectedItem: null,
    status: 'idle',
    error: null,
    verifyStatus: 'idle',
    verifyError: null,
};
```

---

## 6. Slice Unit Test Template

```js
// src/tests/slices/PropertiesSliceFetchMapping.test.js
/**
 * Tests that the properties slice correctly maps API snake_case to UI camelCase
 * and handles the full fetch lifecycle (pending → fulfilled → failed).
 */

import propertiesReducer, {
    fetchProperties,
    verifyProperty,
    resetVerifyStatus,
    clearErrors,
} from '../../Redux/slices/propertiesSlice';

// ─── Self-Contained Test Data ─────────────────────────────────────────────────

const makeProperty = (overrides = {}) => ({
    id: `PROP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ward_id: 1,
    area_sqm: 120.5,
    detection_type: 'new_build',
    confidence: 0.82,
    confidence_breakdown: { ndbi_delta: 0.85, area_delta: 0.70 },
    detected_at: '2024-03-15T10:30:00Z',
    ...overrides,
});

const makeListResponse = (items) => ({ data: items, total: items.length });

const INITIAL_STATE = {
    items: [], selectedItem: null, status: 'idle', error: null,
    verifyStatus: 'idle', verifyError: null,
};

// ─── Initial State ────────────────────────────────────────────────────────────

describe('properties slice — initial state', () => {
    test('returns expected shape', () => {
        const state = propertiesReducer(undefined, { type: '@@INIT' });
        expect(state.items).toEqual([]);
        expect(state.status).toBe('idle');
    });
});

// ─── Fetch List ───────────────────────────────────────────────────────────────

describe('fetchProperties reducer', () => {
    test('sets loading status on pending', () => {
        const next = propertiesReducer(INITIAL_STATE, fetchProperties.pending());
        expect(next.status).toBe('loading');
    });

    test('maps API snake_case to UI camelCase on fulfilled', () => {
        const apiItem = makeProperty();
        const next = propertiesReducer(INITIAL_STATE, fetchProperties.fulfilled(makeListResponse([apiItem])));
        expect(next.status).toBe('succeeded');
        expect(next.items[0].areaSqm).toBeDefined();         // mapped from area_sqm
        expect(next.items[0].detectionType).toBeDefined();   // mapped from detection_type
        expect(next.items[0].area_sqm).toBeUndefined();      // raw snake_case should not leak
    });

    test('sets failed status and captures error on rejected', () => {
        const next = propertiesReducer(
            INITIAL_STATE,
            fetchProperties.rejected(null, '', undefined, 'Network error')
        );
        expect(next.status).toBe('failed');
        expect(next.error).toBe('Network error');
    });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('fetchProperties edge cases', () => {
    test('handles empty list response', () => {
        const next = propertiesReducer(INITIAL_STATE, fetchProperties.fulfilled(makeListResponse([])));
        expect(next.status).toBe('succeeded');
        expect(next.items).toHaveLength(0);
    });

    test('missing optional confidence_breakdown fields do not crash mapAPIToUI', () => {
        const sparse = makeProperty({ confidence_breakdown: undefined });
        const next = propertiesReducer(INITIAL_STATE, fetchProperties.fulfilled(makeListResponse([sparse])));
        expect(next.items[0]).toBeDefined();
    });
});

// ─── Verify Status ────────────────────────────────────────────────────────────

describe('verifyProperty reducer', () => {
    test('sets verifyStatus loading on pending', () => {
        const next = propertiesReducer(INITIAL_STATE, verifyProperty.pending());
        expect(next.verifyStatus).toBe('loading');
    });

    test('captures verifyError on rejected', () => {
        const next = propertiesReducer(
            INITIAL_STATE,
            verifyProperty.rejected(null, '', undefined, 'Server error')
        );
        expect(next.verifyStatus).toBe('failed');
        expect(next.verifyError).toBe('Server error');
    });
});

// ─── Reset Actions ────────────────────────────────────────────────────────────

describe('reset actions', () => {
    test('resetVerifyStatus clears verifyStatus and verifyError', () => {
        const dirty = { ...INITIAL_STATE, verifyStatus: 'failed', verifyError: 'oops' };
        const next = propertiesReducer(dirty, resetVerifyStatus());
        expect(next.verifyStatus).toBe('idle');
        expect(next.verifyError).toBeNull();
    });
});
```

---

## 7. Component Rendering Template

```jsx
// src/tests/components/ConfidenceCardSignalBreakdown.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ConfidenceCard from '../../components/ConfidenceCard';
import propertiesReducer from '../../Redux/slices/propertiesSlice';

const makeProperty = (overrides = {}) => ({
    id: `PROP-${Date.now()}`,
    areaSqm: 120.5,
    detectionType: 'new_build',
    confidence: 0.82,
    confidenceBreakdown: { ndbidelta: 0.85, areaDelta: 0.70, osmStatus: 1.0, ndviDrop: 0.60, dbMatch: 0.0 },
    aiExplanation: 'This property shows strong satellite evidence of new construction.',
    ...overrides,
});

const createTestStore = (preloadedState = {}) =>
    configureStore({
        reducer: { properties: propertiesReducer },
        preloadedState,
    });

const renderWithStore = (ui, preloadedState = {}) =>
    render(<Provider store={createTestStore(preloadedState)}>{ui}</Provider>);

describe('ConfidenceCard', () => {
    test('renders all 5 confidence signals', () => {
        const property = makeProperty();
        renderWithStore(<ConfidenceCard property={property} />);
        expect(screen.getByText(/Satellite NDBI/i)).toBeInTheDocument();
        expect(screen.getByText(/Area Expansion/i)).toBeInTheDocument();
        expect(screen.getByText(/OSM Status/i)).toBeInTheDocument();
        expect(screen.getByText(/Vegetation Drop/i)).toBeInTheDocument();
        expect(screen.getByText(/DB Match/i)).toBeInTheDocument();
    });

    test('renders AI explanation text', () => {
        const property = makeProperty();
        renderWithStore(<ConfidenceCard property={property} />);
        expect(screen.getByText(/satellite evidence/i)).toBeInTheDocument();
    });

    test('handles missing confidenceBreakdown without crashing', () => {
        const property = makeProperty({ confidenceBreakdown: null });
        expect(() => renderWithStore(<ConfidenceCard property={property} />)).not.toThrow();
    });
});
```

---

## 8. Mocking Patterns

### Mock react-router-dom
```js
vi.mock('react-router-dom', () => ({
    ...vi.importActual('react-router-dom'),
    useNavigate: () => vi.fn(),
    useParams: () => ({ wardId: '1' }),
}));
```

### Mock the API client for unit tests
```js
vi.mock('../../api/client', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

import api from '../../api/client';
api.get.mockResolvedValue({ data: { data: [makeProperty()] } });
```

> For component tests where you don't want real HTTP calls, mock `src/api/client.js`.
> This is different from integration tests where the real API must be hit.

---

## 9. Edge Cases to Always Cover

| Category | What to test |
|----------|-------------|
| **Empty state** | Zero properties returned; empty ward list |
| **API field mapping** | `mapAPIToUI` converts snake_case → camelCase; raw keys don't leak into components |
| **Missing optional fields** | `confidence_breakdown` absent; `ai_explanation` absent |
| **Status machine** | All verification transitions from `pending` work |
| **Error state** | Rejected thunk sets correct error; displayed in UI |
| **Reset idempotency** | Calling `resetVerifyStatus` on idle slice has no side effects |
| **Confidence display** | 0.0 score handled (empty bar); 1.0 handled (full bar) |
| **Detection types** | Both `new_build` and `change_of_use` render correctly |

---

## 10. Test Checklist

```
□ File name describes behaviour, not a ticket number
□ All test data defined in file using factory functions
□ Factories use Date.now() + random suffix for unique IDs
□ No shared payload files imported
□ Happy path covered: initial state, fetch (pending/fulfilled/failed)
□ Edge cases covered: empty list, missing optional fields, error state
□ Reset actions verified
□ Component tests: renders correct content, handles null gracefully
□ Run npm run test -- TestFileName to verify all pass
```
