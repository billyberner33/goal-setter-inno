import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SchoolProvider, useSchool } from "@/contexts/SchoolContext";
import InnovareLayout from "@/components/InnovareLayout";
import Index from "./pages/Index";
import GoalLanding from "./pages/GoalLanding";
import ComparableSchools from "./pages/ComparableSchools";
import GoalRecommendation from "./pages/GoalRecommendation";
import GoalCustomization from "./pages/GoalCustomization";
import CurrentGoals from "./pages/CurrentGoals";

import ImportData from "./pages/ImportData";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RequireSchool = ({ children }: { children: React.ReactNode }) => {
  const { selectedSchool } = useSchool();
  if (!selectedSchool) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/import" element={<ImportData />} />
    <Route
      path="/*"
      element={
        <RequireSchool>
          <InnovareLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/goals" element={<GoalLanding />} />
              
              <Route path="/goals/comparable" element={<ComparableSchools />} />
              <Route path="/goals/recommendation" element={<GoalRecommendation />} />
              <Route path="/goals/customize" element={<GoalCustomization />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </InnovareLayout>
        </RequireSchool>
      }
    />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SchoolProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </SchoolProvider>
  </QueryClientProvider>
);

export default App;
