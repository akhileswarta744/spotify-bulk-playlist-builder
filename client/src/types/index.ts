export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  uri: string;
  images: SpotifyImage[];
  release_date: string;
  total_tracks: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  popularity: number;
  preview_url: string | null;
  explicit: boolean;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string | null;
  email?: string;
  images?: SpotifyImage[];
  uri: string;
  external_urls: {
    spotify: string;
  };
  product?: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  public: boolean;
  collaborative: boolean;
  uri: string;
  images: SpotifyImage[];
  tracks: {
    total: number;
    href: string;
  };
  owner: {
    id: string;
    display_name: string | null;
  };
  external_urls: {
    spotify: string;
  };
}

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
  excluded?: boolean;
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
