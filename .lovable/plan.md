

## Plan: Add `goal_metric` field to school_similarities

### 1. Database Migration
Add a nullable `text` column `goal_metric` to the `school_similarities` table.

```sql
ALTER TABLE public.school_similarities ADD COLUMN goal_metric text;
```

### 2. Edge Function Update (`supabase/functions/import-school-data/index.ts`)
- Add `goal_metric: string` to the `SchoolRow` interface (after `euclidean_distance`)
- Include `goal_metric` in the similarities mapping so it gets upserted

### 3. Import Page Update (`src/pages/ImportData.tsx`)
- Add `goal_metric` to `ParsedRow` interface
- Parse it from the Excel column (e.g. `r["Goal Metric"]`) as a string

### 4. ComparableSchools Page (`src/pages/ComparableSchools.tsx`)
- Add `goal_metric` to `DbSimilarSchool` interface
- Optionally filter queries by `goal_metric` when a specific metric is selected

