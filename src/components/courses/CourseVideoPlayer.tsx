import React, { useRef, useEffect, useState } from 'react';
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
 * - Cloudflare Stream video playback
 * - Resume from last position
 * - Auto-save progress every 10 seconds
 * - Progress tracking
 */
export default function CourseVideoPlayer({
  lesson,
  initialProgress,
  onProgressUpdate,
  onComplete
}: CourseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const saveProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize video and set up event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);

      // Resume from last position
      if (initialProgress && initialProgress.last_position_seconds > 0) {
        video.currentTime = initialProgress.last_position_seconds;
        console.log(`Resuming from ${initialProgress.last_position_seconds}s`);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      handleVideoComplete();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    // Auto-save progress every 10 seconds
    saveProgressIntervalRef.current = setInterval(() => {
      saveProgress();
    }, 10000);

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);

      if (saveProgressIntervalRef.current) {
        clearInterval(saveProgressIntervalRef.current);
      }
      // Save progress one last time before unmounting
      saveProgress();
    };
  }, [lesson.id]);

  // Save progress to backend
  const saveProgress = async () => {
    const video = videoRef.current;
    if (!video) return;

    const currentTime = video.currentTime;
    const duration = video.duration;

    if (duration === 0 || isNaN(currentTime) || isNaN(duration)) return;

    const completionPercentage = (currentTime / duration) * 100;

    try {
      const progress = await courseAPI.updateProgress(lesson.id, {
        watch_time_seconds: Math.floor(currentTime),
        last_position_seconds: Math.floor(currentTime),
        completion_percentage: completionPercentage,
        playback_speed: video.playbackRate,
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

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Extract Cloudflare Stream ID from video URL if it's a Cloudflare Stream URL
  const getStreamId = (url: string): string | null => {
    const match = url.match(/cloudflarestream\.com\/([a-f0-9]+)/i);
    return match ? match[1] : null;
  };

  const streamId = lesson.video_url ? getStreamId(lesson.video_url) : null;

  // If it's a Cloudflare Stream video, use their iframe player
  if (streamId) {
    return (
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={`https://customer-${streamId}.cloudflarestream.com/${streamId}/iframe?preload=true&autoplay=false`}
          style={{
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
          }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen={true}
        />

        {/* Completion Badge */}
        {initialProgress && initialProgress.is_completed && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
            ✓ Completed
          </div>
        )}
      </div>
    );
  }

  // Fallback to native HTML5 video for non-Cloudflare URLs
  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={lesson.video_url}
        controls
        className="w-full"
        preload="metadata"
      />

      {/* Progress indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Completion Badge */}
      {initialProgress && initialProgress.is_completed && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          ✓ Completed
        </div>
      )}

      {/* Time Display */}
      <div className="absolute bottom-4 left-4 bg-black/60 text-white px-2 py-1 rounded text-sm">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}
