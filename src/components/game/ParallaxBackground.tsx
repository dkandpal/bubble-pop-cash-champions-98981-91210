interface ParallaxBackgroundProps {
  backgroundImage?: string;
}

export const ParallaxBackground = ({ backgroundImage }: ParallaxBackgroundProps) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      {/* Layer 1 - Slow drifting bubbles */}
      <div className="absolute animate-float-slow opacity-10">
        <div className="absolute top-[10%] left-[5%] w-32 h-32 rounded-full bg-gradient-to-br from-bubble-blue/30 to-transparent blur-xl" />
        <div className="absolute top-[40%] right-[10%] w-40 h-40 rounded-full bg-gradient-to-br from-bubble-purple/30 to-transparent blur-xl" />
      </div>

      {/* Layer 2 - Medium speed */}
      <div className="absolute animate-float-medium opacity-10">
        <div className="absolute top-[25%] right-[20%] w-24 h-24 rounded-full bg-gradient-to-br from-bubble-green/30 to-transparent blur-lg" />
        <div className="absolute bottom-[30%] left-[15%] w-28 h-28 rounded-full bg-gradient-to-br from-bubble-yellow/30 to-transparent blur-lg" />
      </div>

      {/* Layer 3 - Faster drifting */}
      <div className="absolute animate-float-fast opacity-10">
        <div className="absolute top-[60%] left-[30%] w-20 h-20 rounded-full bg-gradient-to-br from-bubble-red/30 to-transparent blur-lg" />
        <div className="absolute top-[15%] left-[60%] w-36 h-36 rounded-full bg-gradient-to-br from-bubble-blue/30 to-transparent blur-xl" />
      </div>
    </div>
  );
};
