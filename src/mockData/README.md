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
  | `baseline_year`, `comparison_year` | fixed `2022` / `2024` — the satellite comparison pair |
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
