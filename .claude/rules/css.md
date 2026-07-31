# CSS Rule

Always apply these rules when writing any styles.

## No Hardcoded Values

- Never hardcode color hex values — use CSS variables
- Never hardcode font sizes in px or rem — use CSS variables
- Never hardcode spacing values (padding, margin, gap) — use CSS variables
- Never hardcode layout dimensions — use CSS variables

## CSS Variable Sources

Design tokens live in two files:
- Component tokens: `src/styles/variables.css` — colors, typography, spacing, shadows, borders, z-index
- Layout tokens: `src/styles/responsive.css` — fluid font scale (`--font-xs` through `--font-2xl`), fluid spacing (`--space-1` through `--space-6`)

## Status Colors

Use variables from `src/styles/statusBadge.css` for all status/state indicators:

```jsx
// Option A — predefined classes:
<span className="status-badge status-badge-success">Verified</span>
<span className="status-badge status-badge-warning">Underassessed</span>
<span className="status-badge status-badge-danger">False Positive</span>

// Option B — dynamic:
const STATUS_MAP = {
  verified: 'success',
  underassessed: 'warning',
  false_positive: 'danger',
  already_assessed: 'info',
  pending: 'secondary',
  new_build: 'danger',
  change_of_use: 'orange',
};
const type = STATUS_MAP[status] || 'secondary';
style={{ background: `var(--status-${type}-bg)`, color: `var(--status-${type}-text)` }}
```

| Status Type | Background Variable | Text Variable |
|-------------|--------------------|--------------:|
| `success` | `--status-success-bg` | `--status-success-text` |
| `warning` | `--status-warning-bg` | `--status-warning-text` |
| `danger` | `--status-danger-bg` | `--status-danger-text` |
| `info` | `--status-info-bg` | `--status-info-text` |
| `secondary` | `--status-secondary-bg` | `--status-secondary-text` |
| `orange` | `--status-orange-bg` | `--status-orange-text` |

## BEM Naming

Always use BEM convention:
- Block: `.property-list`
- Element: `.property-list__header`, `.property-list__row`
- Modifier: `.property-list--loading`, `.property-list__row--selected`

Never use generic class names that could conflict.

## File Organization

- Always co-locate component CSS with its JSX file (same folder, same base name)
- Never use `!important` in component CSS files

## Key Color Conventions for GVMC

```css
/* Map confidence heat levels */
--confidence-high:   var(--color-success);   /* ≥0.8 */
--confidence-medium: var(--color-warning);   /* 0.5–0.8 */
--confidence-low:    var(--color-danger);    /* <0.5 */

/* Detection type indicators */
--detection-new-build:    var(--color-danger);   /* new_build */
--detection-change-of-use: var(--color-warning); /* change_of_use */
```
