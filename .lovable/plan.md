
## Overview
The user wants to make the 3 target cards (Conservative, Typical, Ambitious) on the `GoalRecommendation` page selectable, with "Typical" selected by default, a clear visual selection highlight, and AI-generated evidence that updates dynamically when each option is selected. Lovable AI (`LOVABLE_API_KEY`) is already configured — no additional setup needed.

## What Gets Built

### 1. New Edge Function: `supabase/functions/goal-evidence/index.ts`
- Accepts `{ targetType, targetValue, metricName, currentValue, schoolName }` 
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) via non-streaming invoke (short content, simpler UX)
- Returns a ~3–4 sentence contextual evidence blurb tailored to the selected target (Conservative/Typical/Ambitious)
- Handles 429/402 rate limit errors gracefully

**System prompt design** — each call gets context like:
```
You are an educational data analyst. Given a school's metric data, write 
3-4 sentences of evidence explaining WHY the [conservative/typical/ambitious] 
target of X% is appropriate, citing peer benchmarks and growth trajectory.
```

### 2. Updated `GoalRecommendation.tsx`
**Selection state:**
- Add `selectedTarget` state, defaulting to `"typical"`
- Cards become clickable `<button>` elements

**Visual highlight (selected state):**
- Selected card gets `ring-2 ring-primary shadow-md bg-primary/5` 
- A checkmark icon appears in top-left when selected
- The "RECOMMENDED" badge stays on Typical but doesn't drive the ring anymore — selection state does

**AI Evidence panel:**
- Appears below the 3 target cards in the left column
- Shows a `Sparkles` icon header: "AI Evidence — [Selected Label] Target"
- On initial load: auto-fetches evidence for "typical"
- On card click: fetches new evidence, shows a loading skeleton (2 lines)
- Displays the AI text when ready
- Error state shows a subtle fallback message

**Navigation:**
- "Set Your Goal" button passes `&target=typical` (or whichever is selected) as a query param to GoalCustomization so that step can pre-select the right mode

### 3. `supabase/config.toml`
- Add `[functions.goal-evidence]` entry

## Layout After Change
```text
[Performance Banner]
[Goal Recommendation Header]

Grid: xl:2/3 | xl:1/3
├── LEFT COLUMN
│   ├── [Range Bar Visualization]
│   ├── [3 Target Cards - clickable, selected one highlighted]
│   └── [AI Evidence Panel - loads on selection change]
└── RIGHT COLUMN
    └── [ExplanationPanel - unchanged]

[← Back | Set Your Goal →]
```

## Files Changed
- `supabase/functions/goal-evidence/index.ts` — NEW
- `src/pages/GoalRecommendation.tsx` — make cards selectable + AI evidence panel
- `supabase/config.toml` — register new edge function
