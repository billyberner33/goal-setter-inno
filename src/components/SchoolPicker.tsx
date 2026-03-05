import { useState, useEffect, useRef } from "react";
import { Search, School, ChevronDown, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool, type School as SchoolType } from "@/contexts/SchoolContext";
import { cn } from "@/lib/utils";

const SchoolPicker = () => {
  const { selectedSchool, setSelectedSchool } = useSchool();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search schools from DB
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("schools")
        .select("school_id, school_name, students, school_level")
        .ilike("school_name", `%${query}%`)
        .order("school_name")
        .limit(20);

      if (!error && data) {
        setResults(data as SchoolType[]);
      }
      setLoading(false);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const selectSchool = (school: SchoolType) => {
    setSelectedSchool(school);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
          selectedSchool
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
        )}
      >
        <School size={14} />
        <span className="max-w-[180px] truncate">
          {selectedSchool ? selectedSchool.school_name : "Select Your School"}
        </span>
        {selectedSchool ? (
          <X
            size={14}
            className="opacity-70 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSchool(null);
            }}
          />
        ) : (
          <ChevronDown size={14} />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search by school name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-muted rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {!query.trim() ? (
              <p className="text-xs text-muted-foreground p-4 text-center">
                Start typing to search for your school
              </p>
            ) : loading ? (
              <p className="text-xs text-muted-foreground p-4 text-center">Searching...</p>
            ) : results.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">No schools found</p>
            ) : (
              results.map((school) => (
                <button
                  key={school.school_id}
                  onClick={() => selectSchool(school)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0 flex items-center justify-between",
                    selectedSchool?.school_id === school.school_id && "bg-primary/5"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-popover-foreground">{school.school_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {school.school_level === "ES" ? "K-8" : "9-12"}
                      {school.students ? ` · ${school.students.toLocaleString()} students` : ""}
                    </p>
                  </div>
                  {selectedSchool?.school_id === school.school_id && (
                    <span className="text-xs text-primary font-medium">Selected</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolPicker;
