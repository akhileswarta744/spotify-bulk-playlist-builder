import React, { useState, useEffect } from 'react';
import { MatchResult, SpotifyTrack } from '../types';
import { AlertTriangle, X, Check, Music } from 'lucide-react';

interface MultipleMatchesModalProps {
  item: MatchResult | null;
  onClose: () => void;
  onSelectCandidate: (itemId: string, selectedTrack: SpotifyTrack) => void;
}

export const MultipleMatchesModal: React.FC<MultipleMatchesModalProps> = ({
  item,
  onClose,
  onSelectCandidate,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');

  useEffect(() => {
    if (item?.selectedTrack) {
      setSelectedTrackId(item.selectedTrack.id);
    } else if (item?.candidates && item.candidates.length > 0) {
      setSelectedTrackId(item.candidates[0].track.id);
    }
  }, [item]);

  // Handle platform Escape key to dismiss dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const handleConfirm = () => {
    const found = item.candidates.find((c) => c.track.id === selectedTrackId);
    if (found) {
      onSelectCandidate(item.id, found.track);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="multiple-matches-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="multiple-matches-title" className="text-base font-bold text-white">
                Multiple matches found
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate max-w-md">
                Song: &quot;{item.song.raw}&quot;
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Candidate Options List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          <div className="text-xs text-zinc-400 mb-2">
            Select the exact version you want to add to your Spotify playlist:
          </div>

          {item.candidates.map((candidate, idx) => {
            const track = candidate.track;
            const isSelected = track.id === selectedTrackId;

            return (
              <label
                key={track.id}
                onClick={() => setSelectedTrackId(track.id)}
                className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-spotify-green bg-spotify-green/10 shadow-sm'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-800/40 hover:bg-zinc-800/70'
                }`}
              >
                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'border-spotify-green bg-spotify-green text-black'
                      : 'border-zinc-600 bg-zinc-800'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                {/* Cover Art */}
                <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-700">
                  {track.album.images && track.album.images[0] ? (
                    <img
                      src={track.album.images[0].url}
                      alt={track.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music className="w-5 h-5 m-auto text-zinc-600" />
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold text-white truncate">
                      {idx + 1}. {track.name}
                    </div>
                    <span className="text-[11px] font-mono text-spotify-green px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 flex-shrink-0">
                      Score: {candidate.score}%
                    </span>
                  </div>

                  <div className="text-xs text-zinc-300 truncate">
                    {track.artists.map((a) => a.name).join(', ')}
                  </div>

                  <div className="text-xs text-zinc-500 truncate mt-0.5">
                    {track.album.name} {track.album.release_date && `(${track.album.release_date.split('-')[0]})`}
                  </div>

                  {candidate.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {candidate.reasons.map((r, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-3 bg-zinc-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-bold bg-spotify-green hover:bg-spotify-hover text-black rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Select This Track
          </button>
        </div>
      </div>
    </div>
  );
};
