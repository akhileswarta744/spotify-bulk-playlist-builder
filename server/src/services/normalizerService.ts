import { ParsedSong } from '../types';
import { normalizeString } from '../utils/stringSimilarity';

/**
 * Clean and parse user-provided song list text into structured ParsedSong items.
 */
export function parseSongList(text: string): ParsedSong[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const lines = text.split(/\r?\n/);
  const parsedItems: {
    id: string;
    lineNumber: number;
    raw: string;
    title: string;
    artist?: string;
    movieContext?: string;
    normalizedKey: string;
  }[] = [];

  let lineNumber = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      continue;
    }

    lineNumber++;

    // 1. Strip leading numbering and bullet patterns:
    // Examples: "1.", "1)", "01.", "1 -", "4 - ", "•", "-", "*", "▪", "–", "—"
    let cleaned = trimmed.replace(
      /^(\s*(\d+\s*[\.\)\-:]\s*)|([\u2022\u25E6\u2023\u2043\u2219\u25CF\u25CB\u25A0\u25AA\u25AB\u2013\u2014•\*\-▪–—]\s*))+/iu,
      ''
    ).trim();

    if (!cleaned) {
      continue;
    }

    // 2. Extract movie/soundtrack context if mentioned like:
    // "Tu Meri from Bang Bang", "that Tu Meri song from Bang Bang"
    let movieContext: string | undefined;
    const fromMovieMatch = cleaned.match(
      /(?:that\s+)?(.+?)\s+(?:song\s+)?(?:from|in)\s+["']?([^"'\(\)]+)["']?$/i
    );
    if (fromMovieMatch) {
      cleaned = fromMovieMatch[1].trim();
      movieContext = fromMovieMatch[2].trim();
    }

    // 3. Detect "Song - Artist" or "Artist - Song" separator
    // Matches " - ", " – ", " — ", " | ", or " by "
    let title = cleaned;
    let artist: string | undefined;

    const separatorMatch = cleaned.match(/\s+[-–—|]\s+|\s+by\s+/i);
    if (separatorMatch && separatorMatch.index !== undefined) {
      const part1 = cleaned.substring(0, separatorMatch.index).trim();
      const part2 = cleaned
        .substring(separatorMatch.index + separatorMatch[0].length)
        .trim();

      // Guard: if part1 is just a number, it was actually a number prefix, not title
      if (/^\d+$/.test(part1)) {
        title = part2;
      } else if (part1 && part2) {
        // Standard "Song - Artist"
        title = part1;
        artist = part2;
      }
    }

    // Clean any surrounding quotes around title or artist
    title = title.replace(/^["']|["']$/g, '').trim();
    if (artist) {
      artist = artist.replace(/^["']|["']$/g, '').trim();
    }

    const normalizedKey = `${normalizeString(title)}::${artist ? normalizeString(artist) : ''}`;

    parsedItems.push({
      id: `song_${lineNumber}_${Math.random().toString(36).substring(2, 9)}`,
      lineNumber,
      raw: trimmed,
      title,
      artist,
      movieContext,
      normalizedKey,
    });
  }

  // 4. Detect duplicates across all entries
  const counts = new Map<string, number>();
  for (const item of parsedItems) {
    counts.set(item.normalizedKey, (counts.get(item.normalizedKey) || 0) + 1);
  }

  return parsedItems.map((item) => {
    const isDuplicate = (counts.get(item.normalizedKey) || 0) > 1;
    return {
      id: item.id,
      lineNumber: item.lineNumber,
      raw: item.raw,
      title: item.title,
      artist: item.artist,
      movieContext: item.movieContext,
      isDuplicate,
      duplicateGroup: isDuplicate ? item.normalizedKey : undefined,
    };
  });
}

/**
 * Deduplicates parsed songs while strictly preserving the first occurrence and original relative order.
 */
export function removeDuplicatesPreservingOrder(songs: ParsedSong[]): ParsedSong[] {
  const seenKeys = new Set<string>();
  const result: ParsedSong[] = [];

  for (const song of songs) {
    const key = `${normalizeString(song.title)}::${song.artist ? normalizeString(song.artist) : ''}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push({
        ...song,
        isDuplicate: false,
        duplicateGroup: undefined,
      });
    }
  }

  return result;
}

/**
 * Exactly 50 Bollywood tracks as specified in requirements for the default playlist.
 * - 'Chammak Challo' is strictly included at #29.
 * - Strictly excludes 'Zaalima'.
 */
export const DEFAULT_TEST_TRACKS: string[] = [
  'Tu Meri',
  'Tune Maari Entriyaan',
  'Badtameez Dil',
  'Dhan Te Nan',
  'Vele',
  'Mauja Hi Mauja',
  'Make Some Noise For The Desi Boyz',
  'Dance Basanti',
  'Baby Ko Bass Pasand Hai',
  'Bang Bang',
  'The Jawaani Song',
  'Ghagra',
  'Gulabi',
  'Masakali',
  'Sau Tarah Ke',
  'Slowly Slowly',
  'Offo',
  'I Hate Luv Storys',
  'Matargashti',
  'Shubhaarambh',
  'Kukkad',
  'Shaam Shaandaar',
  'Jashn-e-Bahaaraa',
  'Ye Ishq Hai',
  'Dil Diyan Gallan',
  'Apna Bana Le',
  'Laal Ishq',
  'Mangalayam',
  'Chammak Challo',
  'Gallan Goodiyaan',
  'Kar Gayi Chull',
  'Abhi Toh Party Shuru Hui Hai',
  'Saturday Saturday',
  'High Heels Te Nachche',
  'Aankh Marey',
  'Morni Banke',
  'Proper Patola',
  'What Jhumka?',
  'Thumkeshwari',
  'Nacho Nacho',
  'Jai Jai Shivshankar',
  'Ghungroo',
  'Nashe Si Chadh Gayi',
  'Ude Dil Befikre',
  'Let\'s Nacho',
  'Kala Chashma',
  'Chikni Chameli',
  'Kamli',
  'Dilliwaali Girlfriend',
  'Tu Meri'
];

