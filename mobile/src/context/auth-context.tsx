import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  fetchMe,
  loadUserData,
  loginWithPassword,
  logout as apiLogout,
  syncScore,
  verifyOtp,
  type ScoreState,
  type UserData,
} from '@/lib/api';
import { ApiError, wakeBackend } from '@/lib/api-client';
import { clearTokens, readAccessToken, writeAccessToken, writeRefreshToken } from '@/lib/auth';
import { BAG_DEFAULT_ITEMS, type BagItem } from '@/lib/content';
import type { FamilyGroup, FamilyMember, Onboarding, Task } from '@/lib/score-engine';
import type { SosContact } from '@/lib/mappers';

const DEFAULT_ONBOARDING: Onboarding = {
  step: 1,
  region: '',
  familySize: '1',
  hasChildren: 'no',
  hasElderly: 'no',
  completed: false,
};

const EMPTY_DATA: UserData = {
  onboarding: DEFAULT_ONBOARDING,
  bagItems: BAG_DEFAULT_ITEMS.map((item) => ({ ...item, checked: false })),
  score: { total_score: 0, breakdown: null, updated_at: null },
  familyMembers: [],
  familyGroup: null,
  sosContacts: [],
  tasks: [],
};

type AuthContextValue = {
  isReady: boolean;
  isWaking: boolean;
  isAuthenticated: boolean;
  username: string;
  data: UserData;
  loginPassword: (username: string, password: string) => Promise<void>;
  loginOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
  recomputeScore: () => Promise<void>;
  patchData: (patch: Partial<UserData>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [data, setData] = useState<UserData>(EMPTY_DATA);

  const patchData = useCallback((patch: Partial<UserData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const reload = useCallback(async () => {
    const next = await loadUserData();
    setData(next);
  }, []);

  const recomputeScore = useCallback(async () => {
    setData((prev) => {
      void syncScore({
        onboarding: prev.onboarding,
        bagItems: prev.bagItems,
        tasks: prev.tasks,
        familyMembers: prev.familyMembers,
        familyGroup: prev.familyGroup,
      })
        .then((score: ScoreState) => setData((cur) => ({ ...cur, score })))
        .catch(() => undefined);
      return prev;
    });
  }, []);

  const finishLogin = useCallback(
    async (resp: { access_token: string; refresh_token: string; user: { username: string } }) => {
      await writeAccessToken(resp.access_token);
      await writeRefreshToken(resp.refresh_token);
      setIsAuthenticated(true);
      setUsername(resp.user.username);
      try {
        await reload();
      } catch {
        // logged in, but initial sync failed; screens can retry
      }
    },
    [reload],
  );

  const loginPassword = useCallback(
    async (user: string, password: string) => {
      const resp = await loginWithPassword(user, password);
      await finishLogin(resp);
    },
    [finishLogin],
  );

  const loginOtp = useCallback(
    async (phone: string, code: string) => {
      const resp = await verifyOtp(phone, code);
      await finishLogin(resp);
    },
    [finishLogin],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    await clearTokens();
    setIsAuthenticated(false);
    setUsername('');
    setData(EMPTY_DATA);
  }, []);

  useEffect(() => {
    (async () => {
      // Wake the backend first (Render free tier sleeps); otherwise the
      // initial requests hang or fail and the user gets logged out.
      const awake = await wakeBackend(() => setIsWaking(true));
      setIsWaking(false);
      const token = await readAccessToken();
      if (awake && token) {
        try {
          const me = await fetchMe();
          setIsAuthenticated(true);
          setUsername(me.username);
          await reload();
        } catch (error) {
          // Only drop the session on real auth errors, never on network issues.
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            await clearTokens();
          }
        }
      }
      setIsReady(true);
    })();
  }, [reload]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      isWaking,
      isAuthenticated,
      username,
      data,
      loginPassword,
      loginOtp,
      logout,
      reload,
      recomputeScore,
      patchData,
    }),
    [
      isReady,
      isWaking,
      isAuthenticated,
      username,
      data,
      loginPassword,
      loginOtp,
      logout,
      reload,
      recomputeScore,
      patchData,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export type {
  BagItem,
  FamilyGroup,
  FamilyMember,
  Onboarding,
  SosContact,
  Task,
};
