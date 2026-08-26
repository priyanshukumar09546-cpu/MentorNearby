import React, { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

export default function StarField() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!isDark) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const starCount = Math.floor(Math.min(Math.max((width * height) / 8000, 100), 220));

    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.4,
      opacity: Math.random() * 0.7 + 0.3,
      twinkleSpeed: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
      speedY: Math.random() * 0.18 + 0.05,
      hue: Math.random() > 0.8 ? "rgba(254, 240, 138," : "rgba(255, 255, 255,",
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        s.opacity += s.twinkleSpeed;
        if (s.opacity <= 0.2) {
          s.opacity = 0.2;
          s.twinkleSpeed = -s.twinkleSpeed;
        } else if (s.opacity >= 0.95) {
          s.opacity = 0.95;
          s.twinkleSpeed = -s.twinkleSpeed;
        }

        s.y += s.speedY;
        if (s.y > height) {
          s.y = 0;
          s.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.hue + " " + s.opacity + ")";
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isDark]);

  if (!isDark) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
      style={{ opacity: isDark ? 0.85 : 0 }}
      aria-hidden="true"
    />
  );
}
