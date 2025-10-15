import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, Home, Share2, Code } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PublishGameResult } from "@/services/StorageAdapter";

interface PublishSuccessScreenProps {
  result: PublishGameResult;
  onHome: () => void;
}

export const PublishSuccessScreen = ({ result, onHome }: PublishSuccessScreenProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const embedCode = `<iframe src="${result.embed_url}" width="400" height="600" frameborder="0"></iframe>`;

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4 animate-bounce-in">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Game Published!</h2>
          <p className="text-muted-foreground">
            Your game is now live and ready to share with the world
          </p>
        </div>

        {/* Share Links Card */}
        <Card className="p-6 bg-card/90 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-border">
            <Share2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Share Your Game</h3>
          </div>

          {/* Share URL */}
          <div className="space-y-2">
            <Label>Share URL</Label>
            <div className="flex gap-2">
              <Input
                value={result.share_url}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                size="icon"
                variant={copied === "Share URL" ? "default" : "outline"}
                onClick={() => handleCopy(result.share_url, "Share URL")}
              >
                {copied === "Share URL" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with friends so they can play your game
            </p>
          </div>

          {/* Embed Code */}
          <div className="space-y-2">
            <Label>Embed Code</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Textarea
                  value={embedCode}
                  readOnly
                  className="flex-1 font-mono text-sm h-20 resize-none"
                />
                <Button
                  size="icon"
                  variant={copied === "Embed Code" ? "default" : "outline"}
                  onClick={() => handleCopy(embedCode, "Embed Code")}
                >
                  {copied === "Embed Code" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Code className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Embed this game on your website or blog
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onHome}
            className="flex-1 h-12"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Button
            onClick={() => window.open(result.share_url, "_blank")}
            className="flex-1 h-12"
          >
            <Share2 className="w-4 h-4 mr-2" />
            View Published Game
          </Button>
        </div>
      </div>
    </div>
  );
};
