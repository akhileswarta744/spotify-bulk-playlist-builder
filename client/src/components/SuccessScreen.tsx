import React from 'react';
import { CheckCircle2, ExternalLink, RefreshCw, Eye } from 'lucide-react';

interface SuccessScreenProps {
  playlistName: string;
  songsCount: number;
  playlistUrl?: string;
  onCreateAnother: () => void;
  onViewMatches: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  playlistName,
  songsCount,
  playlistUrl,
  onCreateAnother,
  onViewMatches,
}) => {
  return (
    <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 bg-spotify-card border border-spotify-border rounded-3xl shadow-2xl text-center space-y-6 animate-scale-up">
      <div className="w-20 h-20 rounded-full bg-spotify-green/20 border border-spotify-green/40 text-spotify-green flex items-center justify-center mx-auto shadow-xl shadow-spotify-green/10">
        <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Playlist created successfully
        </h2>
        <p className="text-lg text-spotify-green font-semibold">
          {songsCount} songs added.
        </p>
        <p className="text-sm text-spotify-subtext max-w-sm mx-auto">
          Your tracks were successfully verified and added to{' '}
          <span className="text-white font-bold">&quot;{playlistName}&quot;</span> in exact order.
        </p>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        {playlistUrl && (
          <a
            href={playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-spotify-green hover:bg-spotify-hover text-black font-extrabold text-sm px-6 py-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            OPEN IN SPOTIFY
          </a>
        )}

        <button
          onClick={onCreateAnother}
          className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm px-6 py-3 rounded-full transition-all flex items-center justify-center gap-2 border border-zinc-700 hover:scale-105"
        >
          <RefreshCw className="w-4 h-4" />
          CREATE ANOTHER PLAYLIST
        </button>

        <button
          onClick={onViewMatches}
          className="w-full sm:w-auto text-zinc-400 hover:text-white font-semibold text-sm px-4 py-3 rounded-full transition-all flex items-center justify-center gap-1.5"
        >
          <Eye className="w-4 h-4" />
          VIEW MATCHES
        </button>
      </div>
    </div>
  );
};
