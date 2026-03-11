import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParsedRow {
  school_id: string;
  school_name: string;
  students: number | null;
  rank: number;
  similar_school_id: string;
  similar_school_name: string;
  similar_students: number | null;
  euclidean_distance: number;
  goal_metric: string | null;
  d_el: number | null;
  d_iep: number | null;
  d_stls: number | null;
  d_teach_ret: number | null;
  d_poverty: number | null;
  d_hardship: number | null;
  d_life_exp: number | null;
  d_uninsured: number | null;
  d_diversity: number | null;
  d_fund_a: number | null;
  d_fund_b: number | null;
}

function parseStudents(val: unknown): number | null {
  if (val == null) return null;
  const str = String(val).replace(/,/g, "");
  const num = parseInt(str, 10);
  return isNaN(num) ? null : num;
}

function parseNum(val: unknown): number | null {
  if (val == null || val === "" || val === "*" || String(val).trim() === "*") return null;
  const str = String(val).replace(/[+,]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function parseExcel(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        const rows: ParsedRow[] = json.map((r: any) => ({
          school_id: String(r["School ID"]),
          school_name: String(r["School Name"]),
          students: parseStudents(r["Students"]),
          rank: parseInt(String(r["Rank"]), 10),
          similar_school_id: String(r["Similar School ID"]),
          similar_school_name: String(r["Similar School Name"]),
          similar_students: parseStudents(r["Similar Students"]),
          euclidean_distance: parseFloat(String(r["Euclidean Distance"])),
          goal_metric: r["Goal Metric"] != null ? String(r["Goal Metric"]) : null,
          d_el: parseNum(r["d_EL"]),
          d_iep: parseNum(r["d_IEP"]),
          d_stls: parseNum(r["d_STLS"]),
          d_teach_ret: parseNum(r["d_TeachRet"]),
          d_poverty: parseNum(r["d_Poverty"]),
          d_hardship: parseNum(r["d_Hardship"]),
          d_life_exp: parseNum(r["d_LifeExp"]),
          d_uninsured: parseNum(r["d_Uninsured"]),
          d_diversity: parseNum(r["d_Diversity"]),
          d_fund_a: parseNum(r["d_FundA"]),
          d_fund_b: parseNum(r["d_FundB"]),
        }));
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// Normalize a school name for fuzzy matching
function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\bELEM(ENTARY)?\b/g, "")
    .replace(/\bSCHOOL\b/g, "")
    .replace(/\bCHARTER\b/g, "")
    .replace(/\bCOMMUNITY\b/g, "")
    .replace(/\bACADEMY\b/g, "")
    .replace(/\bSCHOLASTIC\b/g, "")
    .replace(/\bDUAL LANGUAGE\b/g, "")
    .replace(/\bHIGH\b/g, "")
    .replace(/\bMIDDLE\b/g, "")
    .replace(/\bJR\b/g, "")
    .replace(/\bSR\b/g, "")
    .replace(/\bMATH & SCI\b/g, "")
    .replace(/\bMAGNET\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Check if db name words are all found in the RC name
function nameMatches(dbName: string, rcName: string): boolean {
  const dbNorm = normalizeName(dbName);
  const rcNorm = normalizeName(rcName);
  if (dbNorm === rcNorm) return true;
  
  const dbWords = dbNorm.split(" ").filter(w => w.length > 1);
  const rcWords = rcNorm.split(" ").filter(w => w.length > 1);
  
  // All significant DB words must appear in RC name
  const allDbWordsInRc = dbWords.every(w => rcWords.includes(w));
  if (allDbWordsInRc && dbWords.length >= 1) return true;
  
  return false;
}

interface MetricRow {
  school_id: string;
  year: number;
  ela_proficiency: number | null;
  math_proficiency: number | null;
  chronic_absenteeism: number | null;
  ela_growth_percentile: number | null;
  math_growth_percentile: number | null;
  isa_proficiency: number | null;
  graduation_rate_4yr: number | null;
  graduation_rate_5yr: number | null;
  pct_9th_on_track: number | null;
}

function parseMetricsExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

const CHUNK_SIZE = 2000;

export default function ImportData() {
  const [importing, setImporting] = useState(false);
  const [importingMetrics, setImportingMetrics] = useState(false);
  const [status, setStatus] = useState<string[]>([]);
  const [metricsStatus, setMetricsStatus] = useState<string[]>([]);

  const addStatus = (msg: string) => setStatus((prev) => [...prev, msg]);
  const addMetricsStatus = (msg: string) => setMetricsStatus((prev) => [...prev, msg]);

  const handleImport = async (file: File, level: "ES" | "HS") => {
    addStatus(`Parsing ${level} file...`);
    const rows = await parseExcel(file);
    addStatus(`Parsed ${rows.length} rows from ${level} file`);

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      addStatus(`Uploading ${level} chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(rows.length / CHUNK_SIZE)}...`);

      const { data, error } = await supabase.functions.invoke("import-school-data", {
        body: { rows: chunk, school_level: level },
      });

      if (error) {
        addStatus(`Error: ${error.message}`);
        toast.error(`Import failed: ${error.message}`);
        return false;
      }
      addStatus(`Chunk done: ${data.schools_count} schools, ${data.similarities_count} similarities`);
    }
    return true;
  };

  const handleFiles = async (esFile: File | null, hsFile: File | null) => {
    setImporting(true);
    setStatus([]);

    try {
      if (esFile) {
        const ok = await handleImport(esFile, "ES");
        if (!ok) return;
        addStatus("ES import complete!");
      }
      if (hsFile) {
        const ok = await handleImport(hsFile, "HS");
        if (!ok) return;
        addStatus("HS import complete!");
      }
      toast.success("All imports complete!");
    } catch (err: any) {
      addStatus(`Error: ${err.message}`);
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleMetricsImport = async (file: File, year: number) => {
    setImportingMetrics(true);
    setMetricsStatus([]);

    try {
      addMetricsStatus(`Parsing ${year} metrics file...`);
      const rawRows = await parseMetricsExcel(file);
      addMetricsStatus(`Parsed ${rawRows.length} total rows`);

      // Filter to CPS schools only (Type = "School" and District contains "Chicago" or "299")
      const cpsRows = rawRows.filter((r: any) => {
        const type = String(r["Type"] || "").trim();
        const district = String(r["District"] || "");
        return type === "School" && (district.includes("Chicago") || district.includes("299"));
      });
      addMetricsStatus(`Found ${cpsRows.length} CPS school rows`);

      // Fetch all schools from DB for matching
      const { data: dbSchools, error: dbError } = await supabase
        .from("schools")
        .select("school_id, school_name");

      if (dbError || !dbSchools) {
        addMetricsStatus(`Error fetching schools: ${dbError?.message}`);
        toast.error("Failed to fetch schools for matching");
        return;
      }

      addMetricsStatus(`Loaded ${dbSchools.length} schools from database for matching`);

      // Match each CPS row to a DB school
      const matched: MetricRow[] = [];
      const unmatched: string[] = [];

      for (const row of cpsRows) {
        const rcName = String(row["School Name"] || "").trim();
        if (!rcName) continue;

        let matchedSchool: { school_id: string; school_name: string } | null = null;

        // Try to find a match
        for (const dbSchool of dbSchools) {
          if (nameMatches(dbSchool.school_name, rcName)) {
            matchedSchool = dbSchool;
            break;
          }
        }

        if (matchedSchool) {
          matched.push({
            school_id: matchedSchool.school_id,
            year,
            ela_proficiency: parseNum(row["IAR ELA Proficiency Rate - Total"]),
            math_proficiency: parseNum(row["IAR Math Proficiency Rate - Total"]),
            chronic_absenteeism: parseNum(row["Chronic Absenteeism"]),
            ela_growth_percentile: parseNum(row["ELA Growth Percentile - Total"]),
            math_growth_percentile: parseNum(row["Math Growth Percentile"]),
            isa_proficiency: parseNum(row["% ISA Proficiency"]),
            graduation_rate_4yr: parseNum(row["High School 4-Year Graduation Rate - Total"]),
            graduation_rate_5yr: parseNum(row["High School 5-Year Graduation Rate - Total"]),
            pct_9th_on_track: parseNum(row["% 9th Grade on Track"]),
          });
        } else {
          unmatched.push(rcName);
        }
      }

      // Deduplicate: keep last occurrence per school_id+year (later rows may have more data)
      const deduped = Array.from(
        matched.reduce((map, row) => {
          const key = `${row.school_id}_${row.year}`;
          const existing = map.get(key);
          if (!existing) {
            map.set(key, row);
          } else {
            // Merge: prefer non-null values from the new row
            const merged = { ...existing };
            for (const [k, v] of Object.entries(row)) {
              if (v != null) (merged as any)[k] = v;
            }
            map.set(key, merged);
          }
          return map;
        }, new Map<string, MetricRow>()).values()
      );

      addMetricsStatus(`Matched ${matched.length} rows → ${deduped.length} unique school-year records, ${unmatched.length} unmatched`);
      if (unmatched.length > 0) {
        addMetricsStatus(`Unmatched samples: ${unmatched.slice(0, 10).join(", ")}${unmatched.length > 10 ? "..." : ""}`);
      }

      if (matched.length === 0) {
        addMetricsStatus("No matches found. Make sure school similarity data is imported first.");
        toast.error("No matching schools found");
        return;
      }

      // Send matched metrics to edge function in chunks
      for (let i = 0; i < matched.length; i += CHUNK_SIZE) {
        const chunk = matched.slice(i, i + CHUNK_SIZE);
        addMetricsStatus(`Uploading metrics chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(matched.length / CHUNK_SIZE)}...`);

        const { data, error } = await supabase.functions.invoke("import-school-metrics", {
          body: { rows: chunk },
        });

        if (error) {
          addMetricsStatus(`Error: ${error.message}`);
          toast.error(`Metrics import failed: ${error.message}`);
          return;
        }
        addMetricsStatus(`Chunk done: ${data.upserted} records upserted`);
      }

      addMetricsStatus(`Import complete! ${matched.length} schools with ${year} metrics`);
      toast.success(`${year} metrics imported for ${matched.length} schools`);
    } catch (err: any) {
      addMetricsStatus(`Error: ${err.message}`);
      toast.error(err.message);
    } finally {
      setImportingMetrics(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import School Similarity Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ES File (K-8)</label>
            <input type="file" accept=".xlsx,.xls" id="es-file" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">HS File (9-12)</label>
            <input type="file" accept=".xlsx,.xls" id="hs-file" />
          </div>
          <Button
            disabled={importing}
            onClick={() => {
              const esInput = document.getElementById("es-file") as HTMLInputElement;
              const hsInput = document.getElementById("hs-file") as HTMLInputElement;
              handleFiles(
                esInput?.files?.[0] || null,
                hsInput?.files?.[0] || null
              );
            }}
          >
            {importing ? "Importing..." : "Import Similarity Data"}
          </Button>
          {status.length > 0 && (
            <div className="bg-muted p-3 rounded text-sm font-mono max-h-64 overflow-y-auto">
              {status.map((s, i) => (
                <div key={i}>{s}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import School Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload Illinois Report Card Excel files to import performance metrics (ELA, Math, Chronic Absenteeism, SGP, etc.) for CPS schools. Schools are matched by name to existing records.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">2023 Report Card File</label>
            <input type="file" accept=".xlsx,.xls" id="metrics-2023-file" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">2024 Report Card File</label>
            <input type="file" accept=".xlsx,.xls" id="metrics-2024-file" />
          </div>
          <Button
            disabled={importingMetrics}
            onClick={async () => {
              const f2023 = (document.getElementById("metrics-2023-file") as HTMLInputElement)?.files?.[0];
              const f2024 = (document.getElementById("metrics-2024-file") as HTMLInputElement)?.files?.[0];
              if (f2023) await handleMetricsImport(f2023, 2023);
              if (f2024) await handleMetricsImport(f2024, 2024);
              if (!f2023 && !f2024) toast.error("Please select at least one file");
            }}
          >
            {importingMetrics ? "Importing Metrics..." : "Import Metrics Data"}
          </Button>
          {metricsStatus.length > 0 && (
            <div className="bg-muted p-3 rounded text-sm font-mono max-h-64 overflow-y-auto">
              {metricsStatus.map((s, i) => (
                <div key={i}>{s}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
