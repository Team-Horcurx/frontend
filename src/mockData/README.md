# GVMC Mock Property Data

Large synthetic dataset for testing the Admin Panel CSV upload flow, seeding a
local/dev database, or stress-testing the frontend with realistic volume.
**Entirely fictional test data** — not sourced from GVMC's real property tax
roll or any real citizen records.

## Files

- **`gvmc_properties_mock.csv`** — 4,917 property detection records across all
  98 wards (~35–65 per ward). Schema matches the app's existing `properties`
  table / `mapAPIToUI` convention (snake_case, same field names as
  `src/mocks/data/properties.js`), flattened for CSV:

  | Column | Notes |
  |---|---|
  | `property_id` | `GVMC-{ward}-{seq}` |
  | `ward_id`, `ward_name`, `zone` | see `gvmc_wards_reference.csv` |
  | `lat`, `lng` | within the ward's real-ish bounding box |
  | `address`, `pincode` | synthetic; pincodes use the real Vizag 5300xx range |
  | `property_type` | Residential / Commercial / Mixed Use / Industrial / Vacant Land |
  | `area_sqm` | 60–950 |
  | `detection_type` | `new_build` \| `change_of_use` (matches `properties.detection_type` enum) |
  | `confidence`, `ndbi_delta`, `area_delta`, `ndvi_drop`, `osm_status`, `db_match` | flattened `confidence_breakdown`, 0–1 |
  | `baseline_year`, `comparison_year` | fixed `2022` / `2024` in this file's own values (unchanged from when it was generated) — but see "Historical comparison snapshots" below: this file is now *used* as the current/2026 snapshot, compared against the newer `gvmc_properties_2022.csv` / `gvmc_properties_2024.csv` files |
  | `detected_at` | ISO date within 2024 |
  | `status` | matches `verification_status` enum (`pending`/`verified`/`underassessed`/`false_positive`/`already_assessed`) |
  | `estimated_annual_tax_inr` | `area_sqm × 80` (new_build) or `× 40` (change_of_use) — same rate the app already uses in `src/mocks/data/stats.js` |
  | `owner_name` | fictional generated name, not a real person |
  | `s3_geojson_key` | mock S3 path, matches existing convention |

- **`gvmc_wards_reference.csv`** — the 98 wards with id, name, real GVMC zone,
  bbox, and property count per ward.

- **`generate_mock_csv.mjs`** — the deterministic generator (seeded, so
  re-running produces identical output). Run with `node generate_mock_csv.mjs`
  from this folder to regenerate both CSVs.

### Historical comparison snapshots (2022 / 2024)

`gvmc_properties_mock.csv` is treated as the **current** snapshot (2026) and
is never modified by the generator below. Two earlier-year snapshots are
*derived* from it, so the three years form a genuine, internally-consistent
time series rather than three unrelated random datasets:

- **`gvmc_properties_2022.csv`** (1,818 rows) and **`gvmc_properties_2024.csv`**
  (3,030 rows) — same location/identity columns as the main file
  (`property_id, ward_id, ward_name, zone, lat, lng, address, pincode,
  property_type`), plus a year-specific `area_sqm` and `snapshot_year`. They
  intentionally **drop** the detection-analysis columns (`confidence`,
  `ndbi_delta`, `detection_type`, `status`, etc.) — those are *outputs* of
  comparing two snapshots, not raw facts about a single year, so they don't
  belong in a historical snapshot.

- **The rule that makes the comparison meaningful**: a property that's
  `new_build` in the 2026 file, by definition, did not exist in 2022 — it's
  excluded from `gvmc_properties_2022.csv` entirely. ~40% of those (already
  constructed by 2024 but not flagged until the current detection cycle,
  matching the real project's "backlog" narrative) appear in
  `gvmc_properties_2024.csv`; the rest appear in neither. A property that's
  `change_of_use` in 2026 already existed before, so it appears in **all
  three** years, with `area_sqm` growing monotonically — 2022 is 55–75% of
  the final footprint, 2024 is 80–92%, 2026 is the full expanded size —
  representing the physical expansion the pipeline is meant to catch.

- **`generate_historical_snapshots.mjs`** — the deterministic generator for
  these two files. Reads `gvmc_properties_mock.csv`, never writes to it. Run
  with `node generate_historical_snapshots.mjs` from this folder.

- Validated: every 2022 ID ⊆ every 2024 ID ⊆ the 2026 source's IDs, every
  2022-file property is `change_of_use` in the source (never a `new_build`),
  `area_sqm` is non-decreasing across 2022 → 2024 → 2026 for every shared
  property, `snapshot_year` is correct, no duplicate IDs, schema consistent.
  11/11 checks passed.

## Provenance / what's real vs synthetic

- **Real**: GVMC has 98 wards across 8 zones (Bheemunipatnam, Madhurawada,
  Asilmetta, Suryabagh, Gnanapuram, Gajuwaka, Anakapalli, Vepagunta) —
  confirmed via Wikipedia's GVMC article. The locality names used per zone
  (e.g. Dwaraka Nagar, MVP Colony, Gajuwaka, Madhurawada) are real
  Visakhapatnam neighborhoods. Vizag's postal codes really do fall in the
  530001–530049 range.
- **Synthetic**: which ward number maps to which locality/zone boundary,
  every lat/lng, every property record, every owner name, every confidence
  score and status. GVMC's own site and the AP Bhu-Naksha land-records portal
  weren't reachable from this environment to pull an official ward-boundary
  list, so ward-to-zone assignment is a plausible approximation, not
  surveyed data — treat it as good-enough for UI/API testing, not for demo
  claims about specific real wards.

## Validated

Checked for: schema/column consistency, no duplicate `property_id`, every
`ward_id` resolves to a real generated ward, `confidence` ∈ [0,1], sane
`area_sqm`, valid `detection_type`/`status` enums, coordinates within the
Vizag metro bounding box, `baseline_year`/`comparison_year` fixed correctly,
and `estimated_annual_tax_inr` matching the app's own revenue formula. 15/15
checks passed.
