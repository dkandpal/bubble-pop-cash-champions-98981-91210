import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, PlayCircle, Trophy, Clock, Target, Zap, History } from "lucide-react";
import { competitionService, MatchResults } from "@/services/CompetitionService";
import { supabase } from "@/integrations/supabase/client";
import { Confetti } from "@/components/game/Confetti";
import { toast } from "sonner";

export function CompetitiveResultsScreen() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<MatchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [myEntryId, setMyEntryId] = useState<string>("");

  useEffect(() => {
    if (!matchId) {
      navigate("/");
      return;
    }

    const fetchResults = async () => {
      try {
        const response = await competitionService.getMatchStatus(matchId);
        
        if (response.state !== "completed" || !response.results) {
          toast.error("Match not completed yet");
          navigate("/");
          return;
        }

        setResults(response.results);
        
        // Determine which entry is mine by getting my player_id
        const myPlayerId = await competitionService.ensurePlayerRecord();
        
        // Fetch both entries to find which one belongs to me
        const { data: entries } = await competitionService['supabase']
          .from('entries')
          .select('id, player_id')
          .in('id', [response.results.entry_a_id, response.results.entry_b_id]);
        
        const myEntry = entries?.find(e => e.player_id === myPlayerId);
        setMyEntryId(myEntry?.id || response.results.entry_b_id);
      } catch (error) {
        console.error("Failed to fetch results:", error);
        toast.error("Failed to load match results");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [matchId, navigate]);

  if (loading || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  const isWinner = results.winner_entry_id === myEntryId;
  const isTie = results.outcome === "tie";
  const myScore = myEntryId === results.entry_a_id ? results.score_a : results.score_b;
  const opponentScore = myEntryId === results.entry_a_id ? results.score_b : results.score_a;
  const opponentHandle = myEntryId === results.entry_a_id ? results.player_b_handle : results.player_a_handle;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      {isWinner && <Confetti />}
      
      <Card className="max-w-2xl w-full p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-2">
            <Badge 
              variant={isWinner ? "default" : isTie ? "secondary" : "destructive"}
              className="text-lg px-4 py-1"
            >
              {isTie ? "TIE GAME" : isWinner ? "VICTORY!" : "DEFEAT"}
            </Badge>
            <h2 className="text-3xl font-bold">Match Complete</h2>
          </div>
        </div>

        {/* Score Comparison */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground font-medium">YOU</p>
            <p className={`text-4xl font-bold ${isWinner ? 'text-primary' : ''}`}>
              {myScore.toLocaleString()}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">VS</p>
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground font-medium">
              {opponentHandle?.toUpperCase() || "OPPONENT"}
            </p>
            <p className={`text-4xl font-bold ${!isWinner && !isTie ? 'text-primary' : ''}`}>
              {opponentScore.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 space-y-2 bg-secondary/50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-4 h-4" />
              <span className="text-sm">Score Difference</span>
            </div>
            <p className="text-2xl font-bold">
              {Math.abs(myScore - opponentScore).toLocaleString()}
            </p>
          </Card>
          
          <Card className="p-4 space-y-2 bg-secondary/50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Match Time</span>
            </div>
            <p className="text-2xl font-bold">2:00</p>
          </Card>
        </div>

        {/* Message */}
        <div className="text-center p-4 bg-secondary/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {isWinner 
              ? "🎉 Great job! You outscored your opponent!"
              : isTie
              ? "🤝 Evenly matched! Try again for the win."
              : "💪 Close match! Practice makes perfect."}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="flex-1"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button
            onClick={() => navigate("/match-history")}
            variant="outline"
            className="flex-1"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        </div>
        
        <Button
          onClick={() => navigate("/", { state: { startCompete: true } })}
          size="lg"
          className="w-full"
        >
          <PlayCircle className="w-5 h-5 mr-2" />
          Play Again
        </Button>
      </Card>
    </div>
  );
}
