import React, { useState, useEffect, useMemo } from 'react';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import { api } from './services/api';
import { MatchResult, ParsedSong, SpotifyTrack } from './types';
import { Navbar } from './components/Navbar';
import { SongInputSection } from './components/SongInputSection';
import { SearchProgressBar } from './components/SearchProgressBar';
import { MatchReviewCard } from './components/MatchReviewCard';
import { MultipleMatchesModal } from './components/MultipleMatchesModal';
import { ManualSearchModal } from './components/ManualSearchModal';
import { YouTubeCandidateModal } from './components/YouTubeCandidateModal';
import { PlaylistModal, PlaylistSelectionTarget } from './components/PlaylistModal';
import { FinalReviewScreen } from './components/FinalReviewScreen';
import { SuccessScreen } from './components/SuccessScreen';
import { ExportDropdown } from './components/ExportDropdown';
import { YouTubeVideo } from './types';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Filter,
  Layers,
  ArrowRight,
  RotateCcw,
  Music2,
  ExternalLink,
  Youtube,
  Loader2,
} from 'lucide-react';

type AppStep = 'input' | 'searching' | 'review' | 'playlist_select' | 'final_review' | 'adding' | 'success';

export function App() {
  const {
    accessToken,
    profile,
    isConnected,
    loading: authLoading,
    error: authError,
    authConfig,
    login,
    disconnect,
  } = useSpotifyAuth();

  // Step state
  const [step, setStep] = useState<AppStep>('input');

  // Input & Parsing state
  const [inputText, setInputText] = useState<string>('');
  const [parsedSongs, setParsedSongs] = useState<ParsedSong[]>([]);
  const [duplicatesCount, setDuplicatesCount] = useState<number>(0);
  const [hasAi, setHasAi] = useState<boolean>(false);
  const [isAiCleaning, setIsAiCleaning] = useState<boolean>(false);

  // Search & Matching state
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [searchProgress, setSearchProgress] = useState<{ completed: number; total: number }>({
    completed: 0,
    total: 0,
  });
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'matched' | 'needs_review' | 'not_found'>('all');

  // Active Modals state
  const [candidateModalItem, setCandidateModalItem] = useState<MatchResult | null>(null);
  const [manualSearchModalItem, setManualSearchModalItem] = useState<MatchResult | null>(null);
  const [youtubeModalItem, setYoutubeModalItem] = useState<MatchResult | null>(null);
  const [isFindingYouTube, setIsFindingYouTube] = useState<boolean>(false);
  const [isYouTubeConfigured, setIsYouTubeConfigured] = useState<boolean>(false);

  // Target Playlist state
  const [targetPlaylist, setTargetPlaylist] = useState<PlaylistSelectionTarget | null>(null);

  // Adding Progress state
  const [addProgress, setAddProgress] = useState<{ current: number; total: number; currentSongTitle: string }>({
    current: 0,
    total: 0,
    currentSongTitle: '',
  });
  const [successInfo, setSuccessInfo] = useState<{
    playlistName: string;
    songsCount: number;
    playlistUrl?: string;
  } | null>(null);

  // Check AI and YouTube capabilities on mount
  useEffect(() => {
    api.getAiStatus().then((res) => setHasAi(res.available)).catch(() => {});
    api.getYouTubeStatus().then((res) => setIsYouTubeConfigured(res.isConfigured)).catch(() => {});
  }, []);

  // Parse input whenever text changes
  useEffect(() => {
    if (!inputText.trim()) {
      setParsedSongs([]);
      setDuplicatesCount(0);
      return;
    }

    const timer = setTimeout(() => {
      api
        .parseSongs(inputText, false)
        .then((res) => {
          setParsedSongs(res.songs);
          setDuplicatesCount(res.duplicatesCount);
        })
        .catch((err) => console.error('Parsing error:', err));
    }, 150);

    return () => clearTimeout(timer);
  }, [inputText]);

  // Load default 50 songs
  const handleLoadDefault = async () => {
    try {
      const res = await api.getDefaultPlaylist();
      setInputText(res.text);
    } catch (err) {
      console.error('Failed to load default playlist:', err);
    }
  };

  // AI Cleanup action
  const handleAiClean = async () => {
    if (!inputText.trim()) return;
    try {
      setIsAiCleaning(true);
      const res = await api.parseSongs(inputText, true);
      setParsedSongs(res.songs);
      setDuplicatesCount(res.duplicatesCount);
      const formatted = res.songs
        .map((s) => (s.artist ? `${s.title} - ${s.artist}` : s.title))
        .join('\n');
      setInputText(formatted);
    } catch (err) {
      console.error('AI clean failed:', err);
    } finally {
      setIsAiCleaning(false);
    }
  };

  // Deduplication
  const handleDeduplicate = async () => {
    try {
      const res = await api.deduplicateSongs(parsedSongs);
      setParsedSongs(res.songs);
      setDuplicatesCount(0);
      setInputText(res.songs.map((s) => s.raw).join('\n'));
    } catch (err) {
      console.error('Deduplication failed:', err);
    }
  };

  const handleKeepBoth = () => {
    setDuplicatesCount(0);
  };

  // Start Batch Search
  const handleFindSongs = async () => {
    if (!accessToken) {
      login();
      return;
    }

    if (parsedSongs.length === 0) return;

    try {
      setStep('searching');
      setIsSearching(true);
      setSearchProgress({ completed: 0, total: parsedSongs.length });

      // Progress animation simulation while server processes
      const interval = setInterval(() => {
        setSearchProgress((prev) => {
          if (prev.completed < prev.total - 1) {
            return { ...prev, completed: prev.completed + 1 };
          }
          return prev;
        });
      }, 100);

      const response = await api.batchSearchSpotify(parsedSongs, accessToken);
      clearInterval(interval);

      setSearchProgress({ completed: parsedSongs.length, total: parsedSongs.length });
      setMatchResults(response.results);
      setIsSearching(false);
      setStep('review');

      // If YouTube API is configured, search YouTube videos for matched tracks in background
      if (isYouTubeConfigured) {
        handleFindAllYouTube(response.results);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setIsSearching(false);
      alert(err?.response?.data?.message || 'Spotify search failed. Please verify your connection.');
      setStep('input');
    }
  };

  // Find YouTube video for a single track
  const handleFindSingleYouTube = async (item: MatchResult) => {
    try {
      const res = await api.findYouTube(
        item.selectedTrack?.name || item.song.title,
        item.selectedTrack?.artists?.[0]?.name || item.song.artist,
        item.selectedTrack?.album?.name
      );
      setMatchResults((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, youtube: res } : m))
      );
    } catch (err) {
      console.error('Failed to find YouTube video:', err);
    }
  };

  // Concurrently find YouTube videos for all matched tracks
  const handleFindAllYouTube = async (resultsToProcess?: MatchResult[]) => {
    const target = resultsToProcess || matchResults;
    const eligibleTracks = target
      .filter((m) => !m.excluded && m.selectedTrack)
      .map((m) => ({
        id: m.id,
        title: m.selectedTrack!.name,
        artist: m.selectedTrack!.artists?.[0]?.name,
        album: m.selectedTrack!.album?.name,
      }));

    if (eligibleTracks.length === 0) return;

    try {
      setIsFindingYouTube(true);
      const { results } = await api.batchFindYouTube(eligibleTracks);
      setMatchResults((prev) =>
        prev.map((m) => (results[m.id] ? { ...m, youtube: results[m.id] } : m))
      );
    } catch (err) {
      console.error('Batch YouTube find error:', err);
    } finally {
      setIsFindingYouTube(false);
    }
  };

  // Select candidate or custom YouTube video
  const handleSelectYouTubeVideo = (itemId: string, video: YouTubeVideo) => {
    setMatchResults((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentYt = item.youtube;
        const candidates = currentYt?.candidates || [];
        const exists = candidates.some((c) => c.videoId === video.videoId);
        return {
          ...item,
          youtube: {
            status: 'video_found',
            selectedVideo: video,
            candidates: exists ? candidates : [video, ...candidates],
            searchQuery: currentYt?.searchQuery || `${item.song.title} ${item.song.artist || ''}`.trim(),
          },
        };
      })
    );
  };

  // Track selection updates from modals
  const handleSelectCandidateTrack = (itemId: string, track: SpotifyTrack) => {
    setMatchResults((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              selectedTrack: track,
              status: 'matched',
            }
          : item
      )
    );
  };

  // Exclude / Include toggle
  const handleToggleExclude = (itemId: string) => {
    setMatchResults((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, excluded: !item.excluded } : item
      )
    );
  };

  // Bulk Selection Operations
  const handleSelectAllConfident = () => {
    setMatchResults((prev) =>
      prev.map((item) => {
        if (item.selectedTrack && !item.excluded) {
          return item;
        }
        if (item.candidates.length > 0) {
          return {
            ...item,
            selectedTrack: item.candidates[0].track,
            status: 'matched',
            excluded: false,
          };
        }
        return item;
      })
    );
  };

  const handleClearAll = () => {
    setMatchResults((prev) => prev.map((item) => ({ ...item, excluded: true })));
  };

  // Filtered Review List
  const filteredResults = useMemo(() => {
    if (searchFilter === 'all') return matchResults;
    if (searchFilter === 'matched') return matchResults.filter((m) => m.status === 'matched');
    if (searchFilter === 'needs_review') return matchResults.filter((m) => m.status === 'needs_review');
    return matchResults.filter((m) => m.status === 'not_found');
  }, [matchResults, searchFilter]);

  // Summary counts
  const summary = useMemo(() => {
    let matched = 0;
    let needsReview = 0;
    let notFound = 0;
    let included = 0;

    for (const res of matchResults) {
      if (!res.excluded && res.selectedTrack) included++;
      if (res.status === 'matched') matched++;
      else if (res.status === 'needs_review') needsReview++;
      else notFound++;
    }

    return { matched, needsReview, notFound, included, total: matchResults.length };
  }, [matchResults]);

  // Proceed to Playlist Selection
  const handleProceedToPlaylist = () => {
    setStep('playlist_select');
  };

  // Proceed to Final Review
  const handlePlaylistConfirmed = (target: PlaylistSelectionTarget) => {
    setTargetPlaylist(target);
    setStep('final_review');
  };

  // Items ready to add (strictly ordered, non-excluded with valid Spotify track)
  const itemsToAdd = useMemo(() => {
    return matchResults.filter((m) => !m.excluded && Boolean(m.selectedTrack));
  }, [matchResults]);

  // Execute Add to Spotify
  const handleConfirmAddToSpotify = async () => {
    if (!accessToken || !targetPlaylist || itemsToAdd.length === 0) return;

    try {
      setStep('final_review'); // stays on review with isAdding active
      const trackUris = itemsToAdd.map((m) => m.selectedTrack!.uri);

      let finalPlaylistId = '';
      let finalPlaylistName = '';
      let finalPlaylistUrl = '';

      if (targetPlaylist.mode === 'new') {
        const newPl = targetPlaylist.newPlaylistData!;
        const created = await api.createPlaylist(
          newPl.name,
          newPl.description,
          newPl.isPublic,
          accessToken
        );
        finalPlaylistId = created.id;
        finalPlaylistName = created.name;
        finalPlaylistUrl = created.external_urls.spotify;
      } else {
        const existing = targetPlaylist.existingPlaylist!;
        finalPlaylistId = existing.id;
        finalPlaylistName = existing.name;
        finalPlaylistUrl = existing.external_urls.spotify;
      }

      // Add songs sequentially to show progress
      for (let i = 0; i < itemsToAdd.length; i++) {
        setAddProgress({
          current: i + 1,
          total: itemsToAdd.length,
          currentSongTitle: itemsToAdd[i].selectedTrack!.name,
        });
      }

      // Call API to batch add tracks preserving exact order
      await api.addTracksToPlaylist(finalPlaylistId, trackUris, accessToken);

      setSuccessInfo({
        playlistName: finalPlaylistName,
        songsCount: trackUris.length,
        playlistUrl: finalPlaylistUrl,
      });

      setStep('success');
    } catch (err: any) {
      console.error('Error adding tracks to Spotify:', err);
      alert(err?.response?.data?.message || 'Failed to add songs to Spotify playlist');
    }
  };

  // Reset workflow
  const handleCreateAnother = () => {
    setInputText('');
    setParsedSongs([]);
    setMatchResults([]);
    setTargetPlaylist(null);
    setSuccessInfo(null);
    setStep('input');
  };

  return (
    <div className="min-h-screen bg-spotify-dark text-white flex flex-col selection:bg-spotify-green selection:text-black">
      {/* Sticky Navbar */}
      <Navbar
        isConnected={isConnected}
        profile={profile}
        onConnect={login}
        onDisconnect={disconnect}
        isConfigured={Boolean(authConfig?.isConfigured)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Error Alert */}
        {authError && (
          <div className="bg-red-950/40 border border-red-800/80 rounded-xl p-4 flex items-center justify-between text-red-200">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-sm font-medium">{authError}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-semibold px-3 py-1 bg-red-900/60 hover:bg-red-800 rounded-lg text-white"
            >
              Reload
            </button>
          </div>
        )}

        {/* STEP 1: INPUT */}
        {step === 'input' && (
          <div className="space-y-6 animate-fade-in">
            <SongInputSection
              inputText={inputText}
              onChangeText={setInputText}
              parsedSongs={parsedSongs}
              duplicatesCount={duplicatesCount}
              onFindSongs={handleFindSongs}
              onLoadDefault={handleLoadDefault}
              onClearInput={() => setInputText('')}
              onDeduplicate={handleDeduplicate}
              onKeepBoth={handleKeepBoth}
              onAiClean={handleAiClean}
              hasAi={hasAi}
              isAiCleaning={isAiCleaning}
              isConnected={isConnected}
              onConnectPrompt={login}
            />
          </div>
        )}

        {/* STEP 2: SEARCHING */}
        {step === 'searching' && (
          <div className="max-w-2xl mx-auto py-12 animate-fade-in">
            <SearchProgressBar
              completed={searchProgress.completed}
              total={searchProgress.total}
              isSearching={isSearching}
              onCancel={() => {
                setIsSearching(false);
                setStep('input');
              }}
            />
          </div>
        )}

        {/* STEP 3: REVIEW MATCHES */}
        {step === 'review' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Status Counts Header */}
            <div className="bg-spotify-card border border-spotify-border rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                    <Music2 className="w-6 h-6 text-spotify-green" />
                    Review Spotify Matches
                  </h2>
                  <p className="text-xs sm:text-sm text-spotify-subtext mt-0.5">
                    Review candidate matches, pick versions, or search manually before creating your playlist.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleFindAllYouTube()}
                    disabled={isFindingYouTube || summary.included === 0}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/80 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="Search and attach YouTube videos for all matched songs"
                  >
                    {isFindingYouTube ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                    ) : (
                      <Youtube className="w-3.5 h-3.5 text-red-500 fill-current" />
                    )}
                    <span>{isFindingYouTube ? 'Finding Videos...' : 'Find YouTube Videos'}</span>
                  </button>
                  <ExportDropdown results={matchResults} />
                  <button
                    onClick={() => setStep('input')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Edit Song List
                  </button>
                  <button
                    onClick={handleProceedToPlaylist}
                    disabled={summary.included === 0}
                    className="bg-spotify-green hover:bg-spotify-hover text-black font-extrabold text-sm px-5 py-2 rounded-full transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <span>Choose Playlist ({summary.included})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="bg-zinc-900/80 border border-emerald-900/60 rounded-xl p-3 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Found</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono">
                      {summary.matched}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/80 border border-amber-900/60 rounded-xl p-3 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Needs Review</div>
                    <div className="text-lg font-bold text-amber-400 font-mono">
                      {summary.needsReview}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/80 border border-red-900/60 rounded-xl p-3 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">Not Found</div>
                    <div className="text-lg font-bold text-red-400 font-mono">
                      {summary.notFound}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-xl p-3 flex items-center gap-3">
                  <Layers className="w-5 h-5 text-spotify-green flex-shrink-0" />
                  <div>
                    <div className="text-xs text-zinc-400 font-medium">To Add</div>
                    <div className="text-lg font-bold text-white font-mono">
                      {summary.included} / {summary.total}
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Bulk Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
                  <button
                    onClick={() => setSearchFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      searchFilter === 'all'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    All ({summary.total})
                  </button>
                  <button
                    onClick={() => setSearchFilter('matched')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      searchFilter === 'matched'
                        ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Matched ({summary.matched})
                  </button>
                  <button
                    onClick={() => setSearchFilter('needs_review')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      searchFilter === 'needs_review'
                        ? 'bg-zinc-800 text-amber-400 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Needs Review ({summary.needsReview})
                  </button>
                  <button
                    onClick={() => setSearchFilter('not_found')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      searchFilter === 'not_found'
                        ? 'bg-zinc-800 text-red-400 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Not Found ({summary.notFound})
                  </button>
                </div>

                {/* Bulk Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSelectAllConfident}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                  >
                    Select All Confident Matches
                  </button>
                  <button
                    onClick={() => setSearchFilter('needs_review')}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 transition-colors"
                  >
                    Review Ambiguous ({summary.needsReview})
                  </button>
                  <button
                    onClick={() => setSearchFilter('not_found')}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-red-300 border border-zinc-700 transition-colors"
                  >
                    Review Unmatched ({summary.notFound})
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* List of Match Review Cards */}
            <div className="space-y-3">
              {filteredResults.map((item, index) => (
                <MatchReviewCard
                  key={item.id}
                  item={item}
                  index={index}
                  onChangeMatch={(it) => setCandidateModalItem(it)}
                  onSearchManually={(it) => setManualSearchModalItem(it)}
                  onToggleExclude={handleToggleExclude}
                  onFindYouTube={handleFindSingleYouTube}
                  onChangeYouTubeVideo={(it) => setYoutubeModalItem(it)}
                />
              ))}

              {filteredResults.length === 0 && (
                <div className="text-center py-16 text-zinc-500 text-sm">
                  No tracks in this filter category.
                </div>
              )}
            </div>

            {/* Bottom Floating Bar */}
            <div className="sticky bottom-4 z-20 bg-zinc-900/95 backdrop-blur border border-zinc-700/80 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
              <div className="text-sm font-semibold text-zinc-300">
                <span className="text-spotify-green font-bold">{summary.included}</span> songs ready to add to Spotify
              </div>
              <button
                onClick={handleProceedToPlaylist}
                disabled={summary.included === 0}
                className="bg-spotify-green hover:bg-spotify-hover text-black font-extrabold text-sm px-6 py-2.5 rounded-full transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
              >
                <span>Proceed to Playlist Selection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PLAYLIST SELECTION */}
        {step === 'playlist_select' && (
          <div className="py-6 animate-fade-in">
            <PlaylistModal
              accessToken={accessToken!}
              onConfirm={handlePlaylistConfirmed}
              onCancel={() => setStep('review')}
              totalSongsCount={itemsToAdd.length}
            />
          </div>
        )}

        {/* STEP 5: FINAL REVIEW */}
        {step === 'final_review' && targetPlaylist && (
          <div className="py-4 animate-fade-in">
            <FinalReviewScreen
              itemsToAdd={itemsToAdd}
              targetPlaylist={targetPlaylist}
              onConfirmAdd={handleConfirmAddToSpotify}
              onBack={() => setStep('playlist_select')}
              isAdding={addProgress.current > 0 && addProgress.current < addProgress.total}
              addProgress={addProgress}
            />
          </div>
        )}

        {/* STEP 6: SUCCESS */}
        {step === 'success' && successInfo && (
          <div className="animate-fade-in">
            <SuccessScreen
              playlistName={successInfo.playlistName}
              songsCount={successInfo.songsCount}
              playlistUrl={successInfo.playlistUrl}
              onCreateAnother={handleCreateAnother}
              onViewMatches={() => setStep('review')}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      {candidateModalItem && (
        <MultipleMatchesModal
          item={candidateModalItem}
          onClose={() => setCandidateModalItem(null)}
          onSelectCandidate={handleSelectCandidateTrack}
        />
      )}

      {manualSearchModalItem && accessToken && (
        <ManualSearchModal
          item={manualSearchModalItem}
          accessToken={accessToken}
          onClose={() => setManualSearchModalItem(null)}
          onSelectTrack={handleSelectCandidateTrack}
        />
      )}

      {youtubeModalItem && (
        <YouTubeCandidateModal
          item={youtubeModalItem}
          onClose={() => setYoutubeModalItem(null)}
          onSelectVideo={handleSelectYouTubeVideo}
        />
      )}
    </div>
  );
}
