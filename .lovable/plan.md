

## Plan: Convert Metric Detail Page to a Dialog Modal

### What Changes

1. **Create `MetricDetailDialog` component** — A new Dialog component that receives `metricId` and `open`/`onClose` props, rendering the same content currently in `MetricDetail.tsx` (icon, name, description, "Why This Metric Matters", and "Set Goal" button).

2. **Update `GoalLanding.tsx`** — Add state for the selected metric ID. When "More Information" is clicked on a `MetricCard`, open the dialog instead of navigating. The "Set Goal" button inside the dialog navigates to `/goals/comparable?metric=...` and closes the dialog.

3. **Update `MetricCard.tsx`** — Change the "More Information" button to call a new `onMoreInfo(metricId)` callback prop instead of `navigate()`.

4. **Remove the `/goals/metric` route** from `App.tsx` and delete `src/pages/MetricDetail.tsx`.

### Files Modified
- `src/components/MetricDetailDialog.tsx` — new
- `src/components/MetricCard.tsx` — replace navigate with callback
- `src/pages/GoalLanding.tsx` — add dialog state + render dialog
- `src/App.tsx` — remove route + import

