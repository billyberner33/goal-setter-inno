import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import InnovareLayout from "@/components/InnovareLayout";
import Index from "./pages/Index";
import GoalLanding from "./pages/GoalLanding";
import ComparableSchools from "./pages/ComparableSchools";

import GoalRecommendation from "./pages/GoalRecommendation";
import GoalCustomization from "./pages/GoalCustomization";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
