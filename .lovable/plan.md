

## Plan: Save Goals, Current Goals Page, and Progress Tracking

### 1. Database: Create `school_goals` table

New table to persist saved goals:

```sql
CREATE TABLE public.school_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id text NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  metric_id text NOT NULL,
  academic_year text NOT NULL DEFAULT '2025-2026',
  baseline_value numeric NOT NULL,       -- last year (2023-24)
  start_value numeric NOT NULL,          -- start of year (2024 actual)
  goal_value numeric NOT NULL,           -- target
  mode text NOT NULL DEFAULT 'accept',   -- accept/modify/override
  rationale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, metric_id, academic_year)
);

ALTER TABLE public.school_goals ENABLE ROW LEVEL SECURITY;

-- Public read (matches existing pattern)
CREATE POLICY "Public read access for school_goals"
  ON public.school_goals FOR SELECT TO anon, authenticated
  USING (true);

-- Anyone can insert/update (no auth in app currently)
CREATE POLICY "Public insert school_goals"
  ON public.school_goals FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update school_goals"
  ON public.school_goals FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Public delete school_goals"
  ON public.school_goals FOR DELETE TO anon, authenticated
  USING (true);
```

### 2. Save goal on submit (`GoalCustomization.tsx`)

Update `handleSubmit` to INSERT/UPSERT into `school_goals` with the school_id, metric_id, baseline (last year value), start (current value), goal_value, mode, rationale, and academic_year `'2025-2026'`. On success, navigate to `/current-goals`.

### 3. Update `/goals` page (`GoalLanding.tsx`)

- Add header text: **"Set Academic Goals for Academic Year 2025-2026"**
- Fetch saved goals count for the selected school from `school_goals`
- If count > 0, show a prominent link/button: **"Review My Current Goals (N)"** that navigates to `/current-goals`

### 4. Sidebar: Rename 3rd nav item to "Current Goals" (`InnovareSidebar.tsx`)

Change the "Reports" item (3rd icon, `BarChart3`) to:
- Label: "Current Goals"
- Path: `/current-goals`
- Icon: keep `BarChart3` or switch to `ClipboardCheck`

### 5. New page: `/current-goals` (`CurrentGoals.tsx`)

**Header area:**
- Academic year dropdown (only "2025-2026" for now)
- School name display

**Mock progress calculation logic** (all client-side):
- School year: Sep 1, 2025 → Jul 1, 2026 (10 months)
- For each saved goal, generate monthly data points (Sep, Oct, Nov, ... Jul)
- For months in the past (relative to today's date Mar 13, 2026): calculate a "current actual" using linear interpolation from `start_value` toward `goal_value` with small random variability (seeded by metric_id for consistency)
- For future months: continue the projected line at the same pace
- "Current actual" = the value at the latest past month

**Line chart at top** (Recharts `LineChart`):
- X-axis: months Sep 2025 → Jul 2026
- One line per goal, each with the metric name in the legend
- Past data points: solid line, hoverable with tooltip showing value + metric unit
- Future data points: dashed/lighter opacity line to indicate projection
- Legend shows metric name and goal target

**Goal cards below the chart:**
Each saved goal displayed as a card showing:
- Metric icon + name
- Three key numbers: **Last Year** (baseline_value), **Start of Year** (start_value), **Current Actual** (computed), **Goal** (goal_value)
- A small progress indicator or bar

### 6. Routing (`App.tsx`)

Add route: `/current-goals` → `<CurrentGoals />`

### Files to Create/Modify

| File | Action |
|---|---|
| Database migration | Create `school_goals` table |
| `src/pages/CurrentGoals.tsx` | New page with chart + goal cards |
| `src/pages/GoalCustomization.tsx` | Save to database on submit |
| `src/pages/GoalLanding.tsx` | Add academic year header + "Review goals" link |
| `src/components/InnovareSidebar.tsx` | Change 3rd item to "Current Goals" |
| `src/App.tsx` | Add `/current-goals` route |

