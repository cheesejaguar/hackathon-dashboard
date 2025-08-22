import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: GitHubUser | null;
  token: string | null;
  isLoading: boolean;
}

export function useGitHubAuth() {
  const [token, setToken, deleteToken] = useKV<string | null>('github-token', null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated and fetch user data
  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user]);

  const fetchUser = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      // If token is invalid, clear it
      if (err instanceof Error && err.message.includes('401')) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithToken = async (accessToken: string) => {
    setToken(accessToken);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      setToken(null);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    deleteToken();
    setUser(null);
    setError(null);
  };

  const authState: AuthState = {
    isAuthenticated: !!token && !!user,
    user,
    token,
    isLoading,
  };

  return {
    ...authState,
    loginWithToken,
    logout,
    error,
    fetchUser,
  };
}