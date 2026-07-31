// Derives two earlier-year property snapshots (2022, 2024) FROM the existing
// gvmc_properties_mock.csv, which is treated as the current/2026 state and is
// never modified by this script. The point is a genuine 3-point time series
// for change detection, not three unrelated random datasets:
//
//   - A property that is `new_build` in the 2026 file, by definition, did NOT
//     exist yet in 2022. Some fraction (already constructed by 2024, just not
//     flagged until the current cycle — matching the real project's backlog
//     narrative) also appear in the 2024 snapshot; the rest appear in neither.
//   - A property that is `change_of_use` in the 2026 file already existed
//     before — it appears in ALL THREE years, with a smaller area_sqm the
//     further back you go (2022 < 2024 < 2026), representing the physical
//     expansion the detection pipeline is meant to catch.
//
// Run: node generate_historical_snapshots.mjs (from src/mockData/)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20220101);
const randFloat = (min, max, dp = 2) => parseFloat((rand() * (max - min) + min).toFixed(dp));
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const header = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const obj = {};
    header.forEach((h, i) => { obj[h] = cells[i]; });
    return obj;
  });
}
function splitLine(line) {
  const out = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (c === ',' && !inQuotes) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}
function csvField(value) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const source = parseCSV(readFileSync(path.join(HERE, 'gvmc_properties_mock.csv'), 'utf-8'));

const HEADER = [
  'property_id', 'ward_id', 'ward_name', 'zone', 'lat', 'lng', 'address', 'pincode',
  'property_type', 'area_sqm', 'snapshot_year', 's3_geojson_key',
];

const rows2022 = [];
const rows2024 = [];

function baseFields(row) {
  return [
    row.property_id, row.ward_id, row.ward_name, row.zone, row.lat, row.lng,
    csvField(row.address), row.pincode, row.property_type,
  ];
}

for (const row of source) {
  const finalArea = parseFloat(row.area_sqm);

  if (row.detection_type === 'change_of_use') {
    // Already existed before 2026 — present in every snapshot, smaller footprint earlier.
    const area2022 = Math.round(finalArea * randFloat(0.55, 0.75));
    const area2024 = Math.round(finalArea * randFloat(0.80, 0.92));
    rows2022.push([...baseFields(row), area2022, 2022, `mock/ward-${row.ward_id}/${row.property_id}-2022.json`]);
    rows2024.push([...baseFields(row), area2024, 2024, `mock/ward-${row.ward_id}/${row.property_id}-2024.json`]);
  } else {
    // new_build relative to the 2026 cycle — never existed in 2022. ~40% of
    // these were already built (just not yet flagged) by 2024.
    if (rand() < 0.4) {
      rows2024.push([...baseFields(row), finalArea, 2024, `mock/ward-${row.ward_id}/${row.property_id}-2024.json`]);
    }
  }
}

function writeSnapshot(filename, rows) {
  const csv = [HEADER.join(','), ...rows.map((r) => r.join(','))].join('\n') + '\n';
  writeFileSync(path.join(HERE, filename), csv, 'utf-8');
  console.log(`Wrote ${rows.length} rows to ${filename}`);
}

writeSnapshot('gvmc_properties_2022.csv', rows2022);
writeSnapshot('gvmc_properties_2024.csv', rows2024);
