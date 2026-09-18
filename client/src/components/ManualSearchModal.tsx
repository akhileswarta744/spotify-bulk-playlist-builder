import React, { useState, useEffect } from 'react';
import { MatchResult, SpotifyTrack } from '../types';
import { api } from '../services/api';
import { Search, X, Loader2, Music, Check } from 'lucide-react';

interface ManualSearchModalProps {
  item: MatchResult | null;
  accessToken: string;
  onClose: () => void;
  onSelectTrack: (itemId: string, selectedTrack: SpotifyTrack) => void;
}

export const ManualSearchModal: React.FC<ManualSearchModalProps> = ({
  item,
  accessToken,
  onClose,
  onSelectTrack,
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setQuery(item.song.title);
      setResults([]);
      setSearched(false);
    }
  }, [item]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const tracks = await api.manualSearchSpotify(query.trim(), accessToken);
      setResults(tracks);
      setSearched(true);
    } catch (err) {
      console.error('Manual search error:', err);
    } finally {
      setLoading(false);
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
        aria-labelledby="manual-search-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div>
            <h3 id="manual-search-title" className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-spotify-green" />
              Manual Spotify Search
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Original input: &quot;{item.song.raw}&quot;
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/50">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Spotify track or artist..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-spotify-green"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-spotify-green hover:bg-spotify-hover text-black font-bold px-4 py-2.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </form>
        </div>

        {/* Results List */}
        <div className="p-5 overflow-y-auto space-y-2 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-spotify-green" />
              <span className="text-xs">Querying Spotify catalog...</span>
            </div>
          ) : results.length > 0 ? (
            results.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
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
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{track.name}</div>
                    <div className="text-xs text-zinc-400 truncate">
                      {track.artists.map((a) => a.name).join(', ')}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {track.album.name} {track.album.release_date && `(${track.album.release_date.split('-')[0]})`}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectTrack(item.id, track);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-spotify-green hover:bg-spotify-hover text-black text-xs font-bold flex items-center gap-1 transition-colors flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  Select
                </button>
              </div>
            ))
          ) : searched ? (
            <div className="text-center py-10 text-zinc-500 text-sm">
              No tracks found matching &quot;{query}&quot;. Try a different spelling or keyword.
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-500 text-sm">
              Enter a query above to search Spotify directly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
