import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function GlobalStars({ show }) {
  const themeCtx = useTheme();
  const isVisible = show !== undefined ? show : (themeCtx?.isDark ?? themeCtx?.darkMode ?? true);

  if (!isVisible) return null;

  return (
    <div
      id="astrotalk-global-starfield"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        backgroundColor: "#000000",
        backgroundImage: `
          radial-gradient(circle at 20px 30px, #ffffff 1.6px, transparent 1.6px),
          radial-gradient(circle at 65px 95px, #fef08a 1.4px, transparent 1.4px),
          radial-gradient(circle at 120px 45px, #ffffff 2.2px, transparent 2.2px),
          radial-gradient(circle at 180px 140px, #ffffff 1.6px, transparent 1.6px),
          radial-gradient(circle at 240px 70px, #fef08a 2px, transparent 2px),
          radial-gradient(circle at 310px 180px, #ffffff 2.4px, transparent 2.4px),
          radial-gradient(circle at 45px 230px, #ffffff 1.6px, transparent 1.6px),
          radial-gradient(circle at 140px 280px, #fef08a 2px, transparent 2px),
          radial-gradient(circle at 220px 220px, #ffffff 2px, transparent 2px),
          radial-gradient(circle at 300px 310px, #ffffff 2.6px, transparent 2.6px),
          radial-gradient(circle at 370px 90px, #ffffff 1.6px, transparent 1.6px),
          radial-gradient(circle at 420px 250px, #fef08a 2px, transparent 2px)
        `,
        backgroundRepeat: "repeat",
        backgroundSize: "380px 340px",
      }}
    >
      {/* Astrotalk yellow glow left bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "550px",
          height: "450px",
          background: "radial-gradient(circle, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.05) 40%, transparent 70%)",
          filter: "blur(35px)",
          pointerEvents: "none",
        }}
      />
      {/* Astrotalk subtle amber glow top right */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "450px",
          height: "350px",
          background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)",
          filter: "blur(35px)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

