

## Analysis: Comparable Schools for GLOBAL CITIZENSHIP

The `/goals/comparable` page code is working correctly. It queries `school_similarities` for the selected school and returns the top 10 by euclidean distance. Here is what the database actually contains for GLOBAL CITIZENSHIP (school_id: 400009):

```text
Rank  School              Euclidean Distance
1     CHRISTOPHER HOUSE   0.700
2     HAMPTON             0.735
3     ACERO - TORRES      0.768
4     ACERO - ZIZUMBO     0.775
5     TWAIN               0.889
6     NEW FIELD           0.900
7     LYON                0.906
8     HEARST              0.917
9     ASHBURN             0.927
10    HURLEY              0.933
```

Your expected list includes PECK, COOPER, and DAWES, but those schools do **not** appear as similar schools to GLOBAL CITIZENSHIP in the imported data. Instead, the database has TWAIN, LYON, and HURLEY in those positions.

This means the discrepancy is in the **source Excel data**, not in the code. The imported file (`CPS_ES_Top10_Similar.xlsx`) contains exactly these 10 schools as the top matches for GLOBAL CITIZENSHIP.

### Possible explanations
1. The Excel file you uploaded may be an older version -- PECK, COOPER, and DAWES may appear in a newer dataset.
2. You may be comparing against a different similarity model or metric-specific ranking (the current data uses overall euclidean distance, not metric-specific distances).

### Recommended next step
If you have an updated Excel file with the correct similarity rankings, re-import it via `/import`. Otherwise, if the expected schools should vary **per goal metric** (e.g., Global Citizenship uses a different distance calculation), we would need a separate similarity dataset per metric and the code would need to filter by metric. Let me know which direction to take.

