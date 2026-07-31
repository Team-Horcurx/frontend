# Routing Rule

Always apply these rules when adding or modifying routes.

## Route Registration

Every new route needs a `<Route>` entry in `src/App.jsx`. There are **no ACLs and no ProtectedRoute** — all routes are public (no authentication in this project).

## Route Structure

```jsx
// src/App.jsx
<BrowserRouter>
  <Navbar />                          {/* always visible — role switcher */}
  <Routes>
    <Route path="/"             element={<HomePage />} />
    <Route path="/officer"      element={<FieldOfficerView />} />
    <Route path="/supervisor"   element={<SupervisorView />} />
    <Route path="/commissioner" element={<CommissionerView />} />
    <Route path="/admin"        element={<AdminPanel />} />
  </Routes>
</BrowserRouter>
```

## No Authentication

- Do NOT add `ProtectedRoute`, auth guards, or JWT checks — all routes are open
- Do NOT add role-based access control — the Navbar lets judges switch roles freely
- Do NOT check `localStorage` for session state

## Navigation

Use `useNavigate()` from `react-router-dom` for programmatic navigation. Use `<Link>` for static nav links. The `Navbar` component handles role switching directly via `<Link>`.

## New View Guidelines

When adding a new top-level view:
1. Create the view file in `src/views/`
2. Add the `<Route>` in `src/App.jsx`
3. Add a nav link in `Navbar` if it needs a role button
