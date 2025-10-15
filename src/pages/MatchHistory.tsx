import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Minus, X } from "lucide-react";
import { competitionService, MatchHistoryItem } from "@/services/CompetitionService";
import { toast } from "sonner";

export default function MatchHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "win" | "loss">("all");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await competitionService.getPlayerHistory();
        setHistory(data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
        toast.error("Failed to load match history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredHistory = history.filter(match => {
    if (filter === "all") return true;
    return match.outcome === filter;
  });

  const stats = {
    total: history.length,
    wins: history.filter(m => m.outcome === "win").length,
    losses: history.filter(m => m.outcome === "loss").length,
    ties: history.filter(m => m.outcome === "tie").length
  };

  const winRate = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(0) : 0;

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case "win":
        return <Badge className="bg-green-500">Victory</Badge>;
      case "loss":
        return <Badge variant="destructive">Defeat</Badge>;
      case "tie":
        return <Badge variant="secondary">Tie</Badge>;
      case "canceled":
        return <Badge variant="outline">Expired</Badge>;
      default:
        return null;
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case "win":
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "loss":
        return <TrendingDown className="w-5 h-5 text-destructive" />;
      case "tie":
        return <Minus className="w-5 h-5 text-muted-foreground" />;
      case "canceled":
        return <X className="w-5 h-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            size="icon"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Match History</h1>
            <p className="text-muted-foreground">Your competitive record</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Total Matches</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </Card>
          <Card className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Wins</p>
            <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
          </Card>
          <Card className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Losses</p>
            <p className="text-2xl font-bold text-destructive">{stats.losses}</p>
          </Card>
          <Card className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold text-primary">{winRate}%</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            onClick={() => setFilter("all")}
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
          >
            All
          </Button>
          <Button
            onClick={() => setFilter("win")}
            variant={filter === "win" ? "default" : "outline"}
            size="sm"
          >
            Wins
          </Button>
          <Button
            onClick={() => setFilter("loss")}
            variant={filter === "loss" ? "default" : "outline"}
            size="sm"
          >
            Losses
          </Button>
        </div>

        {/* Match List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">No Matches Yet</h3>
            <p className="text-muted-foreground mb-6">
              Play your first competitive match to start tracking your record
            </p>
            <Button onClick={() => navigate("/", { state: { startCompete: true } })}>
              Start Competing
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((match) => (
              <Card
                key={match.match_id}
                className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/compete/results/${match.match_id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getOutcomeIcon(match.outcome)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getOutcomeBadge(match.outcome)}
                      <span className="text-sm text-muted-foreground">
                        vs {match.opponent_handle}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {match.game_title}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold">
                      {match.your_score.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {match.opponent_score.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="text-right text-sm text-muted-foreground">
                    {new Date(match.completed_at).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
