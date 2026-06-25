'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

interface LevelEntry {
  rank: number;
  memberId: string;
  level: number;
  xp: number;
  messages: number;
}

export default function LevelsPage() {
  const { user } = useAuth();
  const [guildId, setGuildId] = useState('999999999999999999');
  const [leaderboard, setLeaderboard] = useState<LevelEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api
      .get('/v1/levels/leaderboard?limit=10')
      .then((res) => setLeaderboard(res.data))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Levels</h1>

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-400">Guild ID</label>
        <input
          value={guildId}
          onChange={(e) => setGuildId(e.target.value)}
          className="rounded-md border border-white/10 bg-dark px-3 py-1.5 text-sm text-white focus:border-neonBlue focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-panel p-5">
          <h3 className="mb-4 font-semibold text-white">Leaderboard</h3>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-gray-500">No level data yet.</p>
          ) : (
            <ul className="space-y-2">
              {leaderboard.map((entry) => (
                <li
                  key={entry.memberId}
                  className="flex items-center justify-between rounded-md bg-white/5 px-4 py-2 text-sm"
                >
                  <span className="text-gray-300">
                    #{entry.rank} <span className="text-white">{entry.memberId}</span>
                  </span>
                  <span className="font-medium text-white">
                    Lvl {entry.level} — {entry.xp} XP
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
