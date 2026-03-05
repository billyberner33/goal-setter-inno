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
  if (val == null || val === "") return null;
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

const CHUNK_SIZE = 2000;

export default function ImportData() {
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<string[]>([]);

  const addStatus = (msg: string) => setStatus((prev) => [...prev, msg]);

  const handleImport = async (file: File, level: "ES" | "HS") => {
    addStatus(`Parsing ${level} file...`);
    const rows = await parseExcel(file);
    addStatus(`Parsed ${rows.length} rows from ${level} file`);

    // Send in chunks to avoid payload limits
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
            {importing ? "Importing..." : "Import Data"}
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
    </div>
  );
}
