import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Home, PlayCircle } from "lucide-react";
import { competitionService, MatchStatusResponse } from "@/services/CompetitionService";
import { toast } from "sonner";

export function WaitingScreen() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<MatchStatusResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!matchId) {
      navigate("/");
      return;
    }

    let interval: NodeJS.Timeout;
    
    const pollStatus = async () => {
      try {
        const response = await competitionService.getMatchStatus(matchId);
        setStatus(response);

        if (response.state === "completed" && response.results) {
          clearInterval(interval);
          toast.success("Match found! Loading results...");
          setTimeout(() => {
            navigate(`/compete/results/${matchId}`);
          }, 1000);
        } else if (response.state === "canceled") {
          clearInterval(interval);
          toast.error("No opponent found - match expired");
        }
      } catch (error) {
        console.error("Failed to fetch match status:", error);
      }
    };

    // Initial poll
    pollStatus();
    
    // Poll every 3 seconds
    interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
  }, [matchId, navigate]);

  // Calculate time remaining
  useEffect(() => {
    if (status?.expires_at) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(status.expires_at).getTime();
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(remaining);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status?.expires_at]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status.state === "canceled") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
            <span className="text-4xl">⏱️</span>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">No Opponent Found</h2>
            <p className="text-muted-foreground">
              Your match request expired. No other players joined within the time limit.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              onClick={() => navigate("/", { state: { startCompete: true } })}
              className="flex-1"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-8">
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Finding an Opponent...</h2>
            <p className="text-muted-foreground">
              Waiting for another player to complete their game
            </p>
          </div>
        </div>

        {timeLeft !== null && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Time remaining</p>
            <p className="text-3xl font-bold font-mono text-primary">
              {formatTime(timeLeft)}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Your score has been submitted</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            <span>Matching with players of similar skill</span>
          </div>
        </div>

        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="w-full"
        >
          <Home className="w-4 h-4 mr-2" />
          Return Home
        </Button>
      </Card>
    </div>
  );
}
