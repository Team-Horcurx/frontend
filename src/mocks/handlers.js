import { http, HttpResponse, delay, passthrough } from 'msw';
import { WARDS } from './data/wards.js';
import { PROPERTIES } from './data/properties.js';
import { ALERTS } from './data/alerts.js';
import { computeStats, ALL_WARDS_STATS } from './data/stats.js';

// Mutable copies so verify/resolve actions persist across the session
let properties = PROPERTIES.map(p => ({ ...p }));

let conflicts = [
  { id: 'conf-001', ward_id: '1', match_id: 'match-004', conflict_type: 'geometry_mismatch',  severity: 'high',     suggested_resolution: 'Review cadastral parcel KH/445/2024 against revenue pahani — boundary shifted ~14m NW after 2024 resurvey.',                                                              status: 'pending',      resolved_by: null, resolved_at: null },
  { id: 'conf-002', ward_id: '1', match_id: 'match-005', conflict_type: 'attribute_mismatch', severity: 'medium',   suggested_resolution: 'Drone ortho shows 2-storey structure; building_footprint layer records single floor. Update floor count in GVMC DB.',                                                   status: 'pending',      resolved_by: null, resolved_at: null },
  { id: 'conf-003', ward_id: '1', match_id: 'match-006', conflict_type: 'geometry_mismatch',  severity: 'critical', suggested_resolution: 'Utility connection (EB meter) at coordinates 17.733, 83.297 — no matching parcel in municipal GIS. Possible unauthorised structure.', status: 'needs_review', resolved_by: null, resolved_at: null },
];

const BASE = '';

const CHAT_RESPONSES = [
  'Based on current GVMC detection data, **Ward 4 (Asilmetta)** has the highest concentration of unverified new builds — 6 properties pending with a combined area of 2,371 m².',
  'The revenue leakage estimate across all 5 wards is approximately **₹48.2 lakhs/year**, primarily driven by 4 multi-story buildings in Asilmetta without municipal records.',
  'The NDBI threshold is currently set at **0.15**. Lowering it to 0.10 would increase detections ~30% but raise the false positive rate from 9% to ~18% based on historical validation.',
  'Ward 2 (Gopalapatnam) shows **3 properties** near RK Beach Road with commercial activity inconsistent with their residential classification. Field verification recommended before Q3 assessment.',
  'I found **18 properties** currently in pending status. The highest-confidence pending detection is `prop-w4-001` in Asilmetta at 96% confidence, 789 m².',
];

export const handlers = [

  // Pass through all external requests (Google Maps, fonts, etc.)
  http.get('https://maps.googleapis.com/*', () => passthrough()),
  http.post('https://maps.googleapis.com/*', () => passthrough()),
  http.get('https://maps.gstatic.com/*', () => passthrough()),
  http.get('https://fonts.googleapis.com/*', () => passthrough()),
  http.get('https://fonts.gstatic.com/*', () => passthrough()),

  // wardsSlice.fetchWards
  http.get(`${BASE}/api/wards`, async () => {
    await delay(300);
    return HttpResponse.json(WARDS);
  }),

  // wardsSlice.fetchWardGeoJSON — step 1: return presigned URL pointing to static file
  http.get(`${BASE}/api/wards/:wardId/changes`, async ({ params }) => {
    await delay(200);
    return HttpResponse.json({
      presigned_url: `${BASE}/mock-geojson/ward-${params.wardId}.json`,
    });
  }),

  // propertiesSlice.fetchProperties
  http.get(`${BASE}/api/wards/:wardId/unassessed`, async ({ params, request }) => {
    const url = new URL(request.url);
    const typeFilter       = url.searchParams.get('type');
    const statusFilter     = url.searchParams.get('status');
    const comparisonYear   = url.searchParams.get('comparison_year');
    await delay(400);
    let subset = properties.filter(p => p.ward_id === params.wardId);
    if (typeFilter)      subset = subset.filter(p => p.detection_type === typeFilter);
    if (statusFilter)    subset = subset.filter(p => p.status === statusFilter);
    if (comparisonYear)  subset = subset.filter(p => p.comparison_year === parseInt(comparisonYear, 10));
    return HttpResponse.json(subset);
  }),

  // alertsSlice.fetchAlerts
  http.get(`${BASE}/api/wards/:wardId/alerts`, async ({ params }) => {
    await delay(250);
    return HttpResponse.json(ALERTS[params.wardId] ?? []);
  }),

  // propertiesSlice.fetchPropertyById (also triggers AI explanation)
  http.get(`${BASE}/api/properties/:id`, async ({ params }) => {
    await delay(600);
    const prop = properties.find(p => p.id === params.id);
    if (!prop) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    return HttpResponse.json({
      ...prop,
      ai_explanation: prop.ai_explanation ??
        `**Analysis for ${params.id}**: Confidence ${Math.round(prop.confidence * 100)}% for ${prop.detection_type}.\n\n` +
        `NDBI delta indicates built-up area increase since last satellite pass. No matching structure found in GVMC property records.\n\n` +
        `**Recommendation**: ${prop.confidence >= 0.8 ? 'High priority — schedule field verification within 7 days.' : 'Include in next inspection cycle.'}`,
    });
  }),

  // propertiesSlice.verifyProperty
  http.post(`${BASE}/api/properties/:id/verify`, async ({ params, request }) => {
    const body = await request.json();
    await delay(300);
    const idx = properties.findIndex(p => p.id === params.id);
    if (idx !== -1) properties[idx].status = body.status;
    return HttpResponse.json({ status: body.status });
  }),

  // statsSlice.fetchStats + adminSlice.fetchAdminConfig (both call GET /api/stats)
  http.get(`${BASE}/api/stats`, async ({ request }) => {
    const wardId = new URL(request.url).searchParams.get('ward_id') ?? null;
    await delay(200);
    return HttpResponse.json(computeStats(wardId));
  }),

  // statsSlice.fetchAllWardsStats
  http.get(`${BASE}/api/stats/all-wards`, async () => {
    await delay(500);
    return HttpResponse.json(ALL_WARDS_STATS);
  }),

  // alertsSlice.exportAlerts
  http.post(`${BASE}/api/alerts/export`, async () => {
    await delay(400);
    return HttpResponse.json({ presigned_url: `${BASE}/mock-geojson/ward-1.json` });
  }),

  // chatSlice.sendChatMessage
  http.post(`${BASE}/api/chat`, async ({ request }) => {
    const { message } = await request.json();
    await delay(900);
    const idx = message.length % CHAT_RESPONSES.length;
    return HttpResponse.json({ response: CHAT_RESPONSES[idx] });
  }),

  // propertiesSlice.fetchPropertyExplanation — Spot 1
  http.get(`${BASE}/api/explain/:propertyId`, async ({ params }) => {
    await delay(700);
    return HttpResponse.json({
      property_id: params.propertyId,
      ai_explanation:
        `**Analysis**: NDBI delta of 0.21 confirms significant built-up area increase since 2022 baseline. ` +
        `No matching structure found in GVMC property records — high likelihood of unregistered construction.\n\n` +
        `**Estimated annual tax**: ₹18,000–₹26,000 based on area and usage classification. ` +
        `Recommend priority field verification within 7 days.`,
    });
  }),

  // statsSlice.fetchCommissionerBrief — Spot 2
  http.get(`${BASE}/api/brief`, async () => {
    await delay(800);
    return HttpResponse.json({
      ai_brief:
        `**City Summary**: GVMC detected 1,847 new properties across 98 wards this cycle, with an estimated ` +
        `revenue leakage of ₹8.3 crore/year. New builds account for 68% of detections; change-of-use for 32%.\n\n` +
        `**Top Wards**: Ward 14 (Asilmetta) leads with 94 unassessed properties at 89% avg confidence. ` +
        `Ward 22 (Steel Plant area) shows a 340% spike vs baseline — immediate attention required. ` +
        `Ward 7 (Kommadi) has the highest revenue leakage estimate at ₹1.2 crore.\n\n` +
        `**Recommendation**: Deploy 4 additional field officers to Wards 14, 22, and 7 for the next 2 weeks. ` +
        `Priority verification of 203 HIGH-severity properties before the Q3 assessment deadline.`,
    });
  }),

  // alertsSlice.generateWardAlert — Spot 3
  http.post(`${BASE}/api/wards/:wardId/alert`, async ({ params }) => {
    await delay(600);
    const severities = ['HIGH', 'MEDIUM', 'LOW'];
    const severity = severities[Number(params.wardId) % 3];
    return HttpResponse.json({
      alert_id: `mock-alert-${params.wardId}-${Date.now()}`,
      alert: {
        text: `Ward ${params.wardId} shows a 220% spike in new-build detections above monthly baseline. ` +
          `Recommend deploying field officers for verification within 48 hours.`,
        severity,
        score: severity === 'HIGH' ? 82 : severity === 'MEDIUM' ? 55 : 28,
      },
      saved: true,
    });
  }),

  // adminSlice.uploadCSV
  http.post(`${BASE}/api/admin/upload-csv`, async () => {
    await delay(1200);
    return HttpResponse.json({ properties_imported: 1847 });
  }),

  // adminSlice.saveDbConfig
  http.post(`${BASE}/api/admin/db-config`, async () => {
    await delay(300);
    return HttpResponse.json({});
  }),

  // adminSlice.triggerRefresh
  http.post(`${BASE}/api/admin/refresh`, async () => {
    await delay(500);
    return HttpResponse.json({ triggered: true });
  }),

  // sourcesSlice.fetchSources
  http.get(`${BASE}/api/sources`, async ({ request }) => {
    const url    = new URL(request.url);
    const wardId = url.searchParams.get('ward_id') ?? '1';
    const typeFilter = url.searchParams.get('type');
    await delay(300);
    const ALL_SOURCES = [
      { id: 'src-001', type: 'cadastral',     ward_id: wardId, s3_key: 'sources/cadastral/001.geojson',     filename: 'cadastral_seethammadhara_2026.geojson', crs: 'EPSG:4326', status: 'ready',       captured_at: '2026-08-01T00:00:00Z', created_at: '2026-08-01T10:00:00Z', metadata: {} },
      { id: 'src-002', type: 'revenue',        ward_id: wardId, s3_key: 'sources/revenue/002.pdf',           filename: 'pahani_seethammadhara_2026.pdf',         crs: null,         status: 'pending_ocr', captured_at: '2026-08-03T00:00:00Z', created_at: '2026-08-03T09:00:00Z', metadata: {} },
      { id: 'src-003', type: 'municipal_gis',  ward_id: wardId, s3_key: 'sources/municipal_gis/003.geojson', filename: 'gvmc_gis_ward1_master.geojson',          crs: 'EPSG:4326', status: 'ready',       captured_at: '2026-07-28T00:00:00Z', created_at: '2026-07-28T11:00:00Z', metadata: {} },
      { id: 'src-004', type: 'drone_imagery',  ward_id: wardId, s3_key: 'sources/drone_imagery/004.tiff',    filename: 'drone_ortho_sector3_aug2026.tiff',       crs: 'EPSG:32644', status: 'ready',       captured_at: '2026-08-15T06:30:00Z', created_at: '2026-08-15T14:00:00Z', metadata: {} },
      { id: 'src-005', type: 'ground_truth',   ward_id: wardId, s3_key: 'sources/ground_truth/005.geojson',  filename: 'field_survey_gps_aug2026.geojson',       crs: 'EPSG:4326', status: 'ready',       captured_at: '2026-08-20T00:00:00Z', created_at: '2026-08-20T16:00:00Z', metadata: {} },
      { id: 'src-006', type: 'building_footprint', ward_id: wardId, s3_key: 'sources/building_footprint/006.geojson', filename: 'osm_building_footprints_vizag.geojson', crs: 'EPSG:4326', status: 'ready', captured_at: '2026-08-05T00:00:00Z', created_at: '2026-08-05T08:00:00Z', metadata: {} },
      { id: 'src-007', type: 'utility',        ward_id: wardId, s3_key: 'sources/utility/007.geojson',       filename: 'electricity_connections_ward1.geojson',  crs: 'EPSG:4326', status: 'ready',       captured_at: '2026-07-15T00:00:00Z', created_at: '2026-07-15T12:00:00Z', metadata: {} },
      { id: 'src-008', type: 'revenue',        ward_id: wardId, s3_key: 'sources/revenue/008.pdf',           filename: 'adangal_register_2025-26.pdf',           crs: null,         status: 'ready',       captured_at: '2026-06-30T00:00:00Z', created_at: '2026-06-30T10:00:00Z', metadata: { ocr_extracted: { khata_no: { value: 'KH/445/2024', confidence: 0.97 }, owner_name: { value: 'Venkata Rao', confidence: 0.94 }, area: { value: '312 sq.m', confidence: 0.91 } } } },
    ];
    const filtered = typeFilter ? ALL_SOURCES.filter(s => s.type === typeFilter) : ALL_SOURCES;
    return HttpResponse.json({ sources: filtered });
  }),

  // sourcesSlice.uploadSource
  http.post(`${BASE}/api/sources/upload`, async ({ request }) => {
    const body = await request.json();
    await delay(900);
    const ext = (body.filename ?? 'upload.bin').split('.').pop().toLowerCase();
    const needsOcr = ['revenue','cadastral'].includes(body.type) && ['pdf','jpg','jpeg','png','tiff','tif'].includes(ext);
    return HttpResponse.json({
      id: `src-${Date.now()}`,
      status: needsOcr ? 'pending_ocr' : 'ready',
      s3_key: `sources/${body.type ?? 'unknown'}/mock-${Date.now()}.${ext}`,
      message: needsOcr ? 'Queued for OCR digitization' : 'Uploaded and processed',
    }, { status: 201 });
  }),

  // harmonizationSlice.fetchMatches
  http.get(`${BASE}/api/harmonization/matches`, async ({ request }) => {
    const minScore = parseFloat(new URL(request.url).searchParams.get('min_score') ?? '0');
    await delay(350);
    const ALL_MATCHES = [
      { id: 'match-001', source_a_id: 'src-001', source_a_type: 'cadastral',        source_b_id: 'src-003', source_b_type: 'municipal_gis',     geometry_iou: 0.91, centroid_distance_m: 2.3,  match_score: 96.1, matched_at: '2026-09-01T10:00:00Z' },
      { id: 'match-002', source_a_id: 'src-001', source_a_type: 'cadastral',        source_b_id: 'src-006', source_b_type: 'building_footprint', geometry_iou: 0.84, centroid_distance_m: 5.1,  match_score: 88.2, matched_at: '2026-09-01T10:00:00Z' },
      { id: 'match-003', source_a_id: 'src-003', source_a_type: 'municipal_gis',    source_b_id: 'src-005', source_b_type: 'ground_truth',       geometry_iou: 0.78, centroid_distance_m: 8.7,  match_score: 82.6, matched_at: '2026-09-01T10:00:00Z' },
      { id: 'match-004', source_a_id: 'src-001', source_a_type: 'cadastral',        source_b_id: 'src-008', source_b_type: 'revenue',            geometry_iou: 0.53, centroid_distance_m: 14.2, match_score: 63.4, matched_at: '2026-09-01T10:00:00Z' },
      { id: 'match-005', source_a_id: 'src-004', source_a_type: 'drone_imagery',    source_b_id: 'src-006', source_b_type: 'building_footprint', geometry_iou: 0.39, centroid_distance_m: 19.8, match_score: 47.0, matched_at: '2026-09-01T10:00:00Z' },
      { id: 'match-006', source_a_id: 'src-003', source_a_type: 'municipal_gis',    source_b_id: 'src-007', source_b_type: 'utility',            geometry_iou: 0.31, centroid_distance_m: 22.5, match_score: 35.8, matched_at: '2026-09-01T10:00:00Z' },
    ];
    return HttpResponse.json({ matches: ALL_MATCHES.filter(m => m.match_score >= minScore) });
  }),

  // harmonizationSlice.runMatching
  http.post(`${BASE}/api/harmonization/run`, async () => {
    await delay(1400);
    return HttpResponse.json({ sources_evaluated: 8, matches_created: 6, conflicts_created: 3 });
  }),

  // conflictsSlice.fetchConflicts
  http.get(`${BASE}/api/conflicts`, async ({ request }) => {
    const statusFilter = new URL(request.url).searchParams.get('status');
    await delay(280);
    const result = statusFilter ? conflicts.filter(c => c.status === statusFilter) : conflicts;
    return HttpResponse.json({ conflicts: result });
  }),

  // conflictsSlice.resolveConflict
  http.post(`${BASE}/api/conflicts/:id/resolve`, async ({ params, request }) => {
    const body = await request.json();
    await delay(300);
    const idx = conflicts.findIndex(c => c.id === params.id);
    if (idx !== -1) {
      conflicts[idx].status      = body.status;
      conflicts[idx].resolved_by = body.resolved_by ?? 'officer';
      conflicts[idx].resolved_at = new Date().toISOString();
    }
    return HttpResponse.json({ id: params.id, status: body.status });
  }),
];
