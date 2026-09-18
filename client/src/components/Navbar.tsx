import React from 'react';
import { SpotifyUserProfile } from '../types';
import { LogOut, Music, CheckCircle2, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  isConnected: boolean;
  profile: SpotifyUserProfile | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isConfigured: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  isConnected,
  profile,
  onConnect,
  onDisconnect,
  isConfigured,
}) => {
  return (
    <header className="border-b border-spotify-border bg-spotify-dark/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Title & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-spotify-green flex items-center justify-center text-black shadow-lg shadow-spotify-green/20 flex-shrink-0">
            <Music className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Spotify Bulk Playlist Builder
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-zinc-800 text-spotify-green border border-zinc-700">
                Hukha Mar
              </span>
            </div>
            <p className="text-xs sm:text-sm text-spotify-subtext">
              Paste your songs. Find them on Spotify. Build your playlist.
            </p>
          </div>
        </div>

        {/* Authentication State */}
        <div className="flex items-center gap-3">
          {isConnected && profile ? (
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700/80 rounded-full py-1.5 px-4 shadow-sm">
              {profile.images && profile.images[0] ? (
                <img
                  src={profile.images[0].url}
                  alt={profile.display_name || 'User Avatar'}
                  className="w-7 h-7 rounded-full object-cover border border-spotify-green/40"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-spotify-green/20 text-spotify-green flex items-center justify-center text-xs font-bold">
                  {profile.display_name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-xs text-spotify-green font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Spotify Connected</span>
                </div>
                <div className="text-xs font-semibold text-white truncate max-w-[140px]">
                  {profile.display_name || 'Spotify User'}
                </div>
              </div>
              <button
                onClick={onDisconnect}
                title="Disconnect Spotify"
                className="ml-2 p-1.5 text-zinc-400 hover:text-red-400 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {!isConfigured && (
                <span className="text-xs text-amber-400 flex items-center gap-1 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/60">
                  <ShieldCheck className="w-3 h-3" />
                  Enter Client ID in .env
                </span>
              )}
              <button
                onClick={onConnect}
                className="bg-spotify-green hover:bg-spotify-hover text-black font-bold text-sm px-5 py-2.5 rounded-full transition-all duration-200 flex items-center gap-2 shadow-md hover:scale-105 active:scale-95"
              >
                <Music className="w-4 h-4 fill-current" />
                CONNECT SPOTIFY
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
