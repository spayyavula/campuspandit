import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Monitor,
  Mic,
  Square,
  Pause,
  Play,
  Trash2,
  Upload,
  ArrowLeft,
  AlertCircle,
  Camera,
  MonitorPlay,
} from 'lucide-react';

type RecordingMode = 'webcam' | 'screen' | 'both';
type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

export default function RecordingStudio() {
  const navigate = useNavigate();
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const [recordingMode, setRecordingMode] = useState<RecordingMode>('webcam');
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (recordingStatus === 'recording') {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingStatus]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startPreview = async () => {
    try {
      setError('');

      // Clean up existing streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      let combinedStream: MediaStream;

      if (recordingMode === 'webcam') {
        // Webcam only
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });
        webcamStreamRef.current = stream;
        combinedStream = stream;
      } else if (recordingMode === 'screen') {
        // Screen only
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1920, height: 1080 },
          audio: true,
        });
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // Combine screen video with microphone audio
        const videoTrack = screenStream.getVideoTracks()[0];
        const audioTrack = audioStream.getAudioTracks()[0];

        combinedStream = new MediaStream([videoTrack, audioTrack]);
        screenStreamRef.current = screenStream;
      } else {
        // Both screen and webcam (Picture-in-Picture)
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1920, height: 1080 },
          audio: true,
        });
        const webcamStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 180 },
          audio: true,
        });

        screenStreamRef.current = screenStream;
        webcamStreamRef.current = webcamStream;

        // For now, use screen stream (in production, you'd composite them)
        combinedStream = screenStream;
      }

      streamRef.current = combinedStream;

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = combinedStream;
      }
    } catch (err: any) {
      console.error('Error accessing media devices:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Permission denied. Please allow access to camera/microphone/screen.'
          : 'Failed to access media devices. Please check your permissions.'
      );
    }
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      await startPreview();
    }

    if (!streamRef.current) {
      setError('No media stream available');
      return;
    }

    try {
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);

        // Show preview
        if (recordedVideoRef.current) {
          recordedVideoRef.current.src = URL.createObjectURL(blob);
        }

        // Stop all streams
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (webcamStreamRef.current) {
          webcamStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setRecordingStatus('recording');
      setRecordingTime(0);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingStatus('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingStatus('recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingStatus('stopped');
    }
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    setRecordingStatus('idle');
    setRecordingTime(0);
    chunksRef.current = [];
  };

  const uploadRecording = () => {
    if (!recordedBlob) return;

    // Navigate to upload page with the recorded blob
    // We'll store it in sessionStorage temporarily
    const url = URL.createObjectURL(recordedBlob);
    sessionStorage.setItem('recordedVideoURL', url);
    sessionStorage.setItem('recordedVideoBlob', 'true');

    navigate('/library/upload', {
      state: {
        recordedVideo: true,
        videoBlob: recordedBlob,
      },
    });
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/library')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Library
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recording Studio</h1>
          <p className="text-gray-600">Record your lessons directly in the browser</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Recording Area */}
          <div className="lg:col-span-2">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Video Preview / Playback */}
            <div className="bg-black rounded-lg overflow-hidden mb-6">
              <div className="aspect-video relative">
                {recordingStatus === 'stopped' && recordedBlob ? (
                  <video
                    ref={recordedVideoRef}
                    controls
                    className="w-full h-full"
                  />
                ) : (
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full"
                  />
                )}

                {/* Recording Indicator */}
                {(recordingStatus === 'recording' || recordingStatus === 'paused') && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/80 px-3 py-2 rounded-lg">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        recordingStatus === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'
                      }`}
                    ></div>
                    <span className="text-white font-mono">{formatTime(recordingTime)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recording Controls */}
            {recordingStatus === 'stopped' ? (
              <div className="flex gap-4">
                <button
                  onClick={discardRecording}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Discard
                </button>
                <button
                  onClick={uploadRecording}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Use This Recording
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                {recordingStatus === 'idle' ? (
                  <button
                    onClick={startRecording}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Video className="w-5 h-5" />
                    Start Recording
                  </button>
                ) : (
                  <>
                    {recordingStatus === 'recording' ? (
                      <button
                        onClick={pauseRecording}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        <Pause className="w-5 h-5" />
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={resumeRecording}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Play className="w-5 h-5" />
                        Resume
                      </button>
                    )}
                    <button
                      onClick={stopRecording}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      <Square className="w-5 h-5" />
                      Stop
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Settings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recording Mode</h3>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setRecordingMode('webcam');
                    if (recordingStatus === 'idle') startPreview();
                  }}
                  disabled={recordingStatus !== 'idle'}
                  className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-colors ${
                    recordingMode === 'webcam'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${recordingStatus !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Camera className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-medium">Webcam</div>
                    <div className="text-sm text-gray-600">Record yourself</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setRecordingMode('screen');
                    if (recordingStatus === 'idle') startPreview();
                  }}
                  disabled={recordingStatus !== 'idle'}
                  className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-colors ${
                    recordingMode === 'screen'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${recordingStatus !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Monitor className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-medium">Screen</div>
                    <div className="text-sm text-gray-600">Record your screen</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setRecordingMode('both');
                    if (recordingStatus === 'idle') startPreview();
                  }}
                  disabled={recordingStatus !== 'idle'}
                  className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-colors ${
                    recordingMode === 'both'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${recordingStatus !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <MonitorPlay className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-medium">Screen + Webcam</div>
                    <div className="text-sm text-gray-600">Picture-in-picture</div>
                  </div>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Tips</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Test your audio before starting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Close unnecessary applications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Use good lighting for webcam</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Recordings are saved as WebM format</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
