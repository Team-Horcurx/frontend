# UI and Theme Skill

## Skill Metadata
- **Name:** ui-and-theme
- **Type:** UI Standards & Theming Reference
- **Target:** GVMC Change-Detection Dashboard
- **Objective:** Apply consistent visual design using CSS variables, status badge patterns, and GVMC-specific UI conventions

---

## 1. Design Token System

All design values live in `src/styles/variables.css`. Never hardcode — always use these tokens.

### Color Tokens

```css
/* Brand */
--color-primary: #0d6efd;         --color-primary-hover: #0b5ed7;
--color-primary-light: #e7f1ff;   --color-primary-dark: #084298;

/* Semantic */
--color-success: #198754;         --color-success-light: #d1e7dd;
--color-danger: #dc3545;          --color-danger-light: #f8d7da;
--color-warning: #ffc107;         --color-warning-light: #fff3cd;
--color-info: #0dcaf0;            --color-info-light: #cff4fc;

/* Neutrals */
--color-gray-50: #f8f9fa;    --color-gray-100: #f1f3f5;  --color-gray-200: #e9ecef;
--color-gray-300: #dee2e6;   --color-gray-500: #adb5bd;  --color-gray-700: #495057;
--color-gray-900: #212529;

/* Backgrounds */
--bg-primary: #ffffff;   --bg-secondary: #f8f9fa;  --bg-tertiary: #f1f3f5;

/* Text */
--text-primary: #212529;  --text-secondary: #6c757d;  --text-muted: #adb5bd;

/* Borders */
--border-color: #dee2e6;  --border-color-focus: #0d6efd;
```

### Typography Tokens

```css
/* Fluid sizes — use these */
--font-xs: clamp(10px,1.2vw,12px);   --font-sm: clamp(12px,1.4vw,13px);
--font-base: clamp(13px,1.5vw,14px); --font-md: clamp(14px,1.8vw,16px);
--font-lg: clamp(16px,2vw,20px);     --font-xl: clamp(20px,2.5vw,24px);

/* Weight */
--font-weight-normal: 400;  --font-weight-medium: 500;
--font-weight-semibold: 600; --font-weight-bold: 700;
```

### Spacing Tokens

```css
/* Fluid */
--space-1: clamp(4px,0.5vw,6px);   --space-2: clamp(8px,1vw,12px);
--space-3: clamp(12px,1.5vw,16px); --space-4: clamp(16px,2vw,20px);
--space-5: clamp(20px,2.5vw,24px); --space-6: clamp(24px,3vw,32px);

/* Layout */
--page-padding-x: 20px;    --page-padding-y: 20px;
--navbar-height: 56px;
```

### Shape & Effect Tokens

```css
--radius-sm: 0.25rem;  --radius-md: 0.375rem;  --radius-lg: 0.5rem;
--radius-full: 9999px;

--shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);

--transition-fast: 150ms ease;  --transition-normal: 250ms ease;
```

---

## 2. Status Badge System

File: `src/styles/statusBadge.css`

### GVMC Status → Badge Type Mapping

```jsx
const STATUS_MAP = {
  // Verification statuses
  pending:          'secondary',
  verified:         'success',
  underassessed:    'warning',
  false_positive:   'danger',
  already_assessed: 'info',
  // Detection types
  new_build:        'danger',
  change_of_use:    'orange',
  // Pipeline statuses
  running:          'primary',
  completed:        'success',
  failed:           'danger',
  idle:             'secondary',
};

const getStatusType = (status) => STATUS_MAP[status?.toLowerCase()] || 'secondary';
```

### Badge Render Pattern

```jsx
<span
  className="status-badge"
  style={{
    background: `var(--status-${getStatusType(status)}-bg)`,
    color: `var(--status-${getStatusType(status)}-text)`
  }}
>
  {status?.replace(/_/g, ' ')}
</span>
```

| Status Type | Background | Text |
|-------------|-----------|------|
| `success` | `--status-success-bg` | `--status-success-text` |
| `warning` | `--status-warning-bg` | `--status-warning-text` |
| `danger` | `--status-danger-bg` | `--status-danger-text` |
| `info` | `--status-info-bg` | `--status-info-text` |
| `secondary` | `--status-secondary-bg` | `--status-secondary-text` |
| `primary` | `--status-primary-bg` | `--status-primary-text` |
| `orange` | `--status-orange-bg` | `--status-orange-text` |

---

## 3. GVMC-Specific UI Conventions

### Confidence Score Bar

```css
.confidence-bar {
    height: 8px;
    border-radius: var(--radius-full);
    background: var(--color-gray-200);
}
.confidence-bar__fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width var(--transition-normal);
}
.confidence-bar__fill--high   { background: var(--color-success); }
.confidence-bar__fill--medium { background: var(--color-warning); }
.confidence-bar__fill--low    { background: var(--color-danger); }
```

### DemoModeBadge

```css
.demo-badge {
    background: #ffc107;          /* fixed — intentional, not a status color */
    color: #000;
    text-align: center;
    padding: var(--space-1) var(--page-padding-x);
    font-size: var(--font-sm);
    font-weight: var(--font-weight-semibold);
    position: sticky;
    top: var(--navbar-height);
    z-index: var(--z-sticky);
}
```

### Stats Card

```css
.stats-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--space-3);
    margin-bottom: var(--space-4);
}
.stats-bar__card {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-left: 4px solid var(--accent-color);   /* passed as CSS var via style prop */
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    box-shadow: var(--shadow-sm);
}
.stats-bar__value {
    font-size: var(--font-xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
}
.stats-bar__label {
    font-size: var(--font-sm);
    color: var(--text-secondary);
    margin-top: var(--space-1);
}
```

---

## 4. Responsive Breakpoints

Mobile-first. Use `min-width` queries.

| Name | Min-Width | Use |
|------|-----------|-----|
| xs | 0 | Phone (base) |
| md | 768px | Tablet |
| lg | 1024px | Desktop |

```css
/* MapView + PropertyList split: stack on mobile, side-by-side on desktop */
.officer-view__content {
    display: flex;
    flex-direction: column;
}
@media (min-width: 1024px) {
    .officer-view__content {
        flex-direction: row;
    }
    .officer-view__map  { flex: 6; }
    .officer-view__list { flex: 4; }
}
```

---

## 5. Icon Library

Always use `react-icons`. Active sets:

| Library | Import | Use |
|---------|--------|-----|
| Feather Icons | `react-icons/fi` | Actions, UI |
| Material Design | `react-icons/md` | Dashboard, data |
| Heroicons | `react-icons/hi` | Utility elements |
| Ionicons 5 | `react-icons/io5` | Navigation |

```jsx
import { FiMapPin, FiCheckCircle, FiAlertTriangle, FiUpload } from 'react-icons/fi';
import { MdSatellite, MdOutlineVerifiedUser } from 'react-icons/md';
```

---

## 6. Map-Specific UI Conventions

- Leaflet z-index is isolated inside `.leaflet-container` — do not fight with app z-index
- Always wrap Leaflet container in a fixed-height div:
  ```css
  .map-view { height: 100%; min-height: 400px; }
  ```
- Use `var(--color-danger)` for `new_build` polygons, `var(--color-warning)` for `change_of_use`
- Confidence < 0.5 → polygon opacity 0.4; ≥ 0.5 → opacity 0.7; ≥ 0.8 → opacity 1.0
- Selected property marker uses a pulsing ring animation (CSS keyframes)

---

## 7. CSS Authoring Rules

```css
/* ✅ CORRECT */
.property-list__header {
    padding: var(--space-4) var(--page-padding-x);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    font-size: var(--font-base);
    color: var(--text-primary);
}

/* ❌ WRONG */
.property-list__header {
    padding: 16px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
    font-size: 14px;
    color: #212529;
}
```
