import React from 'react';
import { Loader2, XCircle, RotateCcw } from 'lucide-react';

interface SearchProgressBarProps {
  completed: number;
  total: number;
  isSearching: boolean;
  onCancel?: () => void;
  onRetry?: () => void;
  hasErrors?: boolean;
}

export const SearchProgressBar: React.FC<SearchProgressBarProps> = ({
  completed,
  total,
  isSearching,
  onCancel,
  onRetry,
  hasErrors,
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return (
    <div className="bg-spotify-card border border-spotify-border rounded-xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isSearching && <Loader2 className="w-5 h-5 text-spotify-green animate-spin" />}
          <div>
            <div className="text-sm font-bold text-white">
              {isSearching ? 'Searching Spotify...' : 'Search Completed'}
            </div>
            <div className="text-xs text-spotify-subtext">
              Matching your input titles against the official Spotify catalogue
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-mono font-bold text-spotify-green">
            {completed} / {total}
          </div>
          <div className="text-xs text-zinc-500">{percentage}% complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-800 rounded-full h-3.5 overflow-hidden border border-zinc-700/60 p-0.5">
        <div
          className="bg-spotify-green h-full rounded-full transition-all duration-300 ease-out shadow-sm shadow-spotify-green/40"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-zinc-500 font-mono">
          {percentage < 100
            ? `${'█'.repeat(Math.floor(percentage / 10))}${'░'.repeat(10 - Math.floor(percentage / 10))} ${completed} / ${total}`
            : '██████████ 100%'}
        </div>

        <div className="flex items-center gap-2">
          {isSearching && onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/40 border border-red-800/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Search
            </button>
          )}

          {!isSearching && hasErrors && onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-amber-400 hover:text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry Failed Searches
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
