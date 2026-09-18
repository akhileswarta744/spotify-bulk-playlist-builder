import { MatchResult } from '../types';

/**
 * Exports matched results as CSV with exact specified columns:
 * Original Input, Spotify Track, Artist, Album, Spotify URI, Match Status
 */
export function exportToCsv(results: MatchResult[], filename = 'spotify_playlist_matches.csv'): void {
  const headers = ['Original Input', 'Spotify Track', 'Artist', 'Album', 'Spotify URI', 'Match Status', 'YouTube Video URL'];

  const rows = results.map((item) => {
    const originalInput = item.song.raw;
    const spotifyTrack = item.selectedTrack ? item.selectedTrack.name : 'N/A';
    const artist = item.selectedTrack
      ? item.selectedTrack.artists.map((a) => a.name).join(', ')
      : 'N/A';
    const album = item.selectedTrack ? item.selectedTrack.album.name : 'N/A';
    const uri = item.selectedTrack ? item.selectedTrack.uri : 'N/A';
    const status = item.status.toUpperCase();
    const ytUrl = item.youtube?.selectedVideo?.videoUrl || 'N/A';

    return [
      `"${originalInput.replace(/"/g, '""')}"`,
      `"${spotifyTrack.replace(/"/g, '""')}"`,
      `"${artist.replace(/"/g, '""')}"`,
      `"${album.replace(/"/g, '""')}"`,
      `"${uri.replace(/"/g, '""')}"`,
      `"${status}"`,
      `"${ytUrl.replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exports matched results as human-readable TXT list
 */
export function exportToTxt(results: MatchResult[], filename = 'spotify_playlist_matches.txt'): void {
  const lines = results.map((item, idx) => {
    const num = idx + 1;
    const ytUrl = item.youtube?.selectedVideo?.videoUrl ? ` [YouTube: ${item.youtube.selectedVideo.videoUrl}]` : '';
    if (item.selectedTrack) {
      const artists = item.selectedTrack.artists.map((a) => a.name).join(', ');
      return `${num}. ${item.selectedTrack.name} - ${artists} [${item.selectedTrack.uri}] (${item.status.toUpperCase()})${ytUrl}`;
    }
    return `${num}. ${item.song.raw} (NOT FOUND)${ytUrl}`;
  });

  const txtContent = lines.join('\r\n');
  downloadBlob(txtContent, filename, 'text/plain;charset=utf-8;');
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
