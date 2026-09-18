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

export interface MatchResult {
  id: string;
  song: ParsedSong;
  status: MatchStatus;
  selectedTrack?: SpotifyTrack;
  candidates: MatchCandidate[];
  manualQuery?: string;
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
