import React, { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

export default function GlobalStars({ show }) {
  const canvasRef = useRef(null);
  const themeCtx = useTheme();
  const isVisible = show !== undefined ? show : (themeCtx?.isDark ?? themeCtx?.darkMode ?? true);

  useEffect(() => {
    if (!isVisible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const setSize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.3 + 0.2,
      alpha: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.015 + 0.005,
      dir: Math.random() > 0.5 ? 1 : -1,
    }));

    let anim;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        s.alpha += s.speed * s.dir;
        if (s.alpha <= 0.2 || s.alpha >= 1) {
          s.dir *= -1;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = "white";
        ctx.fill();
      });
      anim = requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener("resize", setSize);

    return () => {
      if (anim) cancelAnimationFrame(anim);
      window.removeEventListener("resize", setSize);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}
