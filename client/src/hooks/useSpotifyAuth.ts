import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { SpotifyUserProfile } from '../types';

const STORAGE_KEY_TOKEN = 'hukha_mar_spotify_token';
const STORAGE_KEY_REFRESH = 'hukha_mar_spotify_refresh';
const STORAGE_KEY_EXPIRES = 'hukha_mar_spotify_expires';
const STORAGE_KEY_VERIFIER = 'hukha_mar_code_verifier';
const STORAGE_KEY_STATE = 'hukha_mar_auth_state';

const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ');

/**
 * Helper to generate random string for PKCE
 */
function generateRandomString(length: number = 64): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join('');
}

/**
 * Generate SHA-256 base64url code challenge
 */
async function generateCodeChallenge(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function useSpotifyAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    sessionStorage.getItem(STORAGE_KEY_TOKEN)
  );
  const [profile, setProfile] = useState<SpotifyUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authConfig, setAuthConfig] = useState<{
    clientId: string;
    redirectUri: string;
    isConfigured: boolean;
  } | null>(null);

  // Load auth configuration from server
  useEffect(() => {
    api
      .getAuthConfig()
      .then((cfg) => setAuthConfig(cfg))
      .catch((err) => {
        console.error('Failed to load auth config:', err);
        setError('Failed to reach backend server');
      });
  }, []);

  // Fetch profile whenever we have an active access token
  const loadProfile = useCallback(async (token: string) => {
    try {
      setLoading(true);
      const userProfile = await api.getUserProfile(token);
      setProfile(userProfile);
      setError(null);
    } catch (err: any) {
      console.warn('Failed to load profile, token may be expired:', err);
      // Attempt token refresh if refresh token is available
      const refreshToken = sessionStorage.getItem(STORAGE_KEY_REFRESH);
      if (refreshToken) {
        try {
          const newTokens = await api.refreshTokens(refreshToken);
          setAccessToken(newTokens.access_token);
          sessionStorage.setItem(STORAGE_KEY_TOKEN, newTokens.access_token);
          const userProfile = await api.getUserProfile(newTokens.access_token);
          setProfile(userProfile);
          setError(null);
          return;
        } catch (refreshErr) {
          console.error('Token refresh failed:', refreshErr);
        }
      }
      disconnect();
    } finally {
      setLoading(false);
    }
  }, []);

  // Check URL params on initial mount for OAuth callback
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const authError = searchParams.get('error');

    if (authError) {
      setError(`Spotify Authentication Error: ${authError}`);
      setLoading(false);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      const savedVerifier = sessionStorage.getItem(STORAGE_KEY_VERIFIER);
      const savedState = sessionStorage.getItem(STORAGE_KEY_STATE);

      if (state && savedState && state !== savedState) {
        setError('Security Error: OAuth state mismatch.');
        setLoading(false);
        return;
      }

      if (savedVerifier) {
        const redirectUri =
          authConfig?.redirectUri || `${window.location.origin}/callback`;

        api
          .exchangeCodeForTokens(code, savedVerifier, redirectUri)
          .then((tokens) => {
            setAccessToken(tokens.access_token);
            sessionStorage.setItem(STORAGE_KEY_TOKEN, tokens.access_token);
            if (tokens.refresh_token) {
              sessionStorage.setItem(STORAGE_KEY_REFRESH, tokens.refresh_token);
            }
            // Clear URL code
            window.history.replaceState({}, document.title, window.location.pathname);
            loadProfile(tokens.access_token);
          })
          .catch((err) => {
            console.error('Token exchange error:', err);
            setError(
              err?.response?.data?.message ||
                'Failed to exchange Spotify authorization code for token'
            );
            setLoading(false);
          })
          .finally(() => {
            sessionStorage.removeItem(STORAGE_KEY_VERIFIER);
            sessionStorage.removeItem(STORAGE_KEY_STATE);
          });
        return;
      }
    }

    // If already stored token exists
    if (accessToken) {
      loadProfile(accessToken);
    } else {
      setLoading(false);
    }
  }, [authConfig, loadProfile]);

  /**
   * Initiate Spotify PKCE Login
   */
  const login = async () => {
    if (!authConfig || !authConfig.clientId) {
      setError('Spotify Client ID is not configured. Please check your .env file.');
      return;
    }

    try {
      const verifier = generateRandomString(64);
      const challenge = await generateCodeChallenge(verifier);
      const state = generateRandomString(16);

      sessionStorage.setItem(STORAGE_KEY_VERIFIER, verifier);
      sessionStorage.setItem(STORAGE_KEY_STATE, state);

      const params = new URLSearchParams({
        client_id: authConfig.clientId,
        response_type: 'code',
        redirect_uri: authConfig.redirectUri,
        code_challenge_method: 'S256',
        code_challenge: challenge,
        state,
        scope: SPOTIFY_SCOPES,
        show_dialog: 'true',
      });

      window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    } catch (err: any) {
      console.error('Failed to initiate Spotify login:', err);
      setError('Could not start Spotify authorization');
    }
  };

  /**
   * Disconnect and clear user session
   */
  const disconnect = () => {
    setAccessToken(null);
    setProfile(null);
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_REFRESH);
    sessionStorage.removeItem(STORAGE_KEY_EXPIRES);
    sessionStorage.removeItem(STORAGE_KEY_VERIFIER);
    sessionStorage.removeItem(STORAGE_KEY_STATE);
  };

  return {
    accessToken,
    profile,
    isConnected: Boolean(accessToken && profile),
    loading,
    error,
    authConfig,
    login,
    disconnect,
  };
}
