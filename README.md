# Spotify Bulk Playlist Builder ("Hukha Mar")

> **"Paste your songs. Find them on Spotify. Build your playlist."**

Spotify Bulk Playlist Builder (Codename: **Hukha Mar**) is a full-stack web application that connects directly to your own Spotify account and enables pasting or importing large, unstructured song lists (50+ tracks), automatically searching the official Spotify catalogue, intelligently ranking candidate matches, letting you review ambiguous versions, and adding them into a new or existing Spotify playlist while **strictly preserving your exact original list order**.

---

## 1. Project Overview

Finding and adding songs one by one to a playlist is tedious and time-consuming. Users often have lists of songs in various formats: numbered lists from notes, bullet lists from group chats, or `Song - Artist` lines from DJ sets.

**Spotify Bulk Playlist Builder** automates this entire pipeline:
1. Connects securely to your personal Spotify account via official OAuth 2.0 PKCE.
2. Accepts bulk raw text, numbered lists, bullet lists, or uploaded `.txt` / `.csv` files.
3. Cleans numbering, bullet characters, quotes, and whitespace without altering song names.
4. Detects duplicates and asks you whether to keep both or deduplicate.
5. Concurrently queries the official Spotify Web API with rate-limit backoff (429 handling).
6. Uses an advanced matching engine to rank results by title, artist, album/movie context, and catalogue popularity as a secondary tie-breaker.
7. Flags ambiguous results for human review and allows 1-click manual search for missing tracks.
8. Creates a new playlist (public or private) or selects from your existing playlists.
9. Adds the songs in chunks of up to 100 while **guaranteeing 100% strict preservation of the original list sequence**.

---

## 2. Features

- **Official Spotify OAuth 2.0 with PKCE**:
  - Secure Authorization Code with PKCE (`S256` code challenge).
  - No passwords stored, no access tokens committed, no fake logins.
  - Automatically loads profile display name, avatar, and tracks connection status.
- **Robust Song Input Parsing**:
  - Handles one song per line, numbered lists (`1.`, `2)`, `03.`, `4 -`), and bullet lists (`•`, `-`, `*`, `▪`, `–`).
  - Supports `Song - Artist` and `Song by Artist` separation.
  - Extracts soundtrack/movie context (e.g. `"that Tu Meri song from Bang Bang"` &rarr; Title: `"Tu Meri"`, Movie: `"Bang Bang"`).
  - Live track counter badge (`Songs detected: 50`).
- **Duplicate Detection**:
  - Flags duplicate titles across entries.
  - Provides `[ KEEP BOTH ]` and `[ REMOVE DUPLICATE ]` options.
  - Never automatically removes duplicates without explicit user consent.
- **Default 50-Song Playlist**:
  - One-click load for testing with the 50 Bollywood party hits.
  - **"Chammak Challo" is strictly included at #29**.
  - **"Zaalima" is strictly excluded and will never appear automatically**.
- **Real Spotify Catalogue Search & Matching Engine**:
  - Official Spotify Search Web API (`/v1/search?type=track&limit=5`).
  - Composite scoring: Exact Match (100%), Normalized Match (90-95%), Artist Similarity (30%), Album/Soundtrack Context (10%), Popularity tie-breaker (max 5%).
  - Categorizes tracks into `✓ MATCHED`, `⚠ NEEDS REVIEW`, and `✕ NOT FOUND`.
  - Concurrency throttled to 4 parallel workers with Spotify `Retry-After` backoff.
- **Match Review & Multiple Candidate Selection**:
  - Displays high-resolution album artwork, track name, artists, album, release year, explicit badge, and Spotify URI.
  - 30-second audio preview playback.
  - `[ Change Match ]` modal with candidate radio buttons to pick the exact version desired.
  - `[ Search Manually ]` modal with live query lookup for unmatched tracks.
  - Filter tabs: All, Matched, Needs Review, Not Found.
  - Bulk actions: `Select All Confident Matches`, `Review Ambiguous`, `Review Unmatched`, `Clear All`.
- **Playlist Management & Creation**:
  - Create New Playlist: Custom Name, Description, and Public / Private toggle.
  - Add to Existing Playlist: Paginated search & selection of your user playlists.
- **Strict Order Preservation Guarantee**:
  - Tracks are inserted sequentially matching original input order (1 to N).
  - Absolutely no alphabetical reordering, no sorting by popularity, and no shuffling.
- **Live Progress & Visual Feedback**:
  - Search progress bar with percentage and cancel option.
  - Track-by-track addition progress indicator.
- **Exporting**:
  - Export final matched list to CSV (`Original Input`, `Spotify Track`, `Artist`, `Album`, `Spotify URI`, `Match Status`, `YouTube Video URL`) or TXT.
- **YouTube Video Finder (Feature #35)**:
  - Official YouTube Data API v3 integration to find matching videos for every Spotify song.
  - Search query constructed from track metadata: `"Title Artist Album"` (e.g. `"Tu Meri Vishal Dadlani Bang Bang"`).
  - Intelligent Ranking Engine:
    - **Priority 1**: Official Music Videos (+50 pts)
    - **Priority 2**: Official Audio & Topic Channels (+40 pts)
    - **Priority 3**: Verified Label Uploads (+30 pts; T-Series, Sony Music India, Zee Music Company, YRF, Tips, etc.)
    - **Avoids**: Covers (-80 pts), reactions (-80 pts), karaoke (-50 pts), fan edits (-60 pts), shorts (-60 pts).
  - View-Only Guarantee: Opens `https://www.youtube.com/watch?v=VIDEO_ID` in a new tab; no scraping or downloading.
  - Status Badges: `✓ Video Found`, `⚠ Multiple Videos`, `✕ Video Not Found`.
  - `[Change Video]` candidate selector modal and custom YouTube link paste with live preview.
  - In-memory session cache to conserve API quota.
  - Graceful degradation: Spotify playlist creation is never blocked if YouTube search is unavailable.
- **Optional AI-Assisted Normalization**:
  - Optional Gemini 3.8 Flash integration (`@google/genai`) for cleaning messy natural language text when `GEMINI_API_KEY` is provided.

---

## 3. Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │             React + Vite Frontend            │
                               │        (Tailwind CSS, Dark Spotify UI)       │
                               └──────────────────────┬───────────────────────┘
                                                      │
                       OAuth 2.0 PKCE                 │ REST API (JSON)
                   (accounts.spotify.com)             │ http://127.0.0.1:3001
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │           Node.js + Express Backend          │
                               │               (TypeScript)                   │
                               ├──────────────────────┬───────────────────────┤
                               │  /api/auth           │  PKCE token exchange  │
                               │  /api/parser         │  Deterministic / AI   │
                               │  /api/spotify        │  Search & Playlists   │
                               └──────────┬───────────────────────┬───────────┘
                                          │                       │
               Official Spotify Web API   ▼                       ▼  Optional Gemini API
         (api.spotify.com / accounts.spotify.com)       (generativelanguage.googleapis.com)
```

---

## 4. Technology Stack

- **Frontend**:
  - React 18
  - TypeScript
  - Vite 6
  - Tailwind CSS 3
  - Lucide React (Icons)
  - Axios
- **Backend**:
  - Node.js (v20+ / v24)
  - Express 4
  - TypeScript
  - Axios (Spotify HTTP client)
  - Vitest 3 (Unit & Integration Testing)
  - Optional: `@google/genai` (Gemini 3.8 Flash SDK)
- **APIs**:
  - Official Spotify Web API & Spotify Accounts OAuth 2.0

---

## 5. Installation

Clone or open the project folder:

```bash
cd C:\Users\akhil\.gemini\antigravity\scratch\spotify-bulk-playlist-builder
```

Install all dependencies for root, backend server, and frontend client:

```bash
npm run install:all
```

Or install individually:

```bash
npm install
npm --prefix server install
npm --prefix client install
```

---

## 6. Spotify Developer Setup

To connect to your real Spotify account:

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Log in with your personal Spotify account.
3. Click the **"Create an app"** button.

---

## 7. How to Create the Spotify Application

Fill in the application details:
- **App name**: `Spotify Bulk Playlist Builder` (or any name you prefer)
- **App description**: `Bulk playlist creation and track matching tool`
- **Redirect URI**: See Section 8 below.
- **Which API/SDKs are you planning to use?**: Select **Web API**.
- Check the Developer Terms of Service checkbox and click **Save**.

---

## 8. How to Configure the Redirect URI

> [!IMPORTANT]
> Modern Spotify Developer policy strictly validates loopback addresses.
> You must register loopback `127.0.0.1` rather than arbitrary domain names for local development.

In your Spotify App settings, under **Redirect URIs**, add:
```
http://127.0.0.1:5173/callback
```
*(Also add `http://localhost:5173/callback` if you plan to access via localhost).*

Click **Add** and then scroll to the bottom and click **Save**.

---

## 9. How to Obtain the Client ID

1. In your Spotify app dashboard, click **Settings**.
2. Under the **Basic Information** tab, locate **Client ID**.
3. Copy the 32-character Client ID.

---

## 10. Environment Variable Configuration

Create a `.env` file in the root of the project by copying `.env.example`:

```bash
copy .env.example .env
```

Edit `.env` with your actual settings:

```env
# Spotify Developer Credentials
SPOTIFY_CLIENT_ID=your_actual_spotify_client_id_here

# Spotify Redirect URI (must match Spotify Developer Dashboard exactly)
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback

# (Optional) Client Secret
SPOTIFY_CLIENT_SECRET=

# Server Configuration
PORT=3001
CLIENT_URL=http://127.0.0.1:5173

# (Optional) Gemini API Key for smart/AI song title & context normalizer
GEMINI_API_KEY=
```

---

## 11. Running the Frontend

To run the frontend client independently:

```bash
npm --prefix client run dev
```

The frontend will be available at: **`http://127.0.0.1:5173`**

---

## 12. Running the Backend

To run the backend server independently in watch/dev mode:

```bash
npm --prefix server run dev
```

Or run the compiled production server:

```bash
npm --prefix server run build
npm --prefix server start
```

The server listens on **`http://127.0.0.1:3001`**.

### Running Both Frontend & Backend Concurrently:

```bash
npm run dev
```

---

## 13. Testing

Run the Vitest test suite covering parser rules, string similarity, duplicate detection, matching scores, and ordering preservation:

```bash
npm --prefix server test
```

### Verified Test Cases:
- Empty input handling
- Single song parsing
- Numbered lists (`1. Tu Meri`, `2) Badtameez Dil`, `03. Dhan Te Nan`, `4 - Vele`)
- Bullet lists (`•`, `-`, `*`, `▪`)
- `Song - Artist` and `Song by Artist` formats
- Whitespace and quote normalization
- Duplicate detection & deduplication preserving first occurrence
- Default 50-song playlist validation (**50 tracks, includes "Chammak Challo", excludes "Zaalima"**)
- Exact title match scoring (100%)
- Title normalization (case, punctuation, soundtrack tags)
- Artist weighting and mismatch penalty
- Popularity tie-breaking without overriding relevance
- Ambiguous match detection (`needs_review`)
- Unmatched track handling (`not_found`)
- **Ordering preservation**: Verifies input `Tu Meri -> Badtameez Dil -> Dhan Te Nan` strictly produces 1. Tu Meri, 2. Badtameez Dil, 3. Dhan Te Nan with identical Spotify URIs.

---

## 14. Production Build

Build both the backend and frontend for production:

```bash
npm run build
```

This generates:
- Backend: `server/dist/`
- Frontend: `client/dist/`

---

## 15. OAuth Troubleshooting

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| **`INVALID_CLIENT: Invalid client`** | `SPOTIFY_CLIENT_ID` in `.env` is incorrect or unset. | Check that `SPOTIFY_CLIENT_ID` in `.env` matches your Spotify Developer App dashboard. |
| **`INVALID_CLIENT: Invalid redirect URI`** | Redirect URI mismatch. | Ensure the URI registered in your Spotify Developer Dashboard exactly matches `http://127.0.0.1:5173/callback`. |
| **State Mismatch Error** | Stored session state expired or browser privacy extension cleared session storage. | Refresh the page and click `[ CONNECT SPOTIFY ]` again. |
| **User not registered in Developer Dashboard** | Spotify Apps in "Development Mode" require whitelisting user accounts. | In your Spotify Dashboard under **User Management**, add the email address of your Spotify account. |

---

## 16. Spotify API Troubleshooting

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| **`429 Too Many Requests`** | Spotify rate limiting exceeded. | The backend automatically reads Spotify's `Retry-After` header and executes exponential backoff. Concurrency is limited to 4 workers. |
| **`401 Unauthorized` / Expired Token** | Spotify access tokens expire after 1 hour (3600s). | The app automatically uses the OAuth refresh token to request a new access token without requiring re-login. |
| **`403 Forbidden` on Playlist Modification** | Insufficient OAuth permissions. | The app requests `playlist-modify-public` and `playlist-modify-private`. Reconnect Spotify to grant all requested permissions. |
| **Song Not Found** | Regional catalogue availability or unusual spelling. | Click `[ Search Manually ]` on the track card to query Spotify directly with alternative keywords. |

---

## 17. How to Test with 5 Songs

1. Open `http://127.0.0.1:5173` in your browser.
2. Click **[ CONNECT SPOTIFY ]** and authenticate.
3. Paste the following 5 songs into the textarea:
   ```
   Tu Meri
   Tune Maari Entriyaan
   Badtameez Dil
   Dhan Te Nan
   Vele
   ```
4. Click **[ FIND SONGS ON SPOTIFY ]**.
5. Review the matched cards with album art, artist, and album names.
6. Click **[ Choose Playlist ]** &rarr; Select **CREATE NEW PLAYLIST** (`"Bollywood 5-Track Test"`).
7. Confirm the final review order &rarr; Click **[ ADD 5 SONGS TO SPOTIFY ]**.
8. Click **[ OPEN IN SPOTIFY ]** to verify the playlist in Spotify!

---

## 18. How to Use the Complete 50-Song Playlist

1. Click **[ Load Default (50 Songs) ]** on the input screen.
2. Notice the live counter displays: `Songs detected: 50`.
3. Notice that duplicate detection alerts you that `Tu Meri` appears at #1 and #50 (as specified in the prompt). You can choose **[ KEEP BOTH ]** or **[ REMOVE DUPLICATE ]**.
4. Verified: Track #29 is `"Chammak Challo"`. `"Zaalima"` is nowhere in the list.
5. Click **[ FIND SONGS ON SPOTIFY ]**.
6. The progress bar will track all 50 searches in real time.
7. Click **[ Choose Playlist ]**, give it a name like `"Bollywood Party 2026"`, and click **[ ADD 50 SONGS TO SPOTIFY ]**.
