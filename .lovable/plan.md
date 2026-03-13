

## Plan: Import Updated HS Data and Filter by Goal Metric

The uploaded file `CPS_HS_Top10_Similar-2.xlsx` contains updated High School similarity data with the new `goal_metric` field. Two things need to happen:

### 1. Import the Data
You can import this file right now using the `/import` page — select it as the **HS File (9-12)** and click Import. The import pipeline already handles the `goal_metric` column.

### 2. Update ComparableSchools Query to Filter by Goal Metric
Currently, the query in `ComparableSchools.tsx` (line 104-117) fetches the top 10 by `euclidean_distance` regardless of goal metric. It should filter by `goal_metric` matching the selected metric so each goal shows its own peer set.

**Changes to `src/pages/ComparableSchools.tsx`:**
- Add `.eq("goal_metric", metricId)` (or the appropriate metric name mapping) to the query
- Add `metricId` to the `useEffect` dependency array so the list refreshes when the user switches metrics

This ensures that when viewing "Global Citizenship" goals, only similarity records tagged with that goal metric appear — matching the expected school list (ACERO TORRES, PECK, COOPER, etc.).

### Open Question
The `goal_metric` values in the Excel file need to match the metric IDs used in the app. I'll need to verify what values appear in the `Goal Metric` column of the uploaded file to set up the correct mapping.

