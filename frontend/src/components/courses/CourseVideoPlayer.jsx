// ============================================================
// components/courses/CourseVideoPlayer.jsx
// Lightweight YouTube-Aware Video Player & Classroom Player
// Supports YouTube Embed, Direct MP4, and Prominent "Watch on YouTube" Action
// ============================================================

import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

// Helper: Extract YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
};

const CourseVideoPlayer = ({
  videoUrl,
  youtubeUrl,
  youtubeVideoId: propVideoId,
  title,
  thumbnail,
  chapter,
  onProgressUpdate,
  onEnded,
  isFreeSample = false,
}) => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Determine YouTube ID & Watch URL
  const rawUrl = youtubeUrl || videoUrl || '';
  const videoId = propVideoId || getYouTubeVideoId(rawUrl);
  const isYouTube = Boolean(videoId);
  const youtubeWatchUrl = isYouTube
    ? `https://www.youtube.com/watch?v=${videoId}`
    : rawUrl.startsWith('http') ? rawUrl : '';

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setDuration(dur);

    if (onProgressUpdate && Math.floor(cur) % 5 === 0) {
      onProgressUpdate({
        positionSeconds: Math.floor(cur),
        completed: cur / dur >= 0.85,
      });
    }
  };

  const handleSeek = (e) => {
    const seekTime = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleSpeedChange = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const maskedUser = user?.email
    ? `${user.email.slice(0, 2)}***@${user.email.split('@')[1]}`
    : 'MentorNearby Student';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          background: '#070E1C',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
          aspectRatio: '16 / 9',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          userSelect: 'none',
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* CASE 1: YOUTUBE EMBED PLAYER */}
        {isYouTube ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`}
            title={title || 'MentorNearby Board Exam Video Solution'}
            style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : videoUrl && videoUrl.endsWith('.mp4') ? (
          /* CASE 2: DIRECT MP4 PLAYBACK */
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={thumbnail}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                setIsPlaying(false);
                if (onEnded) onEnded();
              }}
              onClick={togglePlay}
            />

            {/* Direct MP4 Controls */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                padding: '16px 18px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                zIndex: 10,
              }}
            >
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#3B82F6' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <button
                    type="button"
                    onClick={togglePlay}
                    style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: 18, cursor: 'pointer' }}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>
                    {formatTime(currentTime)} / {formatTime(duration || 2880)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 4, background: 'rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: 6 }}>
                    {[1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => handleSpeedChange(spd)}
                        style={{
                          background: playbackRate === spd ? '#3B82F6' : 'none',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 5px',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: 15, cursor: 'pointer' }}
                    title="Fullscreen"
                  >
                    ⛶
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* CASE 3: PRESENTATION CANVAS WITH YOUTUBE ACTION */
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at center, #1E293B 0%, #070E1C 100%)',
              color: '#FFFFFF',
              padding: 28,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '2px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                marginBottom: 12,
              }}
            >
              🎥
            </div>
            <h4 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: '#F8FAFC' }}>
              {title || 'Board Exam PYQ Video Solution'}
            </h4>
            <p style={{ fontSize: 14, color: '#FDE047', fontWeight: 700, margin: '0 0 8px' }}>
              Video will be available soon.
            </p>
            {chapter && (
              <p style={{ fontSize: 12.5, color: '#94A3B8', margin: '0 0 14px' }}>
                📖 Chapter: {chapter}
              </p>
            )}
            <p style={{ fontSize: 13, color: '#CBD5E1', maxWidth: 440, margin: '0 0 16px', lineHeight: 1.5 }}>
              10+ years of previous board exam questions solved step-by-step with official CBSE marking scheme.
            </p>
            {youtubeWatchUrl ? (
              <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#EF4444',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                }}
              >
                <span>📺</span>
                <span>Watch on YouTube ↗</span>
              </a>
            ) : (
              <span style={{ fontSize: 12, background: '#ECFDF5', color: '#059669', fontWeight: 800, padding: '5px 14px', borderRadius: 8 }}>
                ✓ 100% Free Classroom Access
              </span>
            )}
          </div>
        )}

        {/* Dynamic Watermark Stamp */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(7, 14, 28, 0.75)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '3px 9px',
            borderRadius: 6,
            fontSize: 10.5,
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.75)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          MentorNearby • {maskedUser}
        </div>
      </div>

      {/* PROMINENT "WATCH ON YOUTUBE" EXTERNAL BAR */}
      {youtubeWatchUrl && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: 12,
            padding: '10px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📺</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                Official Video Solution on YouTube
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: '#64748B' }}>
                Open in YouTube app or new tab for high-definition playback
              </p>
            </div>
          </div>

          <a
            href={youtubeWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#EF4444',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              transition: 'background 0.2s ease',
              flexShrink: 0,
            }}
          >
            <span>Watch on YouTube</span>
            <span>↗</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default CourseVideoPlayer;
