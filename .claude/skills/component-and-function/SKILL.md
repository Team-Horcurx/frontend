# Component and Function Skill

## Skill Metadata
- **Name:** component-and-function
- **Type:** Component Architecture & Reusable Component Reference
- **Target:** GVMC Change-Detection Dashboard (React + Vite)
- **Objective:** Build new components correctly and reuse existing components without duplication

---

## 1. Development Philosophy

| Principle | What It Means |
|-----------|--------------|
| **DRY** | Check `src/components/` before writing any new UI element |
| **Single Responsibility** | One component = one job |
| **Composition** | Build complex views by composing small components |

### Golden Rules

1. Check `src/components/` before writing a new component
2. Never write inline styles — use CSS classes and CSS variables
3. Never hardcode colors, font sizes, or spacing — use CSS variables
4. Always use PropTypes on reusable components

---

## 2. Folder Structure

```
src/
├── components/                   ← shared components (check here first)
│   ├── MapView.jsx + MapView.css
│   ├── PropertyList.jsx + PropertyList.css
│   ├── WardSelector.jsx + WardSelector.css
│   ├── AlertPanel.jsx + AlertPanel.css
│   ├── StatsBar.jsx + StatsBar.css
│   ├── VerifyPanel.jsx + VerifyPanel.css
│   ├── ConfidenceCard.jsx + ConfidenceCard.css
│   ├── DemoModeBadge.jsx + DemoModeBadge.css
│   └── AdminPanel.jsx + AdminPanel.css
├── views/                        ← full-page role views
│   ├── HomePage.jsx
│   ├── FieldOfficerView.jsx
│   ├── SupervisorView.jsx
│   └── CommissionerView.jsx
├── api/
│   └── client.js                 ← axios instance
└── Redux/
    ├── slices/
    └── Store.jsx
```

---

## 3. Screen Development Process

```
Step 1: Identify the view type (see Section 4)
  - Role dashboard, map view, list + verify, admin form?

Step 2: Check src/components/ for existing components to compose

Step 3: Create missing shared components (if truly needed)
  - Place in src/components/
  - PropTypes on all props
  - Co-locate CSS file

Step 4: Build the view
  - Compose shared components
  - Connect Redux state
  - Handle loading, error, empty states

Step 5: Style with CSS variables only
  - Co-locate {ComponentName}.css
  - BEM naming: .component-name__element--modifier
```

---

## 4. View Types

### Role Dashboard (Homepage buttons / role landing)
```
WardSelector (top)
StatsBar (summary counts)
MapView (choropleth or markers)
PropertyList (table of detections)
```

### FieldOfficerView Layout
```
WardSelector + StatsBar
────────────────────────
MapView (left, ~60%)  |  PropertyList (right, ~40%)
────────────────────────
VerifyPanel (on property select)
ConfidenceCard (AI explanation)
Chat UI panel (Bedrock chatbot)
```

### SupervisorView Layout
```
WardSelector
StatsBar (ward-level aggregates)
AlertPanel (AI-generated alerts per ward)
```

### CommissionerView Layout
```
StatsBar (all-wards totals)
MapView (choropleth heatmap — wards colored by unassessed count)
Top 10 wards list (sortable by count)
AI daily brief (Bedrock Llama output, markdown rendered)
```

### AdminPanel Layout
```
DemoModeBadge (always visible when in demo mode)
CSV upload section
NDBI threshold slider
DB config form
Pipeline trigger button + status
```

---

## 5. Reusable Component Templates

### Shared Component Template
```jsx
// src/components/ComponentName.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './ComponentName.css';

const ComponentName = ({ variant = 'default', children, className = '', ...props }) => {
    const classes = ['component-name', `component-name--${variant}`, className]
        .filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
};

ComponentName.propTypes = {
    variant: PropTypes.oneOf(['default', 'primary']),
    children: PropTypes.node,
    className: PropTypes.string,
};

export default ComponentName;
```

### View Component Template
```jsx
// src/views/RoleView.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import WardSelector from '../components/WardSelector';
import StatsBar from '../components/StatsBar';
import MapView from '../components/MapView';
import PropertyList from '../components/PropertyList';
import { fetchWards, selectWards, selectWardsStatus } from '../Redux/slices/wardsSlice';
import './RoleView.css';

export default function RoleView() {
    const dispatch = useDispatch();
    const wards = useSelector(selectWards);
    const status = useSelector(selectWardsStatus);

    useEffect(() => {
        if (status === 'idle') dispatch(fetchWards());
    }, [status, dispatch]);

    if (status === 'loading') return <div className="role-view__loading">Loading…</div>;

    return (
        <div className="role-view">
            <WardSelector wards={wards} />
            <StatsBar />
            <div className="role-view__content">
                <MapView />
                <PropertyList />
            </div>
        </div>
    );
}
```

---

## 6. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component files | PascalCase | `ConfidenceCard.jsx` |
| CSS files | Same as component | `ConfidenceCard.css` |
| Hooks | camelCase with `use` prefix | `useWardData.js` |
| Utilities | camelCase | `confidenceUtils.js` |
| Constants | UPPER_SNAKE_CASE | `DETECTION_TYPES` |

### Boolean Props — `is`/`has`/`can` prefix
```js
isLoading, isSelected, isVerified, hasChatOpen, canVerify
```

### Event Handlers — `on` prefix
```js
onClick, onChange, onVerify, onWardChange, onPropertySelect
```

---

## 7. Pre-Development Checklist

```
□ Checked src/components/ for existing components to compose
□ Component file is PascalCase.jsx with co-located .css
□ No inline styles
□ No hardcoded colors or spacing
□ PropTypes added on reusable components
□ Redux state for data, useState only for local UI
□ Loading and error states handled
```
