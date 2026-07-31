import { PROPERTIES } from './properties.js';

export function computeStats(wardId) {
  const subset = wardId ? PROPERTIES.filter(p => p.ward_id === wardId) : PROPERTIES;
  const newBuilds  = subset.filter(p => p.detection_type === 'new_build').length;
  const changeOfUse = subset.filter(p => p.detection_type === 'change_of_use').length;
  const pending    = subset.filter(p => p.status === 'pending').length;
  const verified   = subset.filter(p => p.status === 'verified').length;
  const falsePos   = subset.filter(p => p.status === 'false_positive').length;
  const revenue    = Math.round(
    subset
      .filter(p => p.status === 'pending' || p.status === 'underassessed')
      .reduce((acc, p) => acc + p.area_sqm * (p.detection_type === 'new_build' ? 80 : 40), 0)
  );
  return {
    total_detections:     subset.length,
    new_builds:           newBuilds,
    change_of_use:        changeOfUse,
    pending_verification: pending,
    verified,
    false_positives:      falsePos,
    revenue_estimate:     revenue,
    ward_id:              wardId ?? null,
    data_mode:            'demo',
    pipeline_status:      'idle',
    last_refresh:         '2026-07-30T04:00:00.000Z',
    ndbi_threshold:       0.15,
  };
}

export const ALL_WARDS_STATS = {
  wards: [
    { ward_id: '1', ward_name: 'Seethammadhara', unassessed_count: 4, total_detections: 8  },
    { ward_id: '2', ward_name: 'Gopalapatnam',    unassessed_count: 3, total_detections: 6  },
    { ward_id: '3', ward_name: 'Maddilapalem',    unassessed_count: 2, total_detections: 4  },
    { ward_id: '4', ward_name: 'Asilmetta',       unassessed_count: 7, total_detections: 10 },
    { ward_id: '5', ward_name: 'Dwaraka Nagar',   unassessed_count: 2, total_detections: 4  },
  ],
  ai_brief: `## GVMC Daily Detection Brief — 31 July 2026

**Executive Summary**: 32 properties across 5 wards flagged for property tax anomalies.

### High Priority Wards
- **Asilmetta (Ward 4)**: 7 pending verifications, estimated revenue leakage ₹31.8L/year. 4 multi-story buildings detected without building permits.
- **Seethammadhara (Ward 1)**: 4 pending, concentrated near Nowroji Road corridor. Commercial conversion activity elevated.

### Key Metrics

| Metric | Value |
|--------|-------|
| Total detections | 32 |
| New builds | 19 |
| Change of use | 13 |
| Pending verification | 18 |
| Revenue at risk | ₹48.2L/year |

### Model Performance
Average confidence: **78%**. False positive rate this cycle: **9.4%** (3/32). NDBI threshold: 0.15.

### Recommendation
Prioritise field officer deployment to Asilmetta and Seethammadhara this week. Dwaraka Nagar detections include 2 solar-panel false positives — recommend model retraining input.`,
  totals: computeStats(null),
};
