import React, { useState, useEffect } from 'react';
import { SpotifyPlaylist } from '../types';
import { api } from '../services/api';
import { Plus, ListMusic, Search, Check, Loader2, Globe, Lock, Music } from 'lucide-react';

export interface PlaylistSelectionTarget {
  mode: 'new' | 'existing';
  newPlaylistData?: {
    name: string;
    description: string;
    isPublic: boolean;
  };
  existingPlaylist?: SpotifyPlaylist;
}

interface PlaylistModalProps {
  accessToken: string;
  onConfirm: (target: PlaylistSelectionTarget) => void;
  onCancel: () => void;
  totalSongsCount: number;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  accessToken,
  onConfirm,
  onCancel,
  totalSongsCount,
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');

  // New Playlist Form State
  const [newName, setNewName] = useState<string>('Bollywood Party 2026');
  const [newDesc, setNewDesc] = useState<string>(
    'Created using Spotify Bulk Playlist Builder (Hukha Mar)'
  );
  const [isPublic, setIsPublic] = useState<boolean>(false);

  // Existing Playlists State
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'existing' && playlists.length === 0) {
      setLoadingPlaylists(true);
      api
        .getUserPlaylists(accessToken)
        .then((res) => {
          setPlaylists(res.items || []);
          if (res.items && res.items.length > 0) {
            setSelectedExistingId(res.items[0].id);
          }
        })
        .catch((err) => console.error('Failed to load playlists:', err))
        .finally(() => setLoadingPlaylists(false));
    }
  }, [activeTab, accessToken, playlists.length]);

  const filteredPlaylists = playlists.filter((p) =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleProceed = () => {
    if (activeTab === 'new') {
      if (!newName.trim()) return;
      onConfirm({
        mode: 'new',
        newPlaylistData: {
          name: newName.trim(),
          description: newDesc.trim(),
          isPublic,
        },
      });
    } else {
      const selected = playlists.find((p) => p.id === selectedExistingId);
      if (!selected) return;
      onConfirm({
        mode: 'existing',
        existingPlaylist: selected,
      });
    }
  };

  return (
    <div className="bg-spotify-card border border-spotify-border rounded-2xl p-6 sm:p-8 shadow-2xl max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-white">Choose Spotify Playlist</h2>
        <p className="text-sm text-spotify-subtext mt-1">
          Select where you want to add your {totalSongsCount} matched songs.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
        <button
          onClick={() => setActiveTab('new')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'new'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Plus className="w-4 h-4 text-spotify-green" />
          CREATE NEW PLAYLIST
        </button>
        <button
          onClick={() => setActiveTab('existing')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'existing'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ListMusic className="w-4 h-4 text-spotify-green" />
          ADD TO EXISTING PLAYLIST
        </button>
      </div>

      {/* Tab 1: Create New Playlist Form */}
      {activeTab === 'new' && (
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Playlist Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Bollywood Party 2026"
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-spotify-green rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Description
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-spotify-green rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                onClick={() => setIsPublic(false)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  !isPublic
                    ? 'border-spotify-green bg-spotify-green/10'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    !isPublic ? 'border-spotify-green bg-spotify-green text-black' : 'border-zinc-600'
                  }`}
                >
                  {!isPublic && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-200 font-medium">
                  <Lock className="w-4 h-4 text-zinc-400" />
                  <span>Private</span>
                </div>
              </label>

              <label
                onClick={() => setIsPublic(true)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  isPublic
                    ? 'border-spotify-green bg-spotify-green/10'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isPublic ? 'border-spotify-green bg-spotify-green text-black' : 'border-zinc-600'
                  }`}
                >
                  {isPublic && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-200 font-medium">
                  <Globe className="w-4 h-4 text-zinc-400" />
                  <span>Public</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Existing Playlists */}
      {activeTab === 'existing' && (
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search your playlists..."
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-spotify-green rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {loadingPlaylists ? (
              <div className="flex items-center justify-center py-10 text-zinc-400 space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-spotify-green" />
                <span className="text-xs">Loading playlists from Spotify...</span>
              </div>
            ) : filteredPlaylists.length > 0 ? (
              filteredPlaylists.map((pl) => {
                const isSelected = pl.id === selectedExistingId;
                return (
                  <label
                    key={pl.id}
                    onClick={() => setSelectedExistingId(pl.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-spotify-green bg-spotify-green/10'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-700">
                        {pl.images && pl.images[0] ? (
                          <img
                            src={pl.images[0].url}
                            alt={pl.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Music className="w-4 h-4 m-auto text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{pl.name}</div>
                        <div className="text-xs text-zinc-400">
                          {pl.tracks.total} songs &bull; {pl.public ? 'Public' : 'Private'}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'border-spotify-green bg-spotify-green text-black'
                          : 'border-zinc-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </label>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-zinc-500">
                No playlists matched your filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <button
          onClick={onCancel}
          className="text-sm font-medium text-zinc-400 hover:text-white px-4 py-2.5 rounded-lg transition-colors"
        >
          Back to Matches
        </button>

        <button
          onClick={handleProceed}
          disabled={
            (activeTab === 'new' && !newName.trim()) ||
            (activeTab === 'existing' && !selectedExistingId)
          }
          className="bg-spotify-green hover:bg-spotify-hover text-black font-extrabold text-sm px-6 py-2.5 rounded-full transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-40"
        >
          Proceed to Final Review &rarr;
        </button>
      </div>
    </div>
  );
};
