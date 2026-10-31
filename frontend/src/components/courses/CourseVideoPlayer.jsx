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
  channelName,
  videoVerificationStatus,
  year,
  durationMinutes,
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
          /* CASE 3: PRESENTATION CANVAS FOR UNAVAILABLE / COMING SOON VIDEOS */
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at center, #1E293B 0%, #070E1C 100%)',
              color: '#FFFFFF',
              padding: '28px 20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                marginBottom: 14,
              }}
            >
              🎬
            </div>
            <div
              style={{
                display: 'inline-block',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#FBBF24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '3px 12px',
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: '0.04em',
                marginBottom: 10,
              }}
            >
              VIDEO NOT AVAILABLE FOR THIS LESSON
            </div>
            <h4 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#F8FAFC', maxWidth: 540 }}>
              {title || 'Board Examination Paper Solution'}
            </h4>
            <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 460, margin: '0 0 16px', lineHeight: 1.5 }}>
              A verified video lecture for this specific board paper is currently unavailable. Step-by-step model solutions and CBSE marking breakdown are available below.
            </p>
            <a
              href="#solution-notes-section"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('solution-notes-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#334155',
                color: '#FFFFFF',
                padding: '8px 18px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                border: '1px solid #475569',
              }}
            >
              <span>📖 Read Solution Notes Below</span>
            </a>
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
            padding: '12px 16px',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 22 }}>📺</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                  {title || 'Official Video Solution'}
                </p>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    background: '#ECFDF5',
                    color: '#059669',
                    padding: '2px 8px',
                    borderRadius: 6,
                    border: '1px solid #A7F3D0',
                  }}
                >
                  ✓ VERIFIED YOUTUBE EMBED
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748B' }}>
                {channelName ? `Educator / Channel: ${channelName}` : 'Curated Board Exam Video Solution'}
                {durationMinutes ? ` • ~${durationMinutes} mins` : ''}
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
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
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
