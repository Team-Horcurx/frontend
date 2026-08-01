import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client.js';

export function mapYearPairsAPIToUI(pairs) {
  return (pairs ?? []).map((p) => ({
    baselineYear: p.baseline_year,
    comparisonYear: p.comparison_year,
  }));
}

/**
 * Picks a default (baselineYear, comparisonYear) selection that is guaranteed
 * to be one of the actual pairs returned by the backend (never a synthesized
 * combination that doesn't exist in the data). Prefers the widest year span;
 * ties break on the earliest baseline year.
 */
export function pickDefaultPair(pairs) {
  if (!pairs || pairs.length === 0) return null;
  return pairs.reduce((best, p) => {
    const span = p.comparisonYear - p.baselineYear;
    const bestSpan = best.comparisonYear - best.baselineYear;
    if (span > bestSpan) return p;
    if (span === bestSpan && p.baselineYear < best.baselineYear) return p;
    return best;
  }, pairs[0]);
}

export const fetchWardYears = createAsyncThunk(
  'ndbi/fetchWardYears',
  async (wardId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/wards/${wardId}/years`);
      return mapYearPairsAPIToUI(data.pairs);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchNdbiGrid = createAsyncThunk(
  'ndbi/fetchGrid',
  async ({ wardId, baselineYear, comparisonYear }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/wards/${wardId}/ndbi`, {
        params: { baseline_year: baselineYear, comparison_year: comparisonYear },
      });
      return { grid: data, legend: data.legend ?? null };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export function mapComparisonAPIToUI(data) {
  return {
    newStructures: data.new_structures,
    changeOfUse: data.change_of_use,
    builtUpAreaIncreaseSqm: data.built_up_area_increase_sqm,
    estimatedAssessableAreaSqm: data.estimated_assessable_area_sqm,
    avgNdbiChange: data.avg_ndbi_change,
    estimatedTaxImpactInr: data.estimated_tax_impact_inr,
  };
}

export const fetchComparisonStats = createAsyncThunk(
  'ndbi/fetchComparisonStats',
  async ({ wardId, baselineYear, comparisonYear }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/wards/${wardId}/comparison`, {
        params: { baseline_year: baselineYear, comparison_year: comparisonYear },
      });
      return mapComparisonAPIToUI(data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const ndbiSlice = createSlice({
  name: 'ndbi',
  initialState: {
    yearPairs: [],
    yearsStatus: 'idle',
    grid: null,
    legend: null,
    gridStatus: 'idle',
    comparisonStats: null,
    comparisonStatus: 'idle',
    error: null,
  },
  reducers: {
    clearGrid(state) {
      state.grid = null;
      state.legend = null;
      state.gridStatus = 'idle';
    },
    clearComparisonStats(state) {
      state.comparisonStats = null;
      state.comparisonStatus = 'idle';
    },
    clearErrors(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWardYears.pending, (state) => {
        state.yearsStatus = 'loading';
        state.yearPairs = [];
      })
      .addCase(fetchWardYears.fulfilled, (state, action) => {
        state.yearsStatus = 'succeeded';
        state.yearPairs = action.payload;
      })
      .addCase(fetchWardYears.rejected, (state, action) => {
        state.yearsStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchNdbiGrid.pending, (state) => { state.gridStatus = 'loading'; })
      .addCase(fetchNdbiGrid.fulfilled, (state, action) => {
        state.gridStatus = 'succeeded';
        state.grid = action.payload.grid;
        state.legend = action.payload.legend;
      })
      .addCase(fetchNdbiGrid.rejected, (state, action) => {
        state.gridStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchComparisonStats.pending, (state) => { state.comparisonStatus = 'loading'; })
      .addCase(fetchComparisonStats.fulfilled, (state, action) => {
        state.comparisonStatus = 'succeeded';
        state.comparisonStats = action.payload;
      })
      .addCase(fetchComparisonStats.rejected, (state, action) => {
        state.comparisonStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearGrid, clearComparisonStats, clearErrors } = ndbiSlice.actions;

export const selectWardYearPairs = (state) => state.ndbi.yearPairs;
export const selectWardYearsStatus = (state) => state.ndbi.yearsStatus;
export const selectNdbiGrid = (state) => state.ndbi.grid;
export const selectNdbiLegend = (state) => state.ndbi.legend;
export const selectNdbiGridStatus = (state) => state.ndbi.gridStatus;
export const selectNdbiError = (state) => state.ndbi.error;
export const selectComparisonStats = (state) => state.ndbi.comparisonStats;
export const selectComparisonStatus = (state) => state.ndbi.comparisonStatus;

export default ndbiSlice.reducer;
