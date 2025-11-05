import AuthService from '@/Core/Services/AuthService/AuthService';

export type MatchRow = {
  id: string;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  rounds_played: number | null;
  player1_points: number | null;
  player2_points: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type UserStats = {
  totalMatches: number;
  wins: number;
  losses: number;
  globalPoints: number;
  recentMatch: MatchRow | null;
};

const supabase = AuthService.getClient();

// Obtiene estadísticas del usuario, incluyendo la partida más reciente
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    // Puntos globales del perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Partidas finalizadas del usuario, ordenadas por fecha
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, winner_id, player1_id, player2_id, status, created_at, updated_at, rounds_played, player1_points, player2_points')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .eq('status', 'finished')
      .order('created_at', { ascending: false });

    if (matchesError) throw matchesError;

    const totalMatches = matches?.length || 0;
    const wins = (matches || []).filter(m => m.winner_id === userId).length;
    const losses = totalMatches - wins;
    const recentMatch: MatchRow | null = matches && matches.length > 0 ? matches[0] as MatchRow : null;

    return {
      totalMatches,
      wins,
      losses,
      globalPoints: profile?.points || 0,
      recentMatch,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
}

// Lista todas las partidas del usuario (por defecto finalizadas) ordenadas por fecha descendente
export async function getUserMatches(
  userId: string,
  options: { status?: string; limit?: number } = {}
): Promise<MatchRow[]> {
  const { status = 'finished', limit = 100 } = options;
  const { data, error } = await supabase
    .from('matches')
    .select('id, winner_id, player1_id, player2_id, status, created_at, updated_at, rounds_played, player1_points, player2_points')
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user matches:', error);
    return [];
  }

  return (data || []) as MatchRow[];
}

export type UserMatchItem = {
  id: string;
  created_at: string | null;
  didWin: boolean;
  opponentId: string | null;
  opponentUsername: string;
  opponentPoints: number;
};

// Devuelve partidas enriquecidas con datos del oponente (username, points)
export async function getUserMatchesDetailed(
  userId: string,
  options: { status?: string; limit?: number } = {}
): Promise<UserMatchItem[]> {
  const { status = 'finished', limit = 100 } = options;

  const { data, error } = await supabase
    .from('matches')
    .select(`
      id, winner_id, player1_id, player2_id, status, created_at,
      player1:profiles!matches_player1_id_fkey(id, username, points),
      player2:profiles!matches_player2_id_fkey(id, username, points)
    `)
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching detailed matches:', error);
    return [];
  }

  const rows = (data || []) as any[];

  return rows.map((m) => {
    const isPlayer1 = m.player1_id === userId;
    const opponent = isPlayer1 ? m.player2 : m.player1;
    const opponentUsername: string = opponent?.username ?? 'Desconocido';
    const opponentPoints: number = opponent?.points ?? 0;
    const opponentId: string | null = opponent?.id ?? null;
    const didWin = m.winner_id === userId;
    return {
      id: m.id as string,
      created_at: m.created_at as string | null,
      didWin,
      opponentId,
      opponentUsername,
      opponentPoints,
    } as UserMatchItem;
  });
}

// -------------------- RANKS --------------------
export type RankRow = {
  id: string;
  name: string;
  min_points: number;
  max_points: number;
  icon_url: string | null;
  color: string | null;
};

export type UserRankInfo = {
  points: number;
  rank: RankRow | null;
  nextRank: RankRow | null;
  progressPercent: number; // 0..1
  pointsToNext: number; // 0 if top rank
};

/**
 * Fetches the user's points, current rank (by rank_id or by points), and next rank.
 * Computes progress from current rank to next rank and remaining points.
 */
export async function getUserRankInfo(userId: string): Promise<UserRankInfo | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points, rank_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const points: number = profile?.points ?? 0;

    // Try to get current rank using rank_id if present
    let currentRank: RankRow | null = null;
    if (profile?.rank_id) {
      const { data: r } = await supabase
        .from('ranks')
        .select('id, name, min_points, max_points, icon_url, color')
        .eq('id', profile.rank_id)
        .maybeSingle();
      currentRank = (r as RankRow) || null;
    }

    // If no rank found, determine by points
    if (!currentRank) {
      const { data: r } = await supabase
        .from('ranks')
        .select('id, name, min_points, max_points, icon_url, color')
        .lte('min_points', points)
        .gte('max_points', points)
        .maybeSingle();
      currentRank = (r as RankRow) || null;
    }

    // Find next rank (first with min_points greater than current points)
    const { data: next } = await supabase
      .from('ranks')
      .select('id, name, min_points, max_points, icon_url, color')
      .gt('min_points', points)
      .order('min_points', { ascending: true })
      .limit(1);

    const nextRank: RankRow | null = next && next.length > 0 ? (next[0] as RankRow) : null;

    // Compute progress
    let progressPercent = 1;
    let pointsToNext = 0;

    if (currentRank && nextRank) {
      const span = Math.max(1, nextRank.min_points - currentRank.min_points);
      progressPercent = Math.min(1, Math.max(0, (points - currentRank.min_points) / span));
      pointsToNext = Math.max(0, nextRank.min_points - points);
    } else if (!currentRank && nextRank) {
      // No current rank (points below first rank min?)
      const firstMin = nextRank.min_points;
      progressPercent = Math.min(1, Math.max(0, points / Math.max(1, firstMin)));
      pointsToNext = Math.max(0, firstMin - points);
    } else {
      // Top rank or no ranks defined
      progressPercent = 1;
      pointsToNext = 0;
    }

    return {
      points,
      rank: currentRank,
      nextRank,
      progressPercent,
      pointsToNext,
    };
  } catch (error) {
    console.error('Error fetching user rank info:', error);
    return null;
  }
}