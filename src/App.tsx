import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import ThemeGenerator from "./pages/ThemeGenerator";
import GeneratedAssetsScreen from "./pages/GeneratedAssetsScreen";
import Auth from "./pages/Auth";
import MyGames from "./pages/MyGames";
import PlayGame from "./pages/PlayGame";
import Browse from "./pages/Browse";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/theme-generator" element={<ThemeGenerator />} />
              <Route path="/generated-assets" element={<GeneratedAssetsScreen />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/my-games" element={<MyGames />} />
              <Route path="/play/:id" element={<PlayGame />} />
              <Route path="/browse" element={<Browse />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
