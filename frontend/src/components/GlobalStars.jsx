import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function GlobalStars({ show }) {
  const themeCtx = useTheme();
  const isVisible = show !== undefined ? show : (themeCtx?.isDark ?? themeCtx?.darkMode ?? true);

  if (!isVisible) return null;

  return (
    <>
      {/* 1. Deep Fixed Pitch Black Base */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundColor: "#000000",
          pointerEvents: "none",
        }}
      />

      {/* 2. Primary CSS Starfield Layer (High Density & Crisp White/Gold Stars) */}
      <div
        className="astro-stars-layer-1"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 8% 12%, rgba(255,255,255,0.95), transparent),
            radial-gradient(1.2px 1.2px at 22% 35%, rgba(254,240,138,0.9), transparent),
            radial-gradient(1.8px 1.8px at 38% 18%, rgba(255,255,255,1), transparent),
            radial-gradient(1.2px 1.2px at 52% 28%, rgba(255,255,255,0.85), transparent),
            radial-gradient(1.6px 1.6px at 68% 75%, rgba(254,240,138,0.95), transparent),
            radial-gradient(1.3px 1.3px at 82% 22%, rgba(255,255,255,0.9), transparent),
            radial-gradient(1.5px 1.5px at 94% 65%, rgba(255,255,255,0.95), transparent),
            radial-gradient(1.2px 1.2px at 14% 82%, rgba(255,255,255,0.85), transparent),
            radial-gradient(2px 2px at 58% 55%, rgba(255,255,255,1), transparent),
            radial-gradient(1.4px 1.4px at 45% 88%, rgba(254,240,138,0.9), transparent),
            radial-gradient(1.2px 1.2px at 88% 92%, rgba(255,255,255,0.85), transparent),
            radial-gradient(1.6px 1.6px at 30% 62%, rgba(255,255,255,0.95), transparent)
          `,
          backgroundRepeat: "repeat",
          backgroundSize: "420px 420px",
          opacity: 0.95,
          animation: "twinkleStarfield 4s ease-in-out infinite alternate",
        }}
      />

      {/* 3. Secondary Micro-Stars Layer (Deep Universe Texture) */}
      <div
        className="astro-stars-layer-2"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backgroundImage: `
            radial-gradient(1px 1px at 18% 22%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1.2px 1.2px at 42% 48%, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 64% 15%, rgba(255,255,255,0.65), transparent),
            radial-gradient(1.3px 1.3px at 78% 52%, rgba(254,240,138,0.8), transparent),
            radial-gradient(1px 1px at 28% 85%, rgba(255,255,255,0.75), transparent),
            radial-gradient(1.4px 1.4px at 92% 38%, rgba(255,255,255,0.85), transparent)
          `,
          backgroundRepeat: "repeat",
          backgroundSize: "320px 320px",
          opacity: 0.85,
          animation: "twinkleStarfield 6s ease-in-out infinite alternate-reverse",
        }}
      />

      {/* 4. Astrotalk Warm Yellow/Gold Ambient Glow Bottom-Left */}
      <div
        style={{
          position: "fixed",
          bottom: "-5%",
          left: "-5%",
          width: "550px",
          height: "550px",
          background: "radial-gradient(circle, rgba(251,191,36,0.14) 0%, rgba(251,191,36,0.04) 35%, transparent 70%)",
          filter: "blur(35px)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* 5. Astrotalk Subtle Amber Ambient Glow Top-Right */}
      <div
        style={{
          position: "fixed",
          top: "-5%",
          right: "-5%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.03) 35%, transparent 70%)",
          filter: "blur(35px)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* CSS Twinkle Animation */}
      <style>{`
        @keyframes twinkleStarfield {
          0% { opacity: 0.65; transform: scale(1); }
          50% { opacity: 0.95; }
          100% { opacity: 1; transform: scale(1.002); }
        }
      `}</style>
    </>
  );
}

