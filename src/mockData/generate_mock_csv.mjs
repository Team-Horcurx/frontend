// Deterministic generator for a large GVMC property-detection mock CSV.
// Ward/zone names are real (Wikipedia-verified GVMC structure + well-known
// Vizag localities). Ward-to-number assignment and every property record
// is synthetic — built for frontend/testing only, not official GVMC data.

import { writeFileSync } from 'node:fs';

// ---- seeded PRNG (mulberry32) for reproducible output ----
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20240731);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const randFloat = (min, max, dp = 2) => parseFloat((rand() * (max - min) + min).toFixed(dp));

// ---- real GVMC zones (Wikipedia: 8 zones, 98 wards as of Jan 2021) ----
const ZONES = [
  { zone: 'Bheemunipatnam', bbox: { south: 17.780, north: 17.895, west: 83.370, east: 83.460 },
    localities: ['Bheemunipatnam', 'Sagar Nagar', 'Rushikonda', 'Anandapuram', 'Padmanabham', 'Kapuluppada'] },
  { zone: 'Madhurawada', bbox: { south: 17.760, north: 17.820, west: 83.300, east: 83.380 },
    localities: ['Madhurawada', 'Pendurthi', 'Marikavalasa', 'Sujatha Nagar', 'Kommadi', 'PM Palem', 'Yendada'] },
  { zone: 'Asilmetta', bbox: { south: 17.700, north: 17.745, west: 83.290, east: 83.330 },
    localities: ['Asilmetta', 'Dwaraka Nagar', 'Siripuram', 'MVP Colony', 'Seethammadhara', 'Maddilapalem', 'Chinna Waltair', 'Daba Gardens'] },
  { zone: 'Suryabagh', bbox: { south: 17.685, north: 17.715, west: 83.280, east: 83.310 },
    localities: ['Suryabagh', 'Jagadamba Junction', 'One Town', 'Poorna Market', 'Kotha Road', 'Old Town'] },
  { zone: 'Gnanapuram', bbox: { south: 17.660, north: 17.700, west: 83.240, east: 83.290 },
    localities: ['Gnanapuram', 'NAD Junction', 'Malkapuram', 'Kancharapalem', 'Marripalem', 'Gopalapatnam', 'Pedagantyada'] },
  { zone: 'Gajuwaka', bbox: { south: 17.640, north: 17.680, west: 83.190, east: 83.240 },
    localities: ['Gajuwaka', 'Kurmannapalem', 'Autonagar', 'BHPV Colony', 'Aganampudi', 'Naidupalem', 'New Gajuwaka'] },
  { zone: 'Anakapalli', bbox: { south: 17.580, north: 17.650, west: 83.000, east: 83.100 },
    localities: ['Anakapalli', 'Sabbavaram', 'Butchayyapeta', 'Kasimkota', 'Yeleswaram'] },
  { zone: 'Vepagunta', bbox: { south: 17.740, north: 17.775, west: 83.230, east: 83.280 },
    localities: ['Vepagunta', 'Simhachalam', 'Adavivaram', 'Vepagunta Colony'] },
];

const PROPERTY_TYPES = [
  { type: 'Residential', weight: 60 },
  { type: 'Commercial', weight: 18 },
  { type: 'Mixed Use', weight: 12 },
  { type: 'Industrial', weight: 6 },
  { type: 'Vacant Land', weight: 4 },
];
function weightedPropertyType() {
  const total = PROPERTY_TYPES.reduce((s, p) => s + p.weight, 0);
  let r = rand() * total;
  for (const p of PROPERTY_TYPES) { if ((r -= p.weight) <= 0) return p.type; }
  return PROPERTY_TYPES[0].type;
}

const STREET_WORDS = ['Main Road', 'Colony Road', 'Cross Street', 'Beach Road', 'Ring Road Extension', 'Temple Street', 'Market Road', 'Lane', 'Nagar Road'];
const FIRST_NAMES = ['Ravi', 'Suresh', 'Lakshmi', 'Venkata', 'Padma', 'Anil', 'Srinivas', 'Kavitha', 'Ramesh', 'Sowjanya', 'Prasad', 'Anitha', 'Krishna', 'Sunitha', 'Mahesh', 'Divya', 'Rajesh', 'Swathi', 'Naveen', 'Haritha'];
const LAST_NAMES = ['Rao', 'Reddy', 'Naidu', 'Varma', 'Murthy', 'Patnaik', 'Sarma', 'Chowdary', 'Devi', 'Prasad', 'Kumar', 'Raju'];

const STATUS_ENUM = ['pending', 'verified', 'underassessed', 'false_positive', 'already_assessed'];
// Realistic distribution: mostly pending (matches "4,600 of 10,000 found" mid-year backlog narrative)
const STATUS_WEIGHTS = [55, 18, 12, 9, 6];
function weightedStatus() {
  const total = STATUS_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < STATUS_ENUM.length; i++) { if ((r -= STATUS_WEIGHTS[i]) <= 0) return STATUS_ENUM[i]; }
  return STATUS_ENUM[0];
}

// PIN codes: real Visakhapatnam district range is 530001–530049
function pinForZone(zoneIdx) {
  return `5300${String(zoneIdx * 6 + randInt(1, 6)).padStart(2, '0')}`.slice(0, 6);
}

const TOTAL_WARDS = 98;
const wards = [];
for (let i = 1; i <= TOTAL_WARDS; i++) {
  const zoneDef = ZONES[(i - 1) % ZONES.length];
  const locality = zoneDef.localities[Math.floor((i - 1) / ZONES.length) % zoneDef.localities.length];
  wards.push({
    ward_id: i,
    ward_name: `${locality}${wards.filter(w => w.locality === locality).length ? ` (Ward ${i})` : ''}`,
    locality,
    zone: zoneDef.zone,
    bbox: zoneDef.bbox,
    pincode: pinForZone(ZONES.indexOf(zoneDef)),
  });
}

// ---- property generation ----
const rows = [];
let propCounter = 1;

for (const ward of wards) {
  const propertyCount = randInt(35, 65); // "lots and lots" — ~35-65 per ward × 98 wards
  for (let j = 0; j < propertyCount; j++) {
    const id = `GVMC-${String(ward.ward_id).padStart(3, '0')}-${String(j + 1).padStart(4, '0')}`;
    const detectionType = rand() < 0.62 ? 'new_build' : 'change_of_use';
    const confidence = randFloat(0.42, 0.98, 2);

    // signal breakdown roughly correlated with confidence, matching existing mock's approach
    const jitter = (base, spread) => parseFloat(Math.min(1, Math.max(0, base + (rand() - 0.5) * spread)).toFixed(2));
    const ndbiDelta = jitter(confidence * 0.95, 0.16);
    const areaDelta = jitter(confidence * 0.85, 0.20);
    const ndviDrop = jitter(confidence * 0.88, 0.18);
    const osmStatus = jitter(confidence * 0.75, 0.22);
    const dbMatch = jitter(confidence * 0.70, 0.24);

    const areaSqm = detectionType === 'new_build'
      ? randInt(80, 950)
      : randInt(60, 650);

    const lat = randFloat(ward.bbox.south, ward.bbox.north, 6);
    const lng = randFloat(ward.bbox.west, ward.bbox.east, 6);

    const doorNo = randInt(1, 45) + (rand() < 0.3 ? `-${randInt(1, 9)}` : '');
    const street = `${pick(STREET_WORDS)}`;
    const address = `D.No ${doorNo}, ${street}, ${ward.locality}, Visakhapatnam - ${ward.pincode}`;

    const status = weightedStatus();
    const propertyType = weightedPropertyType();
    const ownerName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

    // detection date: pipeline runs monthly-ish through 2024 (comparison year)
    const month = randInt(1, 12);
    const day = randInt(1, 28);
    const detectedAt = `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(randInt(1, 5)).padStart(2, '0')}:00:00Z`;

    // same rate the app already uses in stats.js: 80/sqm new_build, 40/sqm change_of_use, annualized
    const estimatedAnnualTaxInr = Math.round(areaSqm * (detectionType === 'new_build' ? 80 : 40));

    rows.push([
      id,
      ward.ward_id,
      ward.ward_name,
      ward.zone,
      lat,
      lng,
      `"${address}"`,
      ward.pincode,
      propertyType,
      areaSqm,
      detectionType,
      confidence,
      ndbiDelta,
      areaDelta,
      ndviDrop,
      osmStatus,
      dbMatch,
      2022,
      2024,
      detectedAt,
      status,
      estimatedAnnualTaxInr,
      `"${ownerName}"`,
      `mock/ward-${ward.ward_id}/${id}.json`,
    ]);
    propCounter++;
  }
}

const HEADER = [
  'property_id', 'ward_id', 'ward_name', 'zone', 'lat', 'lng', 'address', 'pincode',
  'property_type', 'area_sqm', 'detection_type', 'confidence', 'ndbi_delta', 'area_delta',
  'ndvi_drop', 'osm_status', 'db_match', 'baseline_year', 'comparison_year', 'detected_at',
  'status', 'estimated_annual_tax_inr', 'owner_name', 's3_geojson_key',
];

const csv = [HEADER.join(','), ...rows.map((r) => r.join(','))].join('\n') + '\n';

writeFileSync(new URL('./gvmc_properties_mock.csv', import.meta.url), csv, 'utf-8');

// Companion wards reference file (small, useful for WardSelector-style testing)
const wardHeader = ['ward_id', 'ward_name', 'zone', 'pincode', 'bbox_north', 'bbox_south', 'bbox_east', 'bbox_west', 'property_count'];
const wardRows = wards.map((w) => {
  const count = rows.filter((r) => r[1] === w.ward_id).length;
  return [w.ward_id, `"${w.ward_name}"`, w.zone, w.pincode, w.bbox.north, w.bbox.south, w.bbox.east, w.bbox.west, count].join(',');
});
const wardCsv = [wardHeader.join(','), ...wardRows].join('\n') + '\n';
writeFileSync(new URL('./gvmc_wards_reference.csv', import.meta.url), wardCsv, 'utf-8');

console.log(`Generated ${rows.length} property rows across ${wards.length} wards.`);
console.log(`Status distribution:`, STATUS_ENUM.map((s) => `${s}=${rows.filter(r => r[20] === s).length}`).join(', '));
console.log(`Detection type distribution: new_build=${rows.filter(r => r[10] === 'new_build').length}, change_of_use=${rows.filter(r => r[10] === 'change_of_use').length}`);
