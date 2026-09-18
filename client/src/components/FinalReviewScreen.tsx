import React from 'react';
import { MatchResult } from '../types';
import { PlaylistSelectionTarget } from './PlaylistModal';
import { ArrowLeft, Check, ShieldCheck, Music, Loader2 } from 'lucide-react';

interface FinalReviewScreenProps {
  itemsToAdd: MatchResult[];
  targetPlaylist: PlaylistSelectionTarget;
  onConfirmAdd: () => void;
  onBack: () => void;
  isAdding: boolean;
  addProgress: { current: number; total: number; currentSongTitle: string };
}

export const FinalReviewScreen: React.FC<FinalReviewScreenProps> = ({
  itemsToAdd,
  targetPlaylist,
  onConfirmAdd,
  onBack,
  isAdding,
  addProgress,
}) => {
  const playlistName =
    targetPlaylist.mode === 'new'
      ? targetPlaylist.newPlaylistData?.name || 'New Playlist'
      : targetPlaylist.existingPlaylist?.name || 'Existing Playlist';

  const isPublic =
    targetPlaylist.mode === 'new'
      ? Boolean(targetPlaylist.newPlaylistData?.isPublic)
      : Boolean(targetPlaylist.existingPlaylist?.public);

  const percentage =
    addProgress.total > 0
      ? Math.round((addProgress.current / addProgress.total) * 100)
      : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-spotify-card border border-spotify-border rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-spotify-green text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Final Confirmation
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">READY TO ADD</h2>
            <p className="text-sm text-spotify-subtext mt-1">
              Adding <span className="text-white font-bold">{itemsToAdd.length} songs</span> to{' '}
              <span className="text-spotify-green font-bold">&quot;{playlistName}&quot;</span> (
              {isPublic ? 'Public' : 'Private'}).
            </p>
          </div>

          {!isAdding && (
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change Playlist
              </button>
              <button
                onClick={onConfirmAdd}
                className="bg-spotify-green hover:bg-spotify-hover text-black font-black text-sm px-6 py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                ADD {itemsToAdd.length} SONGS TO SPOTIFY
              </button>
            </div>
          )}
        </div>

        {/* Adding In Progress Indicator */}
        {isAdding && (
          <div className="mt-6 p-5 rounded-xl bg-zinc-900 border border-spotify-green/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-spotify-green" />
                <span>Adding songs to Spotify...</span>
              </div>
              <div className="font-mono text-sm font-bold text-spotify-green">
                {addProgress.current} / {addProgress.total}
              </div>
            </div>

            <div className="text-xs text-zinc-400">
              Current: <span className="text-white font-medium">&quot;{addProgress.currentSongTitle}&quot;</span>
            </div>

            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden border border-zinc-700">
              <div
                className="bg-spotify-green h-full rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Strict Order Guarantee Notice */}
        <div className="mt-4 text-xs text-zinc-500 bg-zinc-900/60 rounded-lg p-3 border border-zinc-800/80 flex items-center gap-2">
          <span className="font-bold text-zinc-400">Strict Order Preservation:</span>
          <span>
            Tracks will be inserted into Spotify in the exact sequence shown below. No alphabetical sorting, no popularity shuffling.
          </span>
        </div>
      </div>

      {/* Ordered Songs Table */}
      <div className="bg-spotify-card border border-spotify-border rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          ORDER OF TRACKS (1 TO {itemsToAdd.length})
        </h3>

        <div className="divide-y divide-zinc-800/80">
          {itemsToAdd.map((item, idx) => {
            const track = item.selectedTrack;
            return (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="font-mono text-xs font-bold text-zinc-500 w-6 text-right">
                    {idx + 1}.
                  </span>

                  <div className="w-9 h-9 rounded bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-700">
                    {track?.album.images && track.album.images[0] ? (
                      <img
                        src={track.album.images[0].url}
                        alt={track.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="w-4 h-4 m-auto text-zinc-600" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {track ? track.name : item.song.raw}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                      {track ? track.artists.map((a) => a.name).join(', ') : 'Custom query'}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-zinc-500 truncate hidden sm:block">
                  {track?.uri}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
