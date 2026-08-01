import reducer, {
  clearGrid,
  clearErrors,
  fetchWardYears,
  fetchNdbiGrid,
  mapYearPairsAPIToUI,
  pickDefaultPair,
} from './ndbiSlice.js';

const initialState = {
  yearPairs: [],
  yearsStatus: 'idle',
  grid: null,
  legend: null,
  gridStatus: 'idle',
  error: null,
};

describe('ndbiSlice', () => {
  it('returns the initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('maps API year pairs to UI shape', () => {
    const pairs = [{ baseline_year: 2022, comparison_year: 2024 }];
    expect(mapYearPairsAPIToUI(pairs)).toEqual([{ baselineYear: 2022, comparisonYear: 2024 }]);
    expect(mapYearPairsAPIToUI(undefined)).toEqual([]);
  });

  it('sets yearsStatus to loading and clears yearPairs on fetchWardYears.pending', () => {
    const state = reducer(
      { ...initialState, yearPairs: [{ baselineYear: 2022, comparisonYear: 2024 }] },
      { type: fetchWardYears.pending.type }
    );
    expect(state.yearsStatus).toBe('loading');
    expect(state.yearPairs).toEqual([]);
  });

  it('stores year pairs on fetchWardYears.fulfilled', () => {
    const payload = [{ baselineYear: 2022, comparisonYear: 2024 }];
    const state = reducer(initialState, { type: fetchWardYears.fulfilled.type, payload });
    expect(state.yearsStatus).toBe('succeeded');
    expect(state.yearPairs).toEqual(payload);
  });

  it('records the error on fetchWardYears.rejected', () => {
    const state = reducer(initialState, { type: fetchWardYears.rejected.type, payload: 'boom' });
    expect(state.yearsStatus).toBe('failed');
    expect(state.error).toBe('boom');
  });

  it('stores the grid and legend on fetchNdbiGrid.fulfilled', () => {
    const payload = { grid: { type: 'FeatureCollection', features: [] }, legend: { red: { color: '#dc3545' } } };
    const state = reducer(initialState, { type: fetchNdbiGrid.fulfilled.type, payload });
    expect(state.gridStatus).toBe('succeeded');
    expect(state.grid).toEqual(payload.grid);
    expect(state.legend).toEqual(payload.legend);
  });

  it('clearGrid resets grid/legend/gridStatus', () => {
    const populated = {
      ...initialState,
      grid: { type: 'FeatureCollection', features: [] },
      legend: { red: { color: '#dc3545' } },
      gridStatus: 'succeeded',
    };
    expect(reducer(populated, clearGrid())).toEqual(initialState);
  });

  it('clearErrors resets the error field only', () => {
    const withError = { ...initialState, error: 'boom' };
    expect(reducer(withError, clearErrors())).toEqual(initialState);
  });
});

describe('pickDefaultPair', () => {
  it('returns null when there are no pairs', () => {
    expect(pickDefaultPair([])).toBeNull();
    expect(pickDefaultPair(null)).toBeNull();
  });

  it('never synthesizes a combination absent from the input pairs', () => {
    // Ward 1: only 2022->2024 and 2024->2026 exist — NOT 2022->2026.
    // A naive "min year / max year" default would pick (2022, 2026), which
    // has zero matching properties and silently renders an all-green grid.
    const pairs = [
      { baselineYear: 2022, comparisonYear: 2024 },
      { baselineYear: 2024, comparisonYear: 2026 },
    ];
    const picked = pickDefaultPair(pairs);
    expect(pairs).toContainEqual(picked);
    expect(picked).not.toEqual({ baselineYear: 2022, comparisonYear: 2026 });
  });

  it('prefers the widest span, tie-breaking on the earliest baseline year', () => {
    const pairs = [
      { baselineYear: 2022, comparisonYear: 2024 },
      { baselineYear: 2024, comparisonYear: 2026 },
      { baselineYear: 2022, comparisonYear: 2026 },
    ];
    expect(pickDefaultPair(pairs)).toEqual({ baselineYear: 2022, comparisonYear: 2026 });
  });

  it('picks a real, existing pair for every seeded demo ward (schema.sql)', () => {
    const wardPairs = {
      1: [{ baselineYear: 2022, comparisonYear: 2024 }, { baselineYear: 2024, comparisonYear: 2026 }],
      2: [{ baselineYear: 2022, comparisonYear: 2024 }, { baselineYear: 2022, comparisonYear: 2026 }],
      3: [{ baselineYear: 2022, comparisonYear: 2024 }, { baselineYear: 2024, comparisonYear: 2026 }],
      4: [
        { baselineYear: 2022, comparisonYear: 2024 },
        { baselineYear: 2024, comparisonYear: 2026 },
        { baselineYear: 2022, comparisonYear: 2026 },
      ],
      5: [{ baselineYear: 2022, comparisonYear: 2024 }, { baselineYear: 2024, comparisonYear: 2026 }],
    };

    Object.values(wardPairs).forEach((pairs) => {
      const picked = pickDefaultPair(pairs);
      expect(pairs).toContainEqual(picked);
    });
  });
});
