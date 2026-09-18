import { SpotifyTrack } from '../types/spotify';
import { ParsedSong, MatchCandidate, MatchResult, MatchStatus } from '../types';
import { calculateStringSimilarity, normalizeString } from '../utils/stringSimilarity';

/**
 * Score a single Spotify track candidate against a parsed song.
 * Produces a normalized score between 0 and 100 with clear reasoning tags.
 */
export function scoreCandidate(song: ParsedSong, track: SpotifyTrack): MatchCandidate {
  const reasons: string[] = [];
  let titleScore = 0;

  const rawTitle = song.title.trim();
  const trackName = track.name.trim();

  // 1. Track Name Scoring
  if (rawTitle.toLowerCase() === trackName.toLowerCase()) {
    titleScore = 100;
    reasons.push('Exact title match');
  } else {
    const normSongTitle = normalizeString(rawTitle);
    const normTrackName = normalizeString(trackName);

    if (normSongTitle === normTrackName) {
      titleScore = 95;
      reasons.push('Normalized title match');
    } else {
      const sim = calculateStringSimilarity(normSongTitle, normTrackName);
      titleScore = Math.round(sim * 90);
      if (titleScore >= 75) {
        reasons.push('High title similarity');
      } else if (titleScore >= 50) {
        reasons.push('Moderate title similarity');
      }
    }
  }

  // 2. Artist Scoring
  let artistScore = 0;
  const hasArtistConstraint = Boolean(song.artist && song.artist.trim());

  if (hasArtistConstraint) {
    const targetArtist = song.artist!.trim();
    const normTargetArtist = normalizeString(targetArtist);

    let maxArtistSim = 0;
    let matchedArtistName = '';

    for (const artist of track.artists) {
      const normArtist = normalizeString(artist.name);
      if (normTargetArtist === normArtist) {
        maxArtistSim = 1.0;
        matchedArtistName = artist.name;
        break;
      }
      const sim = calculateStringSimilarity(normTargetArtist, normArtist);
      if (sim > maxArtistSim) {
        maxArtistSim = sim;
        matchedArtistName = artist.name;
      }
    }

    if (maxArtistSim >= 0.9) {
      artistScore = 100;
      reasons.push(`Exact artist match (${matchedArtistName})`);
    } else if (maxArtistSim >= 0.6) {
      artistScore = Math.round(maxArtistSim * 90);
      reasons.push(`Partial artist match (${matchedArtistName})`);
    } else {
      artistScore = 10;
      reasons.push('Artist mismatch penalty');
    }
  }

  // 3. Album / Soundtrack Context Scoring
  let albumScore = 0;
  if (song.movieContext && song.movieContext.trim()) {
    const normContext = normalizeString(song.movieContext);
    const normAlbum = normalizeString(track.album.name);

    if (normAlbum.includes(normContext) || normContext.includes(normAlbum)) {
      albumScore = 20;
      reasons.push(`Album/Movie match (${track.album.name})`);
    }
  }

  // 4. Popularity as a SECONDARY signal only (Max 5 points tie-breaker)
  // Ensures popular tracks don't override more accurate lesser-known tracks.
  const popularityBonus = Math.min(5, (track.popularity / 100) * 5);
  if (popularityBonus >= 3) {
    reasons.push(`High catalogue popularity (${track.popularity}%)`);
  }

  // Compute overall composite score (0 - 100)
  let compositeScore = 0;
  if (hasArtistConstraint) {
    // Title 65% + Artist 30% + Album 5% + Popularity tie-breaker
    compositeScore = titleScore * 0.65 + artistScore * 0.3 + (albumScore > 0 ? albumScore * 0.05 : 0) + popularityBonus;
  } else if (song.movieContext && song.movieContext.trim()) {
    // Title 85% + Album/Movie 10% + Popularity tie-breaker
    compositeScore = titleScore * 0.85 + (albumScore > 0 ? 10 : 0) + popularityBonus;
  } else {
    // When no artist or album specified, title accuracy is primary signal
    if (titleScore >= 95) {
      compositeScore = titleScore;
    } else {
      compositeScore = titleScore * 0.95 + popularityBonus;
    }
  }

  // Cap score at 100
  const finalScore = Math.min(100, Math.round(compositeScore));

  let confidence: 'high' | 'medium' | 'low';
  if (finalScore >= 82) {
    confidence = 'high';
  } else if (finalScore >= 55) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    track,
    score: finalScore,
    confidence,
    reasons,
  };
}

/**
 * Evaluates all candidates for a parsed song, sorts them, and determines match status.
 */
export function rankCandidates(song: ParsedSong, tracks: SpotifyTrack[]): MatchResult {
  if (!tracks || tracks.length === 0) {
    return {
      id: song.id,
      song,
      status: 'not_found',
      selectedTrack: undefined,
      candidates: [],
    };
  }

  // Score each candidate
  const candidates: MatchCandidate[] = tracks.map((track) => scoreCandidate(song, track));

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  const top = candidates[0];
  const second = candidates.length > 1 ? candidates[1] : null;

  let status: MatchStatus = 'not_found';
  let selectedTrack: SpotifyTrack | undefined = undefined;

  // Criteria for confident MATCH:
  // - Top score >= 80
  // - If there is a second candidate, margin must be >= 12 points OR top is near perfect (>= 92)
  if (top.score >= 80 && (!second || (top.score - second.score >= 12) || top.score >= 92)) {
    status = 'matched';
    selectedTrack = top.track;
  } else if (top.score >= 50) {
    // Ambiguous or multiple plausible versions
    status = 'needs_review';
    selectedTrack = top.track;
  } else {
    status = 'not_found';
    selectedTrack = undefined;
  }

  return {
    id: song.id,
    song,
    status,
    selectedTrack,
    candidates,
  };
}
