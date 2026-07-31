function makeProperty(id, wardId, lat, lng, type, conf, status, areaSqm) {
  const jitter = (base, range) => parseFloat(Math.min(1, Math.max(0, base + (range * (id.charCodeAt(id.length - 1) % 10) / 10 - range / 2))).toFixed(2));
  const cb = {
    ndbi_delta: jitter(conf * 0.95, 0.08),
    area_delta: jitter(conf * 0.85, 0.12),
    osm_status: jitter(conf * 0.75, 0.15),
    ndvi_drop:  jitter(conf * 0.88, 0.10),
    db_match:   jitter(conf * 0.78, 0.14),
  };
  const aiText = status !== 'pending'
    ? `**Analysis for property ${id}**: This property scores ${Math.round(conf * 100)}% confidence for ${type === 'new_build' ? 'new construction' : 'change of use'}.\n\n` +
      `NDBI delta (${Math.round(cb.ndbi_delta * 100)}%) indicates significant built-up area increase between 2022 and 2024 satellite passes. ` +
      `OSM database shows no registered structure at this location as of last sync.\n\n` +
      `**Recommendation**: ${conf >= 0.8 ? 'High priority — schedule field verification within 7 days.' : 'Moderate priority — include in next inspection cycle.'}`
    : null;
  return {
    id,
    ward_id: wardId,
    lat,
    lng,
    area_sqm: areaSqm,
    detection_type: type,
    confidence: conf,
    confidence_breakdown: cb,
    detected_at: new Date(Date.UTC(2026, 6, 1) - (id.length * 86400000) % (25 * 86400000)).toISOString(),
    s3_geojson_key: `mock/ward-${wardId}/${id}.json`,
    status,
    ai_explanation: aiText,
  };
}

export const PROPERTIES = [
  // Ward 1 — Seethammadhara (8 properties)
  makeProperty('prop-w1-001', '1', 17.730, 83.295, 'new_build',    0.92, 'pending',          312),
  makeProperty('prop-w1-002', '1', 17.722, 83.301, 'change_of_use',0.74, 'verified',         188),
  makeProperty('prop-w1-003', '1', 17.735, 83.308, 'new_build',    0.87, 'pending',          445),
  makeProperty('prop-w1-004', '1', 17.718, 83.285, 'new_build',    0.61, 'false_positive',   220),
  makeProperty('prop-w1-005', '1', 17.741, 83.291, 'change_of_use',0.83, 'underassessed',    567),
  makeProperty('prop-w1-006', '1', 17.724, 83.298, 'new_build',    0.55, 'pending',          134),
  makeProperty('prop-w1-007', '1', 17.737, 83.304, 'change_of_use',0.79, 'already_assessed', 299),
  makeProperty('prop-w1-008', '1', 17.716, 83.289, 'new_build',    0.94, 'pending',          680),

  // Ward 2 — Gopalapatnam (6 properties)
  makeProperty('prop-w2-001', '2', 17.762, 83.258, 'new_build',    0.88, 'pending',          401),
  makeProperty('prop-w2-002', '2', 17.755, 83.265, 'change_of_use',0.70, 'verified',         172),
  makeProperty('prop-w2-003', '2', 17.768, 83.270, 'new_build',    0.45, 'false_positive',   290),
  makeProperty('prop-w2-004', '2', 17.751, 83.252, 'change_of_use',0.82, 'pending',          510),
  makeProperty('prop-w2-005', '2', 17.773, 83.262, 'new_build',    0.91, 'underassessed',    623),
  makeProperty('prop-w2-006', '2', 17.759, 83.256, 'change_of_use',0.66, 'pending',          245),

  // Ward 3 — Maddilapalem (4 properties)
  makeProperty('prop-w3-001', '3', 17.714, 83.285, 'new_build',    0.77, 'pending',          356),
  makeProperty('prop-w3-002', '3', 17.708, 83.292, 'change_of_use',0.89, 'verified',         428),
  makeProperty('prop-w3-003', '3', 17.721, 83.279, 'new_build',    0.53, 'pending',          198),
  makeProperty('prop-w3-004', '3', 17.704, 83.298, 'change_of_use',0.72, 'already_assessed', 334),

  // Ward 4 — Asilmetta (10 properties — highest count for demo impact)
  makeProperty('prop-w4-001', '4', 17.698, 83.215, 'new_build',    0.96, 'pending',          789),
  makeProperty('prop-w4-002', '4', 17.692, 83.221, 'change_of_use',0.81, 'verified',         267),
  makeProperty('prop-w4-003', '4', 17.703, 83.208, 'new_build',    0.74, 'pending',          412),
  makeProperty('prop-w4-004', '4', 17.687, 83.225, 'new_build',    0.88, 'underassessed',    555),
  makeProperty('prop-w4-005', '4', 17.695, 83.212, 'change_of_use',0.67, 'false_positive',   189),
  makeProperty('prop-w4-006', '4', 17.701, 83.218, 'new_build',    0.93, 'pending',          632),
  makeProperty('prop-w4-007', '4', 17.688, 83.207, 'change_of_use',0.58, 'pending',          143),
  makeProperty('prop-w4-008', '4', 17.707, 83.222, 'new_build',    0.85, 'verified',         478),
  makeProperty('prop-w4-009', '4', 17.694, 83.214, 'change_of_use',0.79, 'pending',          321),
  makeProperty('prop-w4-010', '4', 17.690, 83.219, 'new_build',    0.71, 'already_assessed', 265),

  // Ward 5 — Dwaraka Nagar (4 properties)
  makeProperty('prop-w5-001', '5', 17.682, 83.205, 'new_build',    0.84, 'pending',          398),
  makeProperty('prop-w5-002', '5', 17.676, 83.211, 'change_of_use',0.69, 'verified',         234),
  makeProperty('prop-w5-003', '5', 17.689, 83.197, 'new_build',    0.77, 'pending',          312),
  makeProperty('prop-w5-004', '5', 17.673, 83.203, 'change_of_use',0.91, 'underassessed',    589),
];
