import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface School {
  school_id: string;
  school_name: string;
  students: number | null;
  school_level: string;
}

export interface PeerSchool {
  id: string;
  name: string;
  enrollment: number;
  similarityMatch: number;
  similarityRank: number;
  gradeSpan: string;
  euclideanDistance: number;
  currentPerformance: number;
}

interface SchoolContextType {
  selectedSchool: School | null;
  setSelectedSchool: (school: School | null) => void;
  selectedPeers: PeerSchool[];
  setSelectedPeers: (peers: PeerSchool[]) => void;
}

const SchoolContext = createContext<SchoolContextType>({
  selectedSchool: null,
  setSelectedSchool: () => {},
  selectedPeers: [],
  setSelectedPeers: () => {},
});

export const useSchool = () => useContext(SchoolContext);

export const SchoolProvider = ({ children }: { children: ReactNode }) => {
  const [selectedSchool, setSelectedSchoolState] = useState<School | null>(null);
  const [selectedPeers, setSelectedPeersState] = useState<PeerSchool[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("selected_school");
    if (saved) {
      try {
        setSelectedSchoolState(JSON.parse(saved));
      } catch {}
    }
    const savedPeers = localStorage.getItem("selected_peers");
    if (savedPeers) {
      try {
        setSelectedPeersState(JSON.parse(savedPeers));
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

  const setSelectedPeers = (peers: PeerSchool[]) => {
    setSelectedPeersState(peers);
    if (peers.length > 0) {
      localStorage.setItem("selected_peers", JSON.stringify(peers));
    } else {
      localStorage.removeItem("selected_peers");
    }
  };

  return (
    <SchoolContext.Provider value={{ selectedSchool, setSelectedSchool, selectedPeers, setSelectedPeers }}>
      {children}
    </SchoolContext.Provider>
  );
};
