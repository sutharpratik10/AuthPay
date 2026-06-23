# Analytics Dashboard — Improved Implementation Plan

## Decisions on Open Questions

### 1. Layout Persistence
Use the database (`userPreferences.dashboardLayout` JSONB) from day one. `localStorage` breaks across devices and browsers, and admins expect their layout to roam. The DB cost is trivial.

### 2. Date Range Filters
Include: **Last 7 Days**, **Last 30 Days**, **Last 90 Days**, **Year-to-Date**, and a **Custom Range** picker. These cover 95% of admin reporting needs without over-engineering. The selected range should be part of the URL query string (`?range=30d`) so dashboards are shareable and bookmarkable.

### 3. Library Approvals
- `recharts` — approved, already in the React ecosystem and tree-shakeable.
- `react-grid-layout` — approved with one caveat: it requires `react-resizable` and ships its own CSS. Ensure the CSS imports are added to the **global stylesheet**, not per-component, to avoid flash-of-unstyled-grid on load.

---

## Gaps & Improvements

### Architecture

**Missing: a data-fetching layer abstraction.** The plan jumps straight to Server Actions, but analytics queries tend to be slow and expensive. Add a caching layer:

```
DB → Server Action → unstable_cache (Next.js) → Client Component
```

Cache each metric separately with a **5-minute TTL** and a tagged revalidation key (e.g., `revenue-data`, `user-growth`) so a manual "Refresh" button can revalidate only the stale widget, not the whole dashboard.

**Missing: loading and error states per widget.** Each chart widget should independently show a skeleton, an error boundary, and a retry button. If `getChurnRateData` fails, the Revenue chart should still render. Use **React Suspense boundaries per widget** in `DashboardGrid.tsx`.

---

### Database Schema

The proposed `dashboardLayout` JSONB column is correct, but define the shape explicitly with a **Zod schema** and store it validated — never raw. The layout payload should include:

```ts
type WidgetLayout = {
  id: string;           // e.g. "revenue-chart"
  x: number; y: number; w: number; h: number; // react-grid-layout fields
  chartType: "revenue" | "user-growth" | "churn";
  dateRange: "7d" | "30d" | "90d" | "ytd" | { from: string; to: string };
  isVisible: boolean;
}
```

This means each widget can have its **own** date range, which is a common admin need (e.g., Revenue YTD alongside Churn last 30 days).

---

### Server Actions

Add these two that were missed:

- The server pushes metric updates to the client over a persistent HTTP connection. No polling, no WebSocket overhead.
`// src/app/(admin)/dashboard/analytics/stream/route.ts`
``` typescript
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);

      const interval = setInterval(async () => {
        const revenue = await getRevenueData();
        send({ type: "revenue", payload: revenue });
      }, 30_000); // push every 30s

      // cleanup on disconnect
      return () => clearInterval(interval);
    }
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" }
  });
}
```
On the client, each widget subscribes to its event type via EventSource. Works natively in the browser, no extra library needed, and Next.js Route Handlers support it out of the box.
Best for: dashboards where data changes every 30–60 seconds (revenue totals, user counts).

- `getAvailableWidgets()` — returns the list of all chart types with metadata (label, description, default size), used to populate the Widget Selector

Also, all four data-fetch actions should accept a `dateRange` parameter, not hardcode a period.

---

### UI Components

#### `DashboardGrid.tsx`
Add a `isEditMode` toggle. When **off**, drag/resize handles are hidden and the grid is static. This prevents accidental layout changes. Persist edit mode state in `useState` only (no DB needed).

#### `RevenueChart.tsx`
Use an **Area chart** with a gradient fill. Include a `ReferenceLine` for the revenue target if one exists in the DB. Add a tooltip formatter that shows currency with locale formatting (`Intl.NumberFormat`).

#### `UserGrowthChart.tsx`
Use a **Composed chart (Line + Bar)** rather than just a Line chart. New users as bars, active users as a line. This gives better visual separation between acquisition and retention signals.

#### `ChurnRateChart.tsx`
Add a `ReferenceLine` at the acceptable churn threshold (configurable). Color bars conditionally:
- 🟢 **Green** — below threshold
- 🟡 **Amber** — 1–2× threshold
- 🔴 **Red** — above threshold

This is far more actionable than a plain bar chart.

#### `WidgetSelector.tsx`
Implement as a **slide-over** (not modal) so admins can see the live dashboard while choosing widgets. Show a small preview thumbnail of each chart type. Disable already-active widgets with a checkmark rather than hiding them, so admins know what's already on the board.

#### `MetricSummaryCard.tsx` *(new — missing from original plan)*
The plan is missing KPI summary cards — single-number callouts for:
- Total Revenue
- MoM Growth %
- Active Users
- Current Churn Rate

These should sit **above the grid** as a fixed non-draggable row. They're the first thing admins read.

---

### Pages

`analytics/page.tsx` should be a **Server Component** that prefetches all four data actions in parallel using `Promise.all` and passes them as props to client components. Don't let each chart fetch independently on mount — this causes a waterfall. and call this analytics/page.tsx into http://localhost:3000/protected/admin/dashboard replacing the existing content on the dashbord.

```ts
const [revenue, growth, churn, layout] = await Promise.all([
  getRevenueData(defaultRange),
  getUserGrowthData(defaultRange),
  getChurnRateData(defaultRange),
  getDashboardLayout(userId),
]);
```

---

### Dependencies (Revised)

```json
{
  "recharts": "^2.12.x",
  "react-grid-layout": "^1.4.x",
  "react-resizable": "^3.0.x",
  "date-fns": "^3.x"
}
```

> **Note:** `date-fns` was missing from the original plan but is needed for computing relative date ranges (e.g., Last 30 Days) consistently on the server side.

---

### Proposed Changes (Revised)

#### [MODIFY] `package.json`
- Install `recharts`, `react-grid-layout`, `react-resizable`, `date-fns`

#### [MODIFY] `src/server/db/schema/schema.ts`
- Add `dashboardLayout` JSONB column to `userPreferences` table
- Define and enforce shape with a Zod schema before write

#### [NEW] `src/app/(admin)/dashboard/actions/analytics.ts`
- `getRevenueData(dateRange)`
- `getUserGrowthData(dateRange)`
- `getChurnRateData(dateRange)`
- `saveDashboardLayout(userId, layout)`
- `getDashboardLayout(userId)`
- `revalidateDashboardCache(tag)` ← new
- `getAvailableWidgets()` ← new

#### [NEW] `src/components/analytics/DashboardGrid.tsx`
- Main grid using `react-grid-layout`
- `isEditMode` toggle to show/hide drag handles
- Suspense boundary per widget

#### [NEW] `src/components/analytics/MetricSummaryCard.tsx` ← new
- Fixed non-draggable KPI row above the grid

#### [NEW] `src/components/analytics/charts/RevenueChart.tsx`
- Area chart with gradient fill and revenue target `ReferenceLine`

#### [NEW] `src/components/analytics/charts/UserGrowthChart.tsx`
- Composed chart: bars (new users) + line (active users)

#### [NEW] `src/components/analytics/charts/ChurnRateChart.tsx`
- Bar chart with conditional coloring and threshold `ReferenceLine`

#### [NEW] `src/components/analytics/WidgetSelector.tsx`
- Slide-over (not modal) with chart previews and active-state checkmarks

#### [NEW] `src/app/(admin)/dashboard/analytics/page.tsx`
- Server Component with parallel `Promise.all` prefetch
- URL query param `?range=30d` for shareable date ranges

---

## Verification Plan

### Original Steps (Retained)
- Log in as Admin and navigate to the Analytics Dashboard.
- Verify Revenue, User Growth, and Churn Rate charts render correctly.
- Drag, drop, and resize widgets; refresh to confirm layout persists.
- Add a widget from the Widget Selector and verify it appears on the dashboard.

### Additional Verification Steps
- **Performance check** — Open DevTools Network tab and confirm chart data is served from cache (response time < 50ms) on second load.
- **Empty state** — Verify each widget renders a sensible empty state when no data exists for the selected range (not a broken or blank chart).
- **Permission guard** — Confirm non-admin roles receive a 403 redirect when directly hitting `/admin/dashboard/analytics` — not just a hidden link.
- **Layout reset** — Trigger "Reset to Default", verify original layout is restored, and confirm it persists on page refresh.
- **Per-widget date range** — Set Revenue to YTD and Churn to Last 30 Days; refresh and confirm both ranges are independently preserved.
- **Refresh button** — Click per-widget Refresh and confirm only that widget's cache is revalidated (check Network tab for a single re-fetch, not a full page reload).