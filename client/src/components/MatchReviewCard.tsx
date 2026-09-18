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
  Tv,
  Youtube,
  Link2,
} from 'lucide-react';

interface MatchReviewCardProps {
  item: MatchResult;
  index: number;
  onChangeMatch: (item: MatchResult) => void;
  onSearchManually: (item: MatchResult) => void;
  onToggleExclude: (itemId: string) => void;
  onFindYouTube?: (item: MatchResult) => void;
  onChangeYouTubeVideo?: (item: MatchResult) => void;
}

export const MatchReviewCard: React.FC<MatchReviewCardProps> = ({
  item,
  index,
  onChangeMatch,
  onSearchManually,
  onToggleExclude,
  onFindYouTube,
  onChangeYouTubeVideo,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const track = item.selectedTrack;
  const isExcluded = Boolean(item.excluded);
  const yt = item.youtube;
  const ytVideo = yt?.selectedVideo;

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

  // Spotify Status Badge Rendering
  const renderSpotifyBadge = () => {
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

  // YouTube Status Badge Rendering
  const renderYouTubeBadge = () => {
    if (!yt) {
      return null;
    }

    if (yt.status === 'video_found') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
          <CheckCircle2 className="w-3 h-3" />
          Video Found
        </span>
      );
    }

    if (yt.status === 'multiple_videos') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-400 border border-amber-800/80">
          <AlertTriangle className="w-3 h-3" />
          Multiple Videos ({yt.candidates.length})
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
        <XCircle className="w-3 h-3" />
        Video Not Found
      </span>
    );
  };

  const searchQuery =
    yt?.searchQuery ||
    `${item.song.title} ${item.song.artist || ''} ${track?.album.name || ''}`.trim();

  return (
    <div
      className={`bg-spotify-card border transition-all duration-200 rounded-xl p-4 sm:p-5 flex flex-col gap-3.5 ${
        isExcluded
          ? 'border-zinc-800/60 opacity-60 bg-zinc-900/40'
          : item.status === 'needs_review'
          ? 'border-amber-700/60 shadow-md shadow-amber-950/10'
          : item.status === 'not_found'
          ? 'border-red-900/60 bg-red-950/10'
          : 'border-spotify-border hover:border-zinc-700'
      }`}
    >
      {/* 1. TOP ROW: SPOTIFY MATCH SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Index & Spotify Details */}
        <div className="flex items-start sm:items-center gap-3.5 w-full sm:w-auto flex-1 min-w-0">
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
            {/* Original Input Text */}
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

        {/* Right: Spotify Actions & Status */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-zinc-800 pt-2 sm:pt-0 flex-shrink-0">
          <div className="flex items-center gap-2">{renderSpotifyBadge()}</div>

          <div className="flex items-center gap-2">
            {/* Change Match button */}
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

            {/* Search Manually button */}
            {item.status === 'not_found' && (
              <button
                onClick={() => onSearchManually(item)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-spotify-green" />
                Search Manually
              </button>
            )}

            {/* Direct Spotify link */}
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

            {/* Exclude / Include button */}
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

      {/* 2. BOTTOM ROW: YOUTUBE RESULT SECTION */}
      <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-xl p-3 sm:p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: YouTube Video Info */}
        <div className="flex items-start sm:items-center gap-3 w-full md:w-auto flex-1 min-w-0">
          {/* YouTube Video Thumbnail or Placeholder */}
          <div className="relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0 flex items-center justify-center">
            {ytVideo?.thumbnailUrl ? (
              <img
                src={ytVideo.thumbnailUrl}
                alt={ytVideo.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <Youtube className="w-6 h-6 text-zinc-600" />
            )}
          </div>

          {/* YouTube Text Details */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 uppercase tracking-wider">
                <Youtube className="w-3.5 h-3.5 fill-current" />
                YouTube Video
              </span>
              {renderYouTubeBadge()}
              {ytVideo?.badge && (
                <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded font-semibold border border-zinc-700">
                  {ytVideo.badge}
                </span>
              )}
            </div>

            {ytVideo ? (
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-zinc-100 truncate" title={ytVideo.title}>
                  {ytVideo.title}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  Channel: <span className="text-zinc-300 font-medium">{ytVideo.channelTitle}</span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">
                {yt?.error || 'No YouTube video selected.'}
              </p>
            )}
          </div>
        </div>

        {/* Right: YouTube Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-shrink-0 border-t md:border-t-0 border-zinc-800/80 pt-2 md:pt-0">
          {/* [VIEW ON YOUTUBE] Button */}
          {ytVideo && (
            <a
              href={ytVideo.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02] active:scale-95"
              title="Open and watch video on YouTube (opens in new tab)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>VIEW ON YOUTUBE</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </a>
          )}

          {/* [CHANGE VIDEO] Button */}
          {onChangeYouTubeVideo && (
            <button
              onClick={() => onChangeYouTubeVideo(item)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
              title="Change or choose another candidate YouTube video"
            >
              <Tv className="w-3.5 h-3.5 text-zinc-400" />
              <span>Change Video</span>
              {yt?.candidates && yt.candidates.length > 1 && (
                <span className="bg-zinc-700 text-[10px] px-1.5 py-0.2 rounded-full text-zinc-300">
                  {yt.candidates.length}
                </span>
              )}
            </button>
          )}

          {/* If video not found: Quick manual search or find */}
          {!ytVideo && (
            <div className="flex items-center gap-2">
              {onFindYouTube && (
                <button
                  onClick={() => onFindYouTube(item)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-red-400" />
                  Find Video
                </button>
              )}
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-zinc-800 flex items-center gap-1 transition-colors hover:underline"
                title="Search on YouTube in a new tab"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              {onChangeYouTubeVideo && (
                <button
                  onClick={() => onChangeYouTubeVideo(item)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1 transition-colors"
                  title="Paste custom YouTube link"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Paste Link</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
