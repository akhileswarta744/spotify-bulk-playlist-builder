import { SpotifyTrack, SpotifyPlaylist, SpotifyUserProfile } from './spotify';

export type MatchStatus = 'matched' | 'needs_review' | 'not_found';

export interface ParsedSong {
  id: string;
  lineNumber: number;
  raw: string;
  title: string;
  artist?: string;
  movieContext?: string;
  isDuplicate: boolean;
  duplicateGroup?: string;
}

export interface MatchCandidate {
  track: SpotifyTrack;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

export type YouTubeBadge = 'Official Music Video' | 'Official Audio' | 'Label Upload' | 'Other';
export type YouTubeStatus = 'video_found' | 'multiple_videos' | 'video_not_found';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
  publishedAt?: string;
  badge?: YouTubeBadge;
  rankScore?: number;
}

export interface YouTubeResult {
  status: YouTubeStatus;
  selectedVideo?: YouTubeVideo;
  candidates: YouTubeVideo[];
  searchQuery: string;
  manualUrl?: string;
  error?: string;
}

export interface MatchResult {
  id: string;
  song: ParsedSong;
  status: MatchStatus;
  selectedTrack?: SpotifyTrack;
  candidates: MatchCandidate[];
  manualQuery?: string;
  youtube?: YouTubeResult;
}

export interface BatchSearchResponse {
  results: MatchResult[];
  summary: {
    total: number;
    matched: number;
    needsReview: number;
    notFound: number;
    duplicates: number;
  };
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface AddTracksRequest {
  playlistId: string;
  trackUris: string[];
}

