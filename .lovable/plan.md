

## Plan: Store School Similarity Data in Database

### Data Structure

Both Excel files share identical columns:
- **School ID, School Name, Students** (the source school)
- **Rank** (1-10, top 10 most similar)
- **Similar School ID, Similar School Name, Similar Students** (the comparable school)
- **Euclidean Distance** (overall similarity score)
- **11 dimension deltas**: d_EL, d_IEP, d_STLS, d_TeachRet, d_Poverty, d_Hardship, d_LifeExp, d_Uninsured, d_Diversity, d_FundA, d_FundB

The ES file has ~27,900 rows and the HS file has ~7,700 rows (each school has 10 similar schools).

### Database Tables

**1. `schools`** -- Unique list of all schools (both source and similar)
- `school_id` (text, PK) -- CPS ID like "400009"
- `school_name` (text)
- `students` (integer, nullable)
- `school_level` (text) -- 'ES' or 'HS'

**2. `school_similarities`** -- The similarity pairs with Euclidean distance and dimension deltas
- `id` (uuid, PK)
- `school_id` (text, FK → schools)
- `similar_school_id` (text, FK → schools)
- `rank` (integer) -- 1-10
- `euclidean_distance` (numeric)
- `d_el`, `d_iep`, `d_stls`, `d_teach_ret`, `d_poverty`, `d_hardship`, `d_life_exp`, `d_uninsured`, `d_diversity`, `d_fund_a`, `d_fund_b` (numeric columns for each dimension delta)
- `school_level` (text) -- 'ES' or 'HS'
- Unique constraint on (school_id, similar_school_id, school_level)

### Implementation Steps

1. **Create migration** with the two tables above, RLS policies allowing public read access (this is public school data, no auth needed).

2. **Create an edge function** `import-school-data` that:
   - Accepts CSV/JSON payload of the parsed Excel data
   - Upserts into `schools` and `school_similarities`

3. **Parse and insert data** from both Excel files using the edge function or direct SQL inserts.

4. **Update frontend** to query from the database instead of mock data, mapping the real CPS school data into the existing comparable schools UI.

### Why This Design
- Separating `schools` from `school_similarities` avoids duplicating school names/enrollment across thousands of rows.
- The dimension deltas are stored as individual columns for easy querying and filtering.
- Public RLS since this is non-sensitive public education data.

