import { GoogleGenAI } from '@google/genai';
import { ParsedSong } from '../types';
import { normalizeString } from '../utils/stringSimilarity';

export interface AiNormalizedSong {
  title: string;
  artist?: string;
  movieContext?: string;
}

export class AiService {
  private client: GoogleGenAI | null = null;
  private isAvailable: boolean = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      try {
        this.client = new GoogleGenAI({ apiKey });
        this.isAvailable = true;
      } catch (err) {
        console.warn('[AiService] Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  get available(): boolean {
    return this.isAvailable && this.client !== null;
  }

  /**
   * Use Gemini 3.8 Flash to parse messy natural-language song lines into structured records.
   * Example: "that Tu Meri song from Bang Bang" -> { title: "Tu Meri", movieContext: "Bang Bang" }
   */
  async normalizeSongLines(rawLines: string[]): Promise<ParsedSong[] | null> {
    if (!this.available || !this.client || rawLines.length === 0) {
      return null;
    }

    const prompt = `You are an expert music data normalizer.
Your task is to parse a list of messy song descriptions and return a JSON array.
For each line:
- Extract the clean song title (remove "that song", movie suffixes, formatting, etc.)
- Extract the artist name if mentioned
- Extract the movie or album context if mentioned (e.g. from "Bang Bang")
- Preserve the EXACT same order of items as provided in the input list.

Input songs:
${rawLines.map((line, idx) => `${idx + 1}. ${line}`).join('\n')}

Respond ONLY with valid JSON with no markdown wrapping:
[
  { "title": "Song Title", "artist": "Artist Name or null", "movieContext": "Movie or Album or null" }
]`;

    try {
      const response = await this.client.interactions.create({
        model: 'gemini-3.8-flash',
        input: prompt,
      });

      let responseText = response.output_text?.trim() || '';
      if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsedJson: Array<{ title: string; artist?: string | null; movieContext?: string | null }> =
        JSON.parse(responseText);

      if (!Array.isArray(parsedJson)) {
        return null;
      }

      // Detect duplicates
      const counts = new Map<string, number>();
      const items = parsedJson.map((item, index) => {
        const title = item.title || rawLines[index] || '';
        const artist = item.artist || undefined;
        const movieContext = item.movieContext || undefined;
        const normKey = `${normalizeString(title)}::${artist ? normalizeString(artist) : ''}`;
        counts.set(normKey, (counts.get(normKey) || 0) + 1);

        return {
          id: `song_${index + 1}_${Math.random().toString(36).substring(2, 9)}`,
          lineNumber: index + 1,
          raw: rawLines[index],
          title,
          artist,
          movieContext,
          normKey,
        };
      });

      return items.map((item) => {
        const isDuplicate = (counts.get(item.normKey) || 0) > 1;
        return {
          id: item.id,
          lineNumber: item.lineNumber,
          raw: item.raw,
          title: item.title,
          artist: item.artist,
          movieContext: item.movieContext,
          isDuplicate,
          duplicateGroup: isDuplicate ? item.normKey : undefined,
        };
      });
    } catch (err) {
      console.warn('[AiService] Error running Gemini normalization, falling back to deterministic parser:', err);
      return null;
    }
  }
}

export const aiService = new AiService();
