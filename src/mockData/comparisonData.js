// Mock data for the Field Officer historical comparison feature.
// Shaped so a real endpoint (e.g. GET /api/wards/{id}/comparison?base=YYYY&current=YYYY)
// can replace mapComparisonStats/COMPARISON_PROPERTIES with minimal changes —
// components consume this through the same shape a real API response would use.

export const COMPARISON_YEARS = [2022, 2024, 2026];

// Keyed "baseYear-compareYear" so swapping in a real fetch later is a lookup-by-key change.
const COMPARISON_STATS_BY_RANGE = {
  '2022-2024': {
    newStructures: 24,
    changeOfUse: 9,
    builtUpAreaIncreaseSqm: 6840,
    estimatedAssessableAreaSqm: 4920,
    estimatedTaxImpactInr: 612000,
  },
  '2022-2026': {
    newStructures: 47,
    changeOfUse: 18,
    builtUpAreaIncreaseSqm: 12480,
    estimatedAssessableAreaSqm: 8960,
    estimatedTaxImpactInr: 1284000,
  },
  '2024-2026': {
    newStructures: 23,
    changeOfUse: 11,
    builtUpAreaIncreaseSqm: 5640,
    estimatedAssessableAreaSqm: 4040,
    estimatedTaxImpactInr: 672000,
  },
};

export function getComparisonStats(baseYear, compareYear) {
  return COMPARISON_STATS_BY_RANGE[`${baseYear}-${compareYear}`] ?? COMPARISON_STATS_BY_RANGE['2022-2024'];
}

export const COMPARISON_PROPERTIES = [
  {
    id: 'GVMC-014-0032',
    changeType: 'new_build',
    areaDeltaSqm: 420,
    ndbiDelta: 0.27,
    estimatedTaxInr: 33600,
    confidence: 0.91,
    status: 'pending',
    timeline: [
      { year: 2022, note: 'No structure detected' },
      { year: 2024, note: 'Foundation visible' },
      { year: 2026, note: 'Structure complete — 420 m²' },
    ],
    officerNotes: 'Not yet field-verified.',
    reportStatus: 'not_generated',
  },
  {
    id: 'GVMC-027-0118',
    changeType: 'change_of_use',
    areaDeltaSqm: 165,
    ndbiDelta: 0.14,
    estimatedTaxInr: 13200,
    confidence: 0.78,
    status: 'underassessed',
    timeline: [
      { year: 2022, note: '210 m² residential footprint' },
      { year: 2024, note: '295 m² — partial expansion' },
      { year: 2026, note: '375 m² — commercial signage detected' },
    ],
    officerNotes: 'Ground floor converted to retail use.',
    reportStatus: 'not_generated',
  },
  {
    id: 'GVMC-041-0076',
    changeType: 'new_build',
    areaDeltaSqm: 610,
    ndbiDelta: 0.31,
    estimatedTaxInr: 48800,
    confidence: 0.95,
    status: 'verified',
    timeline: [
      { year: 2022, note: 'Vacant plot' },
      { year: 2024, note: 'Construction in progress' },
      { year: 2026, note: 'Structure complete — 610 m²' },
    ],
    officerNotes: 'Verified on-site, matches satellite record.',
    reportStatus: 'generated',
  },
  {
    id: 'GVMC-005-0203',
    changeType: 'change_of_use',
    areaDeltaSqm: 88,
    ndbiDelta: 0.09,
    estimatedTaxInr: 7040,
    confidence: 0.64,
    status: 'pending',
    timeline: [
      { year: 2022, note: '340 m² residential footprint' },
      { year: 2024, note: '340 m² — no change' },
      { year: 2026, note: '428 m² — rear extension' },
    ],
    officerNotes: '',
    reportStatus: 'not_generated',
  },
  {
    id: 'GVMC-063-0011',
    changeType: 'new_build',
    areaDeltaSqm: 275,
    ndbiDelta: 0.19,
    estimatedTaxInr: 22000,
    confidence: 0.58,
    status: 'false_positive',
    timeline: [
      { year: 2022, note: 'No structure detected' },
      { year: 2024, note: 'Temporary structure visible' },
      { year: 2026, note: 'Structure removed — likely shed/scaffolding' },
    ],
    officerNotes: 'Confirmed false positive during site visit.',
    reportStatus: 'not_generated',
  },
];
