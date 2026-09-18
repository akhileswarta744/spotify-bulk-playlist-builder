import { describe, it, expect } from 'vitest';
import {
  parseSongList,
  removeDuplicatesPreservingOrder,
  DEFAULT_TEST_TRACKS,
} from '../src/services/normalizerService';
import { normalizeString } from '../src/utils/stringSimilarity';

describe('Song Parser & Normalizer Tests', () => {
  it('handles empty input gracefully', () => {
    expect(parseSongList('')).toEqual([]);
    expect(parseSongList('   \n\n   \r\n  ')).toEqual([]);
  });

  it('parses a single song correctly', () => {
    const input = 'Tu Meri';
    const result = parseSongList(input);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Tu Meri');
    expect(result[0].artist).toBeUndefined();
    expect(result[0].lineNumber).toBe(1);
    expect(result[0].isDuplicate).toBe(false);
  });

  it('parses numbered lists (e.g. 1. Song, 2) Song, 03. Song)', () => {
    const input = `
1. Tu Meri
2) Badtameez Dil
03. Dhan Te Nan
4 - Vele
    `;
    const result = parseSongList(input);
    expect(result).toHaveLength(4);
    expect(result[0].title).toBe('Tu Meri');
    expect(result[1].title).toBe('Badtameez Dil');
    expect(result[2].title).toBe('Dhan Te Nan');
    expect(result[3].title).toBe('Vele');
  });

  it('parses bullet lists (•, -, *, ▪)', () => {
    const input = `
• Tu Meri
- Badtameez Dil
* Dhan Te Nan
▪ Vele
    `;
    const result = parseSongList(input);
    expect(result).toHaveLength(4);
    expect(result[0].title).toBe('Tu Meri');
    expect(result[1].title).toBe('Badtameez Dil');
    expect(result[2].title).toBe('Dhan Te Nan');
    expect(result[3].title).toBe('Vele');
  });

  it('parses Song - Artist format correctly', () => {
    const input = `
Tu Meri - Vishal Dadlani
Badtameez Dil - Benny Dayal
Dhan Te Nan | Sukhwinder Singh
Vele by Shekhar Ravjiani
    `;
    const result = parseSongList(input);
    expect(result).toHaveLength(4);
    expect(result[0].title).toBe('Tu Meri');
    expect(result[0].artist).toBe('Vishal Dadlani');
    expect(result[1].title).toBe('Badtameez Dil');
    expect(result[1].artist).toBe('Benny Dayal');
    expect(result[2].title).toBe('Dhan Te Nan');
    expect(result[2].artist).toBe('Sukhwinder Singh');
    expect(result[3].title).toBe('Vele');
    expect(result[3].artist).toBe('Shekhar Ravjiani');
  });

  it('extracts movie context from phrases like "Tu Meri from Bang Bang"', () => {
    const input = 'that Tu Meri song from Bang Bang';
    const result = parseSongList(input);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Tu Meri');
    expect(result[0].movieContext).toBe('Bang Bang');
  });

  it('normalizes whitespace and removes extra formatting without altering names', () => {
    const input = '   "Tu Meri"    \n\n\t  Badtameez Dil  \t  ';
    const result = parseSongList(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Tu Meri');
    expect(result[1].title).toBe('Badtameez Dil');
  });

  it('detects duplicates accurately across entries', () => {
    const input = `
Tu Meri
Tu Meri
Badtameez Dil
    `;
    const result = parseSongList(input);
    expect(result).toHaveLength(3);
    expect(result[0].isDuplicate).toBe(true);
    expect(result[1].isDuplicate).toBe(true);
    expect(result[2].isDuplicate).toBe(false);
  });

  it('deduplicates preserving first occurrence and original relative order', () => {
    const input = `
Tu Meri
Badtameez Dil
Tu Meri
Dhan Te Nan
    `;
    const parsed = parseSongList(input);
    const deduplicated = removeDuplicatesPreservingOrder(parsed);
    expect(deduplicated).toHaveLength(3);
    expect(deduplicated[0].title).toBe('Tu Meri');
    expect(deduplicated[1].title).toBe('Badtameez Dil');
    expect(deduplicated[2].title).toBe('Dhan Te Nan');
  });

  it('parses the default 50-song playlist with exact requirements', () => {
    expect(DEFAULT_TEST_TRACKS).toHaveLength(50);
    expect(DEFAULT_TEST_TRACKS[28]).toBe('Chammak Challo'); // #29 in 1-based indexing
    expect(DEFAULT_TEST_TRACKS).toContain('Chammak Challo');
    expect(DEFAULT_TEST_TRACKS).not.toContain('Zaalima');

    const parsed = parseSongList(DEFAULT_TEST_TRACKS.join('\n'));
    expect(parsed).toHaveLength(50);
    // Tu Meri appears at index 0 (#1) and index 49 (#50)
    expect(parsed[0].title).toBe('Tu Meri');
    expect(parsed[49].title).toBe('Tu Meri');
    expect(parsed[0].isDuplicate).toBe(true);
    expect(parsed[49].isDuplicate).toBe(true);
  });
});
