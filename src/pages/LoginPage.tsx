import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool, type School } from "@/contexts/SchoolContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { selectedSchool, setSelectedSchool } = useSchool();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("schools")
        .select("school_id, school_name, students, school_level")
        .ilike("school_name", `%${query}%`)
        .order("school_name")
        .limit(20);
      if (data) setResults(data as School[]);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleContinue = () => {
    if (selectedSchool) navigate("/");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-8">
            Login to your{" "}
            <span className="text-primary italic">school</span>
          </h1>

          <div className="space-y-5">
            <div className="relative">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Select Account
              </label>
              <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 border-2 border-primary/30 rounded-xl text-sm font-medium text-foreground bg-card hover:border-primary/50 transition-colors"
              >
                <span className={selectedSchool ? "text-foreground" : "text-muted-foreground"}>
                  {selectedSchool
                    ? `Sarah Kim — ${selectedSchool.school_name}`
                    : "Search for your school..."}
                </span>
                <ChevronDown size={16} className="text-muted-foreground" />
              </button>

              {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by school name..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm bg-muted rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-[240px] overflow-y-auto">
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
                          onClick={() => {
                            setSelectedSchool(school);
                            setOpen(false);
                            setQuery("");
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                        >
                          <p className="text-sm font-medium text-popover-foreground">
                            Sarah Kim — {school.school_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {school.school_level === "ES" ? "K-8" : "9-12"}
                            {school.students ? ` · ${school.students.toLocaleString()} students` : ""}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleContinue}
              disabled={!selectedSchool}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <span className="text-primary font-medium cursor-pointer hover:underline">
                Register here
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - testimonial */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(280 60% 92%) 0%, hsl(300 50% 93%) 40%, hsl(320 40% 95%) 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-16 right-16 w-32 h-32 rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, hsl(300 70% 80%), transparent)" }}
        />
        <div className="absolute bottom-20 right-24 w-40 h-40 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, hsl(300 70% 80%), transparent)" }}
        />
        <div className="absolute bottom-32 left-12 w-24 h-24 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(280 60% 75%), transparent)" }}
        />

        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 max-w-lg shadow-lg relative z-10">
          <p className="text-foreground text-base leading-relaxed mb-6">
            "The most significant impact by partnering with Innovare has been the seamless
            integration of data and being able to look at it so teachers get their time back
            to do what matters most, which is being able to build student relationships and
            engagement and teach."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full"
              style={{
                background: "linear-gradient(135deg, hsl(50 60% 75%), hsl(140 40% 70%))",
              }}
            />
            <div>
              <p className="font-heading font-semibold text-sm text-foreground">Zachary Korth</p>
              <p className="text-xs text-muted-foreground">Principal at Morton Elementary</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
