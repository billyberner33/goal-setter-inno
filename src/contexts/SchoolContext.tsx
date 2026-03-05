import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface School {
  school_id: string;
  school_name: string;
  students: number | null;
  school_level: string;
}

interface SchoolContextType {
  selectedSchool: School | null;
  setSelectedSchool: (school: School | null) => void;
}

const SchoolContext = createContext<SchoolContextType>({
  selectedSchool: null,
  setSelectedSchool: () => {},
});

export const useSchool = () => useContext(SchoolContext);

export const SchoolProvider = ({ children }: { children: ReactNode }) => {
  const [selectedSchool, setSelectedSchoolState] = useState<School | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("selected_school");
    if (saved) {
      try {
        setSelectedSchoolState(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const setSelectedSchool = (school: School | null) => {
    setSelectedSchoolState(school);
    if (school) {
      localStorage.setItem("selected_school", JSON.stringify(school));
    } else {
      localStorage.removeItem("selected_school");
    }
  };

  return (
    <SchoolContext.Provider value={{ selectedSchool, setSelectedSchool }}>
      {children}
    </SchoolContext.Provider>
  );
};
