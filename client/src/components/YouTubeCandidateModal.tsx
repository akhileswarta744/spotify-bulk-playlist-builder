import React, { useState } from 'react';
import { MatchResult, YouTubeVideo } from '../types';
import { api } from '../services/api';
import {
  X,
  Check,
  ExternalLink,
  Search,
  Link2,
  Tv,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface YouTubeCandidateModalProps {
  item: MatchResult;
  onClose: () => void;
  onSelectVideo: (itemId: string, video: YouTubeVideo) => void;
}

export const YouTubeCandidateModal: React.FC<YouTubeCandidateModalProps> = ({
  item,
  onClose,
  onSelectVideo,
}) => {
  const candidates = item.youtube?.candidates || [];
  const initialSelected = item.youtube?.selectedVideo || candidates[0] || null;

  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(initialSelected);
  const [activeTab, setActiveTab] = useState<'candidates' | 'manual'>('candidates');

  // Manual URL state
  const [manualUrl, setManualUrl] = useState<string>('');
  const [manualLoading, setManualLoading] = useState<boolean>(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualPreview, setManualPreview] = useState<YouTubeVideo | null>(null);

  const searchQuery =
    item.youtube?.searchQuery ||
    `${item.song.title} ${item.song.artist || ''} ${item.selectedTrack?.album.name || ''}`.trim();

  const handleManualParse = async () => {
    if (!manualUrl.trim()) return;
    try {
      setManualLoading(true);
      setManualError(null);
      const res = await api.parseManualYouTubeUrl(
        manualUrl.trim(),
        item.selectedTrack?.name || item.song.title
      );
      if (res.valid && res.video) {
        setManualPreview(res.video);
        setSelectedVideo(res.video);
      } else {
        setManualError(res.message || 'Invalid YouTube URL. Please check and try again.');
      }
    } catch (err: any) {
      setManualError(err?.response?.data?.message || 'Could not parse YouTube link.');
    } finally {
      setManualLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedVideo) {
      onSelectVideo(item.id, selectedVideo);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold text-white">Choose YouTube Video</h3>
            </div>
            <p className="text-xs text-zinc-400">
              For: <span className="text-white font-medium">{item.selectedTrack?.name || item.song.title}</span>
              {item.song.artist && ` • ${item.song.artist}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-5 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'candidates'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            Top YouTube Matches ({candidates.length})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'manual'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-zinc-400" />
            Paste Custom YouTube Link
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'candidates' ? (
            <div className="space-y-3">
              {candidates.length > 0 ? (
                candidates.map((cand) => {
                  const isSelected = selectedVideo?.videoId === cand.videoId;
                  return (
                    <div
                      key={cand.videoId}
                      onClick={() => setSelectedVideo(cand)}
                      className={`cursor-pointer rounded-xl border p-3 flex items-start gap-3.5 transition-all ${
                        isSelected
                          ? 'border-red-500/80 bg-red-950/20 shadow-md ring-1 ring-red-500/40'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                      }`}
                    >
                      {/* Radio dot */}
                      <div className="mt-1 flex-shrink-0">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-zinc-600 bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Video Thumbnail (16:9) */}
                      <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0 border border-zinc-700/60">
                        <img
                          src={cand.thumbnailUrl}
                          alt={cand.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Video Details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-tight">
                            {cand.title}
                          </p>
                          <a
                            href={cand.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-zinc-400 hover:text-red-400 p-1 flex-shrink-0"
                            title="Open video on YouTube in a new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 flex-wrap">
                          <span className="text-zinc-300 font-medium">{cand.channelTitle}</span>
                          {cand.badge && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                cand.badge === 'Official Music Video'
                                  ? 'bg-red-900/50 text-red-300 border border-red-800/60'
                                  : cand.badge === 'Official Audio'
                                  ? 'bg-blue-900/50 text-blue-300 border border-blue-800/60'
                                  : cand.badge === 'Label Upload'
                                  ? 'bg-amber-900/50 text-amber-300 border border-amber-800/60'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {cand.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-zinc-400">
                    No YouTube candidates currently loaded for this track.
                  </p>
                  <p className="text-xs text-zinc-500">
                    You can search directly on YouTube or paste a custom video link.
                  </p>
                </div>
              )}

              {/* Direct Link to YouTube Search */}
              <div className="pt-2 flex items-center justify-between border-t border-zinc-800 text-xs">
                <span className="text-zinc-500">Can&apos;t find the right video?</span>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 font-medium hover:underline"
                >
                  <Search className="w-3.5 h-3.5" />
                  Search &quot;{searchQuery}&quot; on YouTube
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>
          ) : (
            /* Manual Paste Tab */
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">
                  YouTube Video Link or ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualUrl}
                    onChange={(e) => {
                      setManualUrl(e.target.value);
                      setManualError(null);
                    }}
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={handleManualParse}
                    disabled={!manualUrl.trim() || manualLoading}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors"
                  >
                    {manualLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Supports standard watch links, shortened youtu.be links, and shorts.
                </p>
              </div>

              {manualError && (
                <div className="bg-red-950/40 border border-red-800/80 rounded-xl p-3 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              {manualPreview && (
                <div className="border border-emerald-800/80 bg-emerald-950/20 rounded-xl p-3 flex items-center gap-3">
                  <img
                    src={manualPreview.thumbnailUrl}
                    alt={manualPreview.title}
                    className="w-24 aspect-video object-cover rounded-lg border border-zinc-700 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Verified YouTube Video
                    </span>
                    <p className="text-xs font-semibold text-white truncate">
                      {manualPreview.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      ID: {manualPreview.videoId}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedVideo}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Select YouTube Video
          </button>
        </div>
      </div>
    </div>
  );
};
