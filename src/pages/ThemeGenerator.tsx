import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Home, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_THEME } from "@/types/theme";

export default function ThemeGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a theme description");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-theme", {
        body: { prompt: prompt.trim() },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const themeWithBanner = {
        ...data.theme,
        heroBannerImage: data.heroBannerImage
      };
      
      setTheme(themeWithBanner);
      toast.success("Theme generated successfully!");
      navigate("/generated-assets");
    } catch (error) {
      console.error("Error generating theme:", error);
      toast.error("Failed to generate theme");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSkipToDefault = () => {
    setTheme(DEFAULT_THEME);
    toast.info("Using default theme");
    navigate("/generated-assets");
  };

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col relative">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            Theme Generator
          </h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-2" />
            Back to Game
          </Button>
        </div>

        <Card className="p-6 mb-6 bg-card/80 backdrop-blur-sm">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Describe your theme
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Ocean adventure with sea creatures, Space theme with planets, Candy wonderland..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  className="flex-1"
                />
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="min-w-[120px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSkipToDefault}
                  disabled={isGenerating}
                  className="min-w-[120px]"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip This
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="mb-2 font-medium">Examples:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Ocean adventure with jellyfish, shells, and coral</li>
                <li>Space theme with planets, stars, and rockets</li>
                <li>Candy wonderland with lollipops and sweets</li>
                <li>Forest theme with mushrooms, leaves, and flowers</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
