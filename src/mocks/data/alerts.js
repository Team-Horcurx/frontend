const now = Date.now();
const ago = (h) => new Date(now - h * 3600000).toISOString();

export const ALERTS = {
  '1': [
    { id: 'alt-w1-1', severity: 'danger',  ward_id: '1', text: '8 high-confidence detections (>85%) in Seethammadhara sector B. Immediate field verification recommended before quarterly assessment deadline.', created_at: ago(2) },
    { id: 'alt-w1-2', severity: 'warning', ward_id: '1', text: 'Revenue leakage estimate for ward: ₹12.4L/year based on 3 underassessed commercial conversions on Nowroji Road.', created_at: ago(18) },
    { id: 'alt-w1-3', severity: 'info',    ward_id: '1', text: 'Pipeline last run completed successfully. 34 change polygons loaded. Next scheduled run: 01 Aug 2026.', created_at: ago(36) },
  ],
  '2': [
    { id: 'alt-w2-1', severity: 'warning', ward_id: '2', text: '3 properties near RK Beach Road show commercial activity without updated property tax classification.', created_at: ago(5) },
    { id: 'alt-w2-2', severity: 'info',    ward_id: '2', text: 'Low NDVI detected across 4 parcels — potential paving over green areas for parking. Confidence avg: 70%.', created_at: ago(24) },
  ],
  '3': [
    { id: 'alt-w3-1', severity: 'info',    ward_id: '3', text: 'Routine scan complete. 2 new build detections added to queue. No high-severity anomalies.', created_at: ago(48) },
  ],
  '4': [
    { id: 'alt-w4-1', severity: 'danger',  ward_id: '4', text: 'CRITICAL: 4 multi-story buildings detected in Asilmetta without corresponding building permits. Estimated annual revenue gap: ₹31.8L.', created_at: ago(1) },
    { id: 'alt-w4-2', severity: 'danger',  ward_id: '4', text: '2 properties reclassified from residential to commercial use without notification to assessment office.', created_at: ago(8) },
    { id: 'alt-w4-3', severity: 'warning', ward_id: '4', text: 'NDBI delta spike (avg 0.31) across Asilmetta Junction — bulk construction suggests multi-unit residential project.', created_at: ago(22) },
  ],
  '5': [
    { id: 'alt-w5-1', severity: 'warning', ward_id: '5', text: 'prop-w5-004 shows change-of-use with 91% confidence — hospitality / serviced apartment conversion near Dwaraka Nagar circle.', created_at: ago(12) },
    { id: 'alt-w5-2', severity: 'info',    ward_id: '5', text: '4 detections verified as false positives (reflective rooftop solar panels). Model refinement queued.', created_at: ago(60) },
  ],
};
