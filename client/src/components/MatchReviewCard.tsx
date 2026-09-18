import React, { useState } from 'react';
import { MatchResult, SpotifyTrack } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  Layers,
  Search,
  ExternalLink,
  Ban,
  Check,
} from 'lucide-react';

interface MatchReviewCardProps {
  item: MatchResult;
  index: number;
  onChangeMatch: (item: MatchResult) => void;
  onSearchManually: (item: MatchResult) => void;
  onToggleExclude: (itemId: string) => void;
}

export const MatchReviewCard: React.FC<MatchReviewCardProps> = ({
  item,
  index,
  onChangeMatch,
  onSearchManually,
  onToggleExclude,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const track = item.selectedTrack;
  const isExcluded = Boolean(item.excluded);

  const togglePlay = () => {
    if (!track?.preview_url) return;

    if (isPlaying) {
      audio?.pause();
      setIsPlaying(false);
    } else {
      const newAudio = audio || new Audio(track.preview_url);
      newAudio.onended = () => setIsPlaying(false);
      newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);
    }
  };

  // Status Badge Rendering
  const renderBadge = () => {
    if (isExcluded) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
          <Ban className="w-3.5 h-3.5" />
          EXCLUDED
        </span>
      );
    }

    if (item.status === 'matched') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
          <CheckCircle2 className="w-3.5 h-3.5" />
          MATCHED
        </span>
      );
    }

    if (item.status === 'needs_review') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/80">
          <AlertTriangle className="w-3.5 h-3.5" />
          NEEDS REVIEW
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-950/60 text-red-400 border border-red-800/80">
        <XCircle className="w-3.5 h-3.5" />
        NOT FOUND
      </span>
    );
  };

  return (
    <div
      className={`bg-spotify-card border transition-all duration-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isExcluded
          ? 'border-zinc-800/60 opacity-60 bg-zinc-900/40'
          : item.status === 'needs_review'
          ? 'border-amber-700/60 shadow-md shadow-amber-950/10'
          : item.status === 'not_found'
          ? 'border-red-900/60 bg-red-950/10'
          : 'border-spotify-border hover:border-zinc-700'
      }`}
    >
      {/* Left: Index & Details */}
      <div className="flex items-start sm:items-center gap-3.5 w-full sm:w-auto">
        {/* Number index */}
        <div className="font-mono text-sm font-bold text-zinc-500 w-7 flex-shrink-0 text-right">
          {index + 1}.
        </div>

        {/* Album Artwork with Play Overlay */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-700/60 shadow">
          {track?.album.images && track.album.images[0] ? (
            <img
              src={track.album.images[0].url}
              alt={track.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-bold">
              NO ART
            </div>
          )}

          {track?.preview_url && (
            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause preview' : 'Play 30s preview'}
              className="absolute inset-0 bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-opacity"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
          )}
        </div>

        {/* Track Metadata */}
        <div className="space-y-1 min-w-0 flex-1">
          {/* Original Input Text if differing */}
          <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5 truncate">
            <span>Input:</span>
            <span className="text-zinc-200 font-semibold">{item.song.raw}</span>
            {item.song.isDuplicate && (
              <span className="text-[10px] bg-amber-900/40 text-amber-400 px-1.5 py-0.2 rounded border border-amber-800/40">
                duplicate
              </span>
            )}
          </div>

          {track ? (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-white hover:text-spotify-green transition-colors truncate">
                  {track.name}
                </span>
                {track.explicit && (
                  <span className="text-[10px] bg-zinc-700 text-zinc-200 px-1.5 py-0.5 rounded font-bold uppercase">
                    E
                  </span>
                )}
              </div>

              <div className="text-xs sm:text-sm text-spotify-subtext truncate">
                <span className="text-zinc-300 font-medium">
                  {track.artists.map((a) => a.name).join(', ')}
                </span>
                <span className="mx-1.5 text-zinc-600">&bull;</span>
                <span className="text-zinc-400">{track.album.name}</span>
                {track.album.release_date && (
                  <>
                    <span className="mx-1.5 text-zinc-600">&bull;</span>
                    <span className="text-zinc-500">
                      {track.album.release_date.split('-')[0]}
                    </span>
                  </>
                )}
              </div>

              <div className="text-[11px] text-zinc-500 font-mono truncate max-w-sm pt-0.5">
                {track.uri}
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-300 italic">
              Couldn&apos;t find this song on Spotify.
            </div>
          )}
        </div>
      </div>

      {/* Right: Status Badge & Actions */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-zinc-800 pt-2 sm:pt-0">
        <div className="flex items-center gap-2">{renderBadge()}</div>

        <div className="flex items-center gap-2">
          {/* Multiple matches / Change Match button */}
          {item.candidates && item.candidates.length > 1 && (
            <button
              onClick={() => onChangeMatch(item)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
              title="Select a different version from candidate matches"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Change Match</span>
              <span className="bg-zinc-700 text-[10px] px-1.5 py-0.2 rounded-full">
                {item.candidates.length}
              </span>
            </button>
          )}

          {/* Search Manually button if not found or desired */}
          {item.status === 'not_found' && (
            <button
              onClick={() => onSearchManually(item)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-spotify-green" />
              Search Manually
            </button>
          )}

          {/* Direct link to Spotify */}
          {track?.external_urls.spotify && (
            <a
              href={track.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-zinc-400 hover:text-spotify-green hover:bg-zinc-800 rounded-lg transition-colors"
              title="Open track on Spotify"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Toggle Exclude / Include */}
          <button
            onClick={() => onToggleExclude(item.id)}
            className={`p-2 rounded-lg transition-colors ${
              isExcluded
                ? 'text-zinc-500 hover:text-white bg-zinc-800'
                : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800'
            }`}
            title={isExcluded ? 'Include track in playlist' : 'Exclude track from playlist'}
          >
            {isExcluded ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
