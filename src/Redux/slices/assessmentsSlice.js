import { createSlice } from '@reduxjs/toolkit';

// Shared assessment state — submitted by Field Officers, reviewed by Supervisors.
// Mock/local only for now (no API yet). Kept as a normal RTK slice (not
// Context) since this project's centralized store already is Redux — see
// .claude/rules/redux.md. When a real backend lands, `submitAssessment` and
// `updateAssessmentStatus` become createAsyncThunk calls against
// POST /api/assessments / PATCH /api/assessments/{id} with the same payload
// shape, and mapAPIToUI/mapUIToAPI slot in exactly like every other slice.

export function mapAPIToUI(assessment) {
  return {
    id: assessment.id,
    propertyId: assessment.property_id,
    ownerName: assessment.owner_name,
    doorNumber: assessment.door_number,
    surveyNumber: assessment.survey_number,
    wardId: assessment.ward_id,
    wardName: assessment.ward_name,
    locality: assessment.locality,
    coordinates: assessment.coordinates,
    constructionType: assessment.construction_type,
    floors: assessment.floors,
    builtUpAreaSqm: assessment.built_up_area_sqm,
    newlyConstructedAreaSqm: assessment.newly_constructed_area_sqm,
    violationType: assessment.violation_type,
    officerRemarks: assessment.officer_remarks,
    estimatedTaxImpactInr: assessment.estimated_tax_impact_inr,
    estimatedPenaltyInr: assessment.estimated_penalty_inr,
    recommendedAction: assessment.recommended_action,
    baseYear: assessment.base_year,
    compareYear: assessment.compare_year,
    ndbiChange: assessment.ndbi_change,
    areaDifferenceSqm: assessment.area_difference_sqm,
    confidence: assessment.confidence,
    detectionType: assessment.detection_type,
    submittedAt: assessment.submitted_at,
    officerId: assessment.officer_id,
    status: assessment.status ?? 'pending_review',
  };
}

export function mapUIToAPI(assessment) {
  return {
    property_id: assessment.propertyId,
    owner_name: assessment.ownerName,
    door_number: assessment.doorNumber,
    survey_number: assessment.surveyNumber,
    ward_id: assessment.wardId,
    ward_name: assessment.wardName,
    locality: assessment.locality,
    coordinates: assessment.coordinates,
    construction_type: assessment.constructionType,
    floors: assessment.floors,
    built_up_area_sqm: assessment.builtUpAreaSqm,
    newly_constructed_area_sqm: assessment.newlyConstructedAreaSqm,
    violation_type: assessment.violationType,
    officer_remarks: assessment.officerRemarks,
    estimated_tax_impact_inr: assessment.estimatedTaxImpactInr,
    estimated_penalty_inr: assessment.estimatedPenaltyInr,
    recommended_action: assessment.recommendedAction,
    base_year: assessment.baseYear,
    compare_year: assessment.compareYear,
    ndbi_change: assessment.ndbiChange,
    area_difference_sqm: assessment.areaDifferenceSqm,
    confidence: assessment.confidence,
    detection_type: assessment.detectionType,
  };
}

// Mock officer identity — stands in for whatever auth/session would provide.
const MOCK_OFFICER_ID = 'OFF-1042';

let nextId = 1;

const assessmentsSlice = createSlice({
  name: 'assessments',
  initialState: {
    items: [],
    lastSubmittedId: null,
  },
  reducers: {
    submitAssessment: {
      reducer(state, action) {
        state.items.unshift(action.payload);
        state.lastSubmittedId = action.payload.id;
      },
      prepare(formValues) {
        return {
          payload: {
            ...formValues,
            id: `ASMT-${String(nextId++).padStart(4, '0')}`,
            officerId: MOCK_OFFICER_ID,
            submittedAt: new Date().toISOString(),
            status: 'pending_review',
          },
        };
      },
    },
    updateAssessmentStatus(state, action) {
      const { id, status } = action.payload;
      const item = state.items.find((a) => a.id === id);
      if (item) item.status = status;
    },
    clearLastSubmitted(state) {
      state.lastSubmittedId = null;
    },
  },
});

export const { submitAssessment, updateAssessmentStatus, clearLastSubmitted } = assessmentsSlice.actions;

export const selectAssessments = (state) => state.assessments.items;
export const selectPendingAssessments = (state) =>
  state.assessments.items.filter((a) => a.status === 'pending_review');
export const selectPendingAssessmentsCount = (state) => selectPendingAssessments(state).length;
export const selectLastSubmittedId = (state) => state.assessments.lastSubmittedId;

export default assessmentsSlice.reducer;
