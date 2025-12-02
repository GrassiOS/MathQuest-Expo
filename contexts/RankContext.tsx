import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { getAllRanks, getUserRankInfo, RankRow, UserRankInfo } from '@/services/SupabaseService';

type RankContextValue = {
  userRankInfo: UserRankInfo | null;
  ranks: RankRow[];
  loadingUserRank: boolean;
  loadingRanks: boolean;
  refreshUserRank: (force?: boolean) => Promise<void>;
  refreshRanks: (force?: boolean) => Promise<void>;
};

const RankContext = createContext<RankContextValue | undefined>(undefined);

const RANKS_CACHE_KEY = '@mq_ranks_all';
const USER_RANK_CACHE_KEY_PREFIX = '@mq_rank_user_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CachedPayload<T> = {
  value: T;
  updatedAt: number;
};

export function RankProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [userRankInfo, setUserRankInfo] = useState<UserRankInfo | null>(null);
  const [ranks, setRanks] = useState<RankRow[]>([]);
  const [loadingUserRank, setLoadingUserRank] = useState<boolean>(false);
  const [loadingRanks, setLoadingRanks] = useState<boolean>(false);

  const lastUserRankFetchRef = useRef<number>(0);
  const lastRanksFetchRef = useRef<number>(0);

  const userCacheKey = useMemo(() => (userId ? `${USER_RANK_CACHE_KEY_PREFIX}${userId}` : null), [userId]);

  const isFresh = (ts: number) => Date.now() - ts < CACHE_TTL_MS;

  const readCache = async <T,>(key: string): Promise<CachedPayload<T> | null> => {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CachedPayload<T>;
      return parsed;
    } catch {
      return null;
    }
  };

  const writeCache = async <T,>(key: string, value: T) => {
    try {
      const payload: CachedPayload<T> = { value, updatedAt: Date.now() };
      await AsyncStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // ignore cache write errors
    }
  };

  const refreshRanks = useCallback(async (force?: boolean) => {
    if (loadingRanks) return;
    setLoadingRanks(true);
    try {
      const cache = await readCache<RankRow[]>(RANKS_CACHE_KEY);
      if (!force && cache?.value && isFresh(cache.updatedAt)) {
        setRanks(cache.value);
        setLoadingRanks(false);
        return;
      }
      if (!force && !cache?.value && Date.now() - lastRanksFetchRef.current < 3000) {
        setLoadingRanks(false);
        return;
      }
      lastRanksFetchRef.current = Date.now();
      const remote = await getAllRanks();
      if (remote && Array.isArray(remote) && remote.length >= 0) {
        setRanks(remote);
        await writeCache(RANKS_CACHE_KEY, remote);
      }
    } finally {
      setLoadingRanks(false);
    }
  }, [loadingRanks]);

  const refreshUserRank = useCallback(async (force?: boolean) => {
    if (!userId) {
      setUserRankInfo(null);
      return;
    }
    if (loadingUserRank) return;
    setLoadingUserRank(true);
    try {
      if (userCacheKey) {
        const cache = await readCache<UserRankInfo>(userCacheKey);
        if (!force && cache?.value && isFresh(cache.updatedAt)) {
          setUserRankInfo(cache.value);
          setLoadingUserRank(false);
          return;
        }
      }
      if (!force && Date.now() - lastUserRankFetchRef.current < 3000) {
        setLoadingUserRank(false);
        return;
      }
      lastUserRankFetchRef.current = Date.now();
      const remote = await getUserRankInfo(userId);
      if (remote) {
        setUserRankInfo(remote);
        if (userCacheKey) await writeCache(userCacheKey, remote);
      }
    } finally {
      setLoadingUserRank(false);
    }
  }, [userId, userCacheKey, loadingUserRank]);

  // Load caches immediately on mount/user change
  useEffect(() => {
    let mounted = true;
    (async () => {
      // Prime ranks from cache
      const r = await readCache<RankRow[]>(RANKS_CACHE_KEY);
      if (mounted && r?.value) setRanks(r.value);
      // Prime user rank from cache
      if (userCacheKey) {
        const u = await readCache<UserRankInfo>(userCacheKey);
        if (mounted && u?.value) setUserRankInfo(u.value);
      } else {
        setUserRankInfo(null);
      }
      // Trigger background refresh (not blocking UI)
      refreshRanks(false);
      refreshUserRank(false);
    })();
    return () => { mounted = false; };
  }, [userCacheKey, refreshRanks, refreshUserRank]);

  const value: RankContextValue = {
    userRankInfo,
    ranks,
    loadingUserRank,
    loadingRanks,
    refreshUserRank,
    refreshRanks,
  };

  return (
    <RankContext.Provider value={value}>
      {children}
    </RankContext.Provider>
  );
}

export function useRank(): RankContextValue {
  const ctx = useContext(RankContext);
  if (!ctx) {
    throw new Error('useRank must be used within a RankProvider');
  }
  return ctx;
}


