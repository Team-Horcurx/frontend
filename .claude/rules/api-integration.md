# API Integration Rule

Always apply these rules when making any HTTP requests or integrating with the backend.

## HTTP Client

- Always import the axios instance from `src/api/client.js`, not raw `axios`
  ```js
  import api from '../../../api/client';       // from slice files
  import api from '../../api/client';          // from component files
  ```
- The client reads `import.meta.env.VITE_API_URL` as the base URL — never hardcode it
- There is **no authentication** — no JWT headers, no auth middleware. All endpoints are public.
- Never handle 4xx errors in individual components — handle globally in the client interceptor if needed

## URL Construction

- Always use the `api` instance directly with relative paths: `api.get('/api/wards')`
- Never construct full URLs by concatenating `VITE_API_URL` manually in components

## API Endpoints Reference

```
GET    /api/wards
GET    /api/wards/{id}/changes           → S3 presigned URL (GeoJSON polygons)
GET    /api/wards/{id}/unassessed
GET    /api/wards/{id}/underassessed
GET    /api/stats
GET    /api/stats/all-wards              → Commissioner data
GET    /api/properties/{id}             → property detail + AI explanation
POST   /api/properties/{id}/verify      → { status: 'verified' | 'underassessed' | ... }
POST   /api/alerts/export               → CSV export → S3 presigned URL
POST   /api/admin/upload-csv
POST   /api/admin/db-config
POST   /api/admin/refresh               → triggers EC2 pipeline via SSM
POST   /api/chat                        → { message: string } → Bedrock Agent response
```

## Data Mapping

- Always run `mapAPIToUI(item)` when processing API responses in fulfilled handlers
- Always run `mapUIToAPI(formData)` before sending POST/PUT payloads (inside the thunk)
- Never use raw API snake_case field names directly in JSX — they must go through the mapper

## Request Structure

- For DELETE requests, pass the id in the request body: `{ data: { id } }`
- For paginated GETs, pass: `{ params: { page, pageSize, ...filters } }`
- For CSV upload, use `multipart/form-data` (override the default `Content-Type`)
