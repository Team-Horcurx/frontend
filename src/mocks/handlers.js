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
];
