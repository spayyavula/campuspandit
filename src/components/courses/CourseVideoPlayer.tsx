import React, { useRef, useEffect, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, SkipBack, SkipForward } from 'lucide-react';
import { courseAPI, Lesson, LessonProgress } from '../../services/courseAPI';

interface CourseVideoPlayerProps {
  lesson: Lesson;
  initialProgress?: LessonProgress | null;
  onProgressUpdate?: (progress: LessonProgress) => void;
  onComplete?: () => void;
}

/**
 * CourseVideoPlayer Component
 *
 * Features:
 * - HLS video playback (Cloudflare Stream)
 * - Resume from last position
 * - Auto-save progress every 10 seconds
 * - Playback speed control
 * - Quality selector
 * - Keyboard shortcuts
 * - Progress tracking
 */
export default function CourseVideoPlayer({
  lesson,
  initialProgress,
  onProgressUpdate,
  onComplete
}: CourseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const saveProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Video.js
  useEffect(() => {
    if (!videoRef.current) return;

    const player = videojs(videoRef.current, {
      controls: false, // We'll use custom controls
      autoplay: false,
      preload: 'auto',
      fluid: true,
      responsive: true,
      sources: [{
        src: lesson.video_url || '',
        type: 'application/x-mpegURL' // HLS format from Cloudflare
      }],
      html5: {
        vhs: {
          overrideNative: true
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false
      }
    });

    playerRef.current = player;

    // Event listeners
    player.on('loadedmetadata', () => {
      setDuration(player.duration());

      // Resume from last position
      if (initialProgress && initialProgress.last_position_seconds > 0) {
        player.currentTime(initialProgress.last_position_seconds);
        console.log(`Resuming from ${initialProgress.last_position_seconds}s`);
      }
    });

    player.on('timeupdate', () => {
      setCurrentTime(player.currentTime());
    });

    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));

    player.on('volumechange', () => {
      setVolume(player.volume());
      setIsMuted(player.muted());
    });

    player.on('ended', () => {
      handleVideoComplete();
    });

    // Auto-save progress every 10 seconds
    saveProgressIntervalRef.current = setInterval(() => {
      saveProgress();
    }, 10000);

    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      if (saveProgressIntervalRef.current) {
        clearInterval(saveProgressIntervalRef.current);
      }
      if (playerRef.current) {
        // Save progress one last time before unmounting
        saveProgress();
        playerRef.current.dispose();
      }
    };
  }, [lesson.id]);

  // Save progress to backend
  const saveProgress = async () => {
    if (!playerRef.current) return;

    const currentTime = playerRef.current.currentTime();
    const duration = playerRef.current.duration();

    if (duration === 0 || isNaN(currentTime) || isNaN(duration)) return;

    const completionPercentage = (currentTime / duration) * 100;

    try {
      const progress = await courseAPI.updateProgress(lesson.id, {
        watch_time_seconds: Math.floor(currentTime),
        last_position_seconds: Math.floor(currentTime),
        completion_percentage: completionPercentage,
        playback_speed: playbackSpeed,
      });

      if (onProgressUpdate) {
        onProgressUpdate(progress);
      }

      console.log(`Progress saved: ${Math.floor(completionPercentage)}%`);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleVideoComplete = async () => {
    await saveProgress();
    if (onComplete) {
      onComplete();
    }
  };

  // Playback controls
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (playerRef.current.paused()) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  };

  const skip = (seconds: number) => {
    if (!playerRef.current) return;
    const newTime = playerRef.current.currentTime() + seconds;
    playerRef.current.currentTime(Math.max(0, Math.min(newTime, playerRef.current.duration())));
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    playerRef.current.muted(!playerRef.current.muted());
  };

  const changeVolume = (delta: number) => {
    if (!playerRef.current) return;
    const newVolume = Math.max(0, Math.min(1, playerRef.current.volume() + delta));
    playerRef.current.volume(newVolume);
  };

  const setSpeed = (speed: number) => {
    if (!playerRef.current) return;
    playerRef.current.playbackRate(speed);
    setPlaybackSpeed(speed);
  };

  const toggleFullscreen = () => {
    if (!playerRef.current) return;

    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const seekTo = (percentage: number) => {
    if (!playerRef.current) return;
    const newTime = (percentage / 100) * playerRef.current.duration();
    playerRef.current.currentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered w-full"
        />
      </div>

      {/* Custom Controls Overlay */}
      <div className={`absolute inset-0 flex flex-col justify-end transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <div
            className="h-1 bg-gray-600 rounded-full cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = (x / rect.width) * 100;
              seekTo(percentage);
            }}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-gradient-to-t from-black/80 to-transparent px-4 py-3 flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-blue-400 transition">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            <button onClick={() => skip(-10)} className="text-white hover:text-blue-400 transition">
              <SkipBack className="w-5 h-5" />
            </button>

            <button onClick={() => skip(10)} className="text-white hover:text-blue-400 transition">
              <SkipForward className="w-5 h-5" />
            </button>

            <button onClick={toggleMute} className="text-white hover:text-blue-400 transition">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {/* Speed Control */}
            <select
              value={playbackSpeed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="bg-white/10 text-white text-sm px-2 py-1 rounded border border-white/20 hover:bg-white/20 transition"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>

            <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Completion Badge */}
      {initialProgress && initialProgress.is_completed && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          ✓ Completed
        </div>
      )}

      {/* Resume Notice */}
      {initialProgress && initialProgress.last_position_seconds > 30 && currentTime < 5 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-4 rounded-lg">
          <p className="text-center mb-3">Resume from {formatTime(initialProgress.last_position_seconds)}?</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (playerRef.current) {
                  playerRef.current.currentTime(initialProgress.last_position_seconds);
                }
              }}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
            >
              Resume
            </button>
            <button
              onClick={() => {
                if (playerRef.current) {
                  playerRef.current.currentTime(0);
                  playerRef.current.play();
                }
              }}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
