# Redux Rule

Always apply these rules when writing Redux state management code.

## Slice Creation

- Always use Redux Toolkit `createSlice` + `createAsyncThunk` — there is no legacy Actions/Reducers pattern in this project
- Place all slices in `src/Redux/slices/` named `{feature}Slice.js`
- Register new slices in `src/Redux/Store.jsx`
- RTK v2 — use builder pattern in `createReducer`; `redux-thunk` is bundled in RTK (do not install separately)

## Required Slice Structure

Every slice must include:
- `mapAPIToUI(apiItem)` helper — converts API snake_case to component camelCase
- `mapUIToAPI(uiItem)` helper — converts component camelCase to API snake_case
- Initial state with: `items`, `status`, `error`, `createStatus`, `createError`, `updateStatus`, `updateError`
- Reset actions: `resetCreateStatus`, `resetUpdateStatus`, `clearErrors`
- Named selectors exported at the bottom

## Async Thunks

- Always use `rejectWithValue` in catch blocks
- Always use `mapUIToAPI()` before sending data to the API
- Always apply `mapAPIToUI()` to items in fulfilled handlers
- **No `org_id`** — there is no multi-tenancy in this project; never add org_id to any payload

## Status Tracking

- Status values must only be: `'idle' | 'loading' | 'succeeded' | 'failed'`
- Always reset status to `'idle'` after modals close or navigation occurs

## Selectors

- Never access Redux state directly in components (`state.wards.items`)
- Always use named selectors exported from the slice file

## Fetch Pattern

```js
useEffect(() => {
  if (status === 'idle') dispatch(fetchWards());
}, [status, dispatch]);
```

## GVMC Slice Examples

Slices to create (one per feature):
- `wardsSlice.js` — ward list, selected ward
- `propertiesSlice.js` — flagged properties per ward, selected property
- `verificationSlice.js` — verification status updates
- `statsSlice.js` — summary stats (officer/supervisor/commissioner)
- `chatSlice.js` — chatbot conversation history
- `adminSlice.js` — admin config, pipeline status, CSV upload

### Key Pattern for Map Data

```js
// GeoJSON for map polygons comes from S3 via presigned URL
// Fetch the presigned URL from the API, then fetch the GeoJSON content separately
export const fetchWardGeoJSON = createAsyncThunk(
  'wards/fetchGeoJSON',
  async (wardId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/wards/${wardId}/changes`);
      // data.presigned_url → fetch actual GeoJSON from S3
      const geoRes = await fetch(data.presigned_url);
      return await geoRes.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
```
