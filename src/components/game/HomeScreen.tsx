import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Users, LogIn, Gamepad2 } from "lucide-react";
import gamePreview from "@/assets/game-preview.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
interface HomeScreenProps {
  onPlayClick: () => void;
}
export const HomeScreen = ({
  onPlayClick
}: HomeScreenProps) => {
  const navigate = useNavigate();
  const { user, signOut, signInAsGuest } = useAuth();

  const displayName = user?.user_metadata?.full_name || 
                     user?.user_metadata?.display_name || 
                     user?.email?.split('@')[0] || 
                     'User';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return <div className="min-h-screen bg-gradient-sky flex flex-col items-center justify-center p-6 relative">
      {/* User Profile Section - Only show when authenticated */}
      {user && (
        <div className="absolute top-4 right-4 flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 border border-border/50">
          <Avatar className="w-8 h-8">
            {user.user_metadata?.avatar_url && (
              <AvatarImage src={user.user_metadata.avatar_url} alt={displayName} />
            )}
            <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground leading-none">{displayName}</p>
            <button 
              onClick={signOut}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md w-full space-y-4 text-center">
        {/* Logo/Title */}
        <div className="space-y-4 animate-float">
          <h1 className="text-6xl font-bold bg-gradient-button bg-clip-text text-transparent">Bubble Shooter Builder</h1>
          <p className="text-lg text-foreground/80 font-medium">
            Make your own, powered by AI
          </p>
        </div>

        {/* Game preview */}
        <div className="py-2">
          <img src={gamePreview} alt="Bubble Pop Cash game preview showing colorful bubble grid" className="w-full max-w-sm mx-auto rounded-2xl shadow-lg" />
        </div>

        {/* CTA Buttons - Different based on auth state */}
        <div className="space-y-3">
          {user ? (
            // Authenticated state - show all features
            <>
              <Button 
                size="lg" 
                onClick={() => navigate("/theme-generator")} 
                className="w-full h-16 text-xl font-bold bg-gradient-button hover:opacity-90 transition-all shadow-glow animate-pulse-glow"
              >
                <Sparkles className="w-6 h-6 mr-2" />
                Build with AI
              </Button>

              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate("/browse")} 
                className="w-full h-12 text-lg font-semibold"
              >
                <Users className="w-5 h-5 mr-2" />
                Browse Game Library
              </Button>

              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate("/my-games")} 
                className="w-full h-12 text-lg font-semibold"
              >
                <Gamepad2 className="w-5 h-5 mr-2" />
                My Games
              </Button>
            </>
          ) : (
            // Unauthenticated state - show sign in and demo
            <>
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")} 
                className="w-full h-16 text-xl font-bold bg-gradient-button hover:opacity-90 transition-all shadow-glow"
              >
                <LogIn className="w-6 h-6 mr-2" />
                SIGN IN
              </Button>

              <Button 
                size="lg" 
                variant="outline" 
                onClick={signInAsGuest}
                className="w-full h-12 text-lg font-semibold"
              >
                <Gamepad2 className="w-5 h-5 mr-2" />
                DEMO
              </Button>
            </>
          )}
        </div>
      </div>
    </div>;
};