import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function GlobalStars({ show }) {
  const themeCtx = useTheme();
  const isVisible = show !== undefined ? show : (themeCtx?.isDark ?? themeCtx?.darkMode ?? true);

  if (!isVisible) return null;

  return (
    <>
      {/* 1. Fixed Base Pitch Black */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundColor: "#000000",
          pointerEvents: "none",
        }}
      />

      {/* 2. High-Density CSS Radial Gradient Stars */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.85), rgba(0,0,0,0)),
            radial-gradient(2.5px 2.5px at 90px 40px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.8px 1.8px at 160px 120px, #fef08a, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 230px 190px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2.5px 2.5px at 310px 80px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.8px 1.8px at 370px 220px, #fef08a, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 420px 50px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2.5px 2.5px at 480px 160px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 120px 260px, rgba(255,255,255,0.9), rgba(0,0,0,0)),
            radial-gradient(3px 3px at 260px 290px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 340px 330px, #fef08a, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 50px 380px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2.5px 2.5px at 190px 410px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 440px 360px, #fef08a, rgba(0,0,0,0))
          `,
          backgroundRepeat: "repeat",
          backgroundSize: "500px 450px",
          opacity: 0.9,
          animation: "twinkleStarfield 4s ease-in-out infinite alternate",
        }}
      />

      {/* 3. Astrotalk Warm Yellow Glow at Bottom-Left */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "550px",
          height: "450px",
          background: "radial-gradient(circle, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.05) 40%, transparent 70%)",
          filter: "blur(35px)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* 4. Astrotalk Amber Glow at Top-Right */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "450px",
          height: "350px",
          background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)",
          filter: "blur(35px)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes twinkleStarfield {
          0% { opacity: 0.65; }
          50% { opacity: 0.95; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  );
}

