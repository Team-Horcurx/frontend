import { http, HttpResponse, delay, passthrough } from 'msw';
import { WARDS } from './data/wards.js';
import { PROPERTIES } from './data/properties.js';
import { ALERTS } from './data/alerts.js';
import { computeStats, ALL_WARDS_STATS } from './data/stats.js';

// Mutable copy so verify actions persist across the session
let properties = PROPERTIES.map(p => ({ ...p }));

const BASE = 'http://localhost:5173';

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
    const typeFilter   = url.searchParams.get('type');
    const statusFilter = url.searchParams.get('status');
    await delay(400);
    let subset = properties.filter(p => p.ward_id === params.wardId);
    if (typeFilter)   subset = subset.filter(p => p.detection_type === typeFilter);
    if (statusFilter) subset = subset.filter(p => p.status === statusFilter);
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
];
