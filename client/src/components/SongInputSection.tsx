import React, { useRef } from 'react';
import { ParsedSong } from '../types';
import {
  Sparkles,
  FileText,
  Upload,
  AlertTriangle,
  Search,
  ListMusic,
  Trash2,
} from 'lucide-react';

interface SongInputSectionProps {
  inputText: string;
  onChangeText: (text: string) => void;
  parsedSongs: ParsedSong[];
  duplicatesCount: number;
  onFindSongs: () => void;
  onLoadDefault: () => void;
  onClearInput: () => void;
  onDeduplicate: () => void;
  onKeepBoth: () => void;
  onAiClean: () => void;
  hasAi: boolean;
  isAiCleaning: boolean;
  isConnected: boolean;
  onConnectPrompt: () => void;
}

export const SongInputSection: React.FC<SongInputSectionProps> = ({
  inputText,
  onChangeText,
  parsedSongs,
  duplicatesCount,
  onFindSongs,
  onLoadDefault,
  onClearInput,
  onDeduplicate,
  onKeepBoth,
  onAiClean,
  hasAi,
  isAiCleaning,
  isConnected,
  onConnectPrompt,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle TXT or CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      if (file.name.endsWith('.csv')) {
        // Parse CSV - find first non-header column or text column
        const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length > 0) {
          // If first line has commas, assume first column is song title
          const extracted = lines.map((line) => {
            const cols = line.split(',');
            const val = cols[0].replace(/^["']|["']$/g, '').trim();
            return val;
          });
          onChangeText(extracted.join('\n'));
        }
      } else {
        // Plain text file
        onChangeText(content);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="bg-spotify-card border border-spotify-border rounded-xl p-6 shadow-xl space-y-5">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-spotify-green" />
            Paste Your Songs
          </h2>
          <p className="text-xs sm:text-sm text-spotify-subtext mt-0.5">
            Supports one per line, numbered lists (1. Song), bullets (&bull; Song), and Song - Artist.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Load Default 50 songs */}
          <button
            onClick={onLoadDefault}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-1.5 transition-colors"
            title="Load default 50 Bollywood party tracks (includes Chammak Challo, strictly no Zaalima)"
          >
            <Sparkles className="w-3.5 h-3.5 text-spotify-green" />
            Load Default (50 Songs)
          </button>

          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            Import TXT / CSV
          </button>

          {/* Optional AI Clean */}
          {hasAi && (
            <button
              onClick={onAiClean}
              disabled={isAiCleaning || parsedSongs.length === 0}
              className="text-xs bg-gradient-to-r from-purple-900/50 to-indigo-900/50 hover:from-purple-800/50 hover:to-indigo-800/50 text-purple-200 font-medium px-3 py-1.5 rounded-lg border border-purple-700/50 flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Parse messy natural-language phrases into structured titles"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              {isAiCleaning ? 'Cleaning with AI...' : 'Clean with AI'}
            </button>
          )}

          {inputText.trim().length > 0 && (
            <button
              onClick={onClearInput}
              className="text-xs text-zinc-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              title="Clear text"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Large Textarea */}
      <div className="relative">
        <textarea
          value={inputText}
          onChange={(e) => onChangeText(e.target.value)}
          rows={12}
          placeholder={`Tu Meri\nTune Maari Entriyaan\nBadtameez Dil\nDhan Te Nan\nVele`}
          className="w-full bg-[#141414] border border-zinc-800 focus:border-spotify-green rounded-lg p-4 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-spotify-green resize-y leading-relaxed"
        />

        {/* Live Detected Counter Badge */}
        <div className="absolute bottom-3 right-4 bg-zinc-900/90 border border-zinc-700 px-3 py-1 rounded-full text-xs font-semibold text-zinc-300 backdrop-blur shadow-sm">
          Songs detected: <span className="text-spotify-green font-bold">{parsedSongs.length}</span>
        </div>
      </div>

      {/* Duplicate Detection Alert Banner */}
      {duplicatesCount > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm text-amber-300">
                Duplicate detected ({duplicatesCount} duplicate occurrences)
              </div>
              <div className="text-xs text-amber-200/80">
                Some songs appear more than once in your input. Would you like to keep both or remove duplicates?
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onKeepBoth}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 transition-colors"
            >
              KEEP BOTH
            </button>
            <button
              onClick={onDeduplicate}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-black transition-colors"
            >
              REMOVE DUPLICATE
            </button>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-zinc-500 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-zinc-400" />
          <span>Original ordering will be strictly preserved when building the playlist.</span>
        </div>

        <button
          onClick={() => {
            if (!isConnected) {
              onConnectPrompt();
            } else {
              onFindSongs();
            }
          }}
          disabled={parsedSongs.length === 0}
          className="w-full sm:w-auto bg-spotify-green hover:bg-spotify-hover text-black font-extrabold text-sm px-8 py-3 rounded-full transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          FIND SONGS ON SPOTIFY
        </button>
      </div>
    </div>
  );
};
