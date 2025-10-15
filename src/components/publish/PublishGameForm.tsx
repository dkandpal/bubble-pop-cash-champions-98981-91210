import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Share2, X } from "lucide-react";
import { GameSpec, createGameSpec } from "@/types/gameSpec";
import { GameTheme } from "@/types/theme";
import { toast } from "sonner";

interface PublishGameFormProps {
  theme: GameTheme;
  onPublish: (spec: GameSpec) => Promise<void>;
  onCancel: () => void;
}

export const PublishGameForm = ({ theme, onPublish, onCancel }: PublishGameFormProps) => {
  const [title, setTitle] = useState(theme.themeName);
  const [tagline, setTagline] = useState(theme.tagline || "");
  const [tags, setTags] = useState<string>("");
  const [nsfw, setNsfw] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('📝 [PublishForm] Form submitted');

    // Validate title
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (title.length > 60) {
      toast.error("Title must be 60 characters or less");
      return;
    }

    // Validate tagline
    if (tagline.length > 100) {
      toast.error("Tagline must be 100 characters or less");
      return;
    }

    // Validate and sanitize tags
    const tagArray = tags
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .filter(t => /^[a-zA-Z0-9\s-]+$/.test(t)) // Only alphanumeric, spaces, and hyphens
      .slice(0, 10); // Max 10 tags

    if (tags.trim() && tagArray.length === 0) {
      toast.error("Tags can only contain letters, numbers, spaces, and hyphens");
      return;
    }

    if (tagArray.some(t => t.length > 20)) {
      toast.error("Each tag must be 20 characters or less");
      return;
    }

    setIsPublishing(true);
    try {
      console.log('🎮 [PublishForm] Creating game spec...');
      const spec = createGameSpec(theme, {
        title: title.trim(),
        tagline: tagline.trim() || undefined,
        tags: tagArray,
        nsfw,
        version: "1.0.0",
      });

      // Log spec size
      const specSize = new Blob([JSON.stringify(spec)]).size / 1024;
      console.log(`📊 [PublishForm] Spec size: ${specSize.toFixed(2)} KB`);

      console.log('🚀 [PublishForm] Calling onPublish...');
      await onPublish(spec);
      console.log('✅ [PublishForm] Publish successful!');
    } catch (error: any) {
      console.error("❌ [PublishForm] Error publishing game:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Handle specific error types
      if (error?.message?.includes('session has expired') || error?.message?.includes('sign in again')) {
        toast.error("Your session has expired. Please sign in again to publish.", {
          duration: 5000,
        });
      } else if (error?.message?.includes('timeout') || error?.message?.includes('timed out')) {
        toast.error("Publishing timed out. The server may be busy. Please try again.", {
          duration: 5000,
        });
      } else if (error?.message?.includes('Payload too large')) {
        toast.error("Game assets are too large. Please reduce the size of images.", {
          duration: 5000,
        });
      } else if (error?.message?.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please wait before publishing again.", {
          duration: 5000,
        });
      } else if (error?.message?.includes('401') || error?.message?.includes('authentication') || error?.message?.includes('Unauthorized')) {
        toast.error("Authentication failed. Please sign out and sign in again.", {
          duration: 5000,
        });
      } else if (error?.message) {
        toast.error(`Failed to publish: ${error.message}`, {
          duration: 5000,
        });
      } else {
        toast.error("Failed to publish game. Please try again.", {
          duration: 5000,
        });
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <Card className="p-6 bg-card/90 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Publish Your Game</h2>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Game Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Awesome Bubble Shooter"
                maxLength={60}
                required
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/60 characters
              </p>
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="A fun bubble shooter game"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Optional - {tagline.length}/100 characters
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="casual, puzzle, fun (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">
                Optional - Separate tags with commas
              </p>
            </div>

            {/* NSFW Toggle */}
            <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="nsfw">NSFW Content</Label>
                <p className="text-xs text-muted-foreground">
                  Mark if this game contains adult content
                </p>
              </div>
              <Switch
                id="nsfw"
                checked={nsfw}
                onCheckedChange={setNsfw}
              />
            </div>

            {/* Theme Preview */}
            <div className="p-4 bg-secondary/10 rounded-lg space-y-2">
              <p className="text-sm font-medium">Theme Preview</p>
              <div className="flex gap-2">
                {theme.bubbles.set.slice(0, 6).map((bubble, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: bubble.hex }}
                  >
                    {bubble.emoji}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPublishing || !title.trim()}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Publish Game
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
