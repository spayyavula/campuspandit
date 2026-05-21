import React from 'react';
import { Video, PhoneOff, Settings, AlertCircle } from 'lucide-react';

interface VideoCallInterfaceProps {
  sessionId: string;
  onLeave: () => void;
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({ sessionId, onLeave }) => {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
      <div className="border-b border-neutral-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="w-5 h-5 text-primary-400" />
          <div>
            <div className="text-sm text-neutral-400">Session</div>
            <code className="text-xs text-neutral-300">{sessionId}</code>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <PhoneOff className="w-4 h-4" />
            Leave
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Video room not yet wired up</h2>
          <p className="text-neutral-400 leading-relaxed">
            This is a placeholder for the Daily.co video room. The session was created but the
            live-room embed has not been connected yet. Use "Leave" to return to your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoCallInterface;
