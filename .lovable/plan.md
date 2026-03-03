

## Plan: School Report Card Modal

### What
When a school row is expanded, add a clickable "View Report Card" button (or make the school name in the expanded area clickable) that opens a Dialog modal showing a detailed report card for that school.

### Changes

**1. Add mock report card data to `ComparableSchool` interface and data** (`src/data/mockData.ts`)
- Extend the `ComparableSchool` interface with optional detailed fields: `principal`, `studentTeacherRatio`, `freeReducedLunch`, `chronicAbsenteeism`, `mathProficiency`, `elaProficiency`, `suspensionRate`, `teacherRetention`.
- Add these fields to each school in `comparableSchools` and `additionalSchools` arrays with realistic values.

**2. Create a `SchoolReportCard` component** (`src/components/SchoolReportCard.tsx`)
- A Dialog-based modal that receives a `ComparableSchool` and `open`/`onOpenChange` props.
- Displays:
  - Header: school name, community area, grade span, enrollment
  - Performance section: current performance with 3-year trend visualization
  - Key metrics grid: OI score, similarity match, student-teacher ratio, free/reduced lunch %, chronic absenteeism, math/ELA proficiency, suspension rate, teacher retention
  - A simple mini sparkline or bar showing the 3-year trend

**3. Update `ComparableSchools.tsx`**
- Import the new `SchoolReportCard` component and `Dialog`.
- Add state: `reportCardSchool` to track which school's modal is open.
- In the expanded row area, add a "View Full Report Card" button that sets `reportCardSchool`.
- Render `<SchoolReportCard>` at the bottom of the component, controlled by the state.

