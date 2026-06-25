'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { DimaCoinAccount, DimaCoinTransaction } from '../../../types';

export default function EconomyPage() {
  const { user } = useAuth();
  const [guildId, setGuildId] = useState('999999999999999999');
  const [account, setAccount] = useState<DimaCoinAccount | null>(null);
  const [transactions, setTransactions] = useState<DimaCoinTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [dailyStatus, setDailyStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    Promise.all([
      api.get(`/v1/economy/guilds/${guildId}/balance`),
      api.get(`/v1/economy/guilds/${guildId}/transactions?limit=10`),
    ])
      .then(([balanceRes, txRes]) => {
        setAccount(balanceRes.data);
        setTransactions(txRes.data.transactions ?? []);
      })
      .finally(() => setLoading(false));
  }, [user, guildId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Economy</h1>

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-400">Guild ID</label>
        <input
          value={guildId}
          onChange={(e) => setGuildId(e.target.value)}
          className="rounded-md border border-white/10 bg-dark px-3 py-1.5 text-sm text-white focus:border-neonBlue focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setDailyStatus(null);
            api
              .post(`/v1/economy/guilds/${guildId}/daily`)
              .then((res) => {
                setDailyStatus(`Claimed ${res.data.total} DimaCoin (streak ${res.data.streak})`);
              })
              .catch((err) => {
                setDailyStatus(err.response?.data?.message || 'Daily claim failed');
              });
          }}
          className="rounded-lg bg-gradient-to-r from-neonBlue to-neonPurple px-4 py-2 text-sm font-semibold text-dark hover:opacity-90"
        >
          Claim Daily
        </button>
        {dailyStatus && <span className="text-sm text-gray-300">{dailyStatus}</span>}
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : account ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-panel p-5">
            <h3 className="text-sm text-gray-400">Wallet</h3>
            <p className="mt-1 text-xl font-bold text-white">🪙 {account.wallet}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-panel p-5">
            <h3 className="text-sm text-gray-400">Bank</h3>
            <p className="mt-1 text-xl font-bold text-white">🪙 {account.bank}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-panel p-5">
            <h3 className="text-sm text-gray-400">Total Earned</h3>
            <p className="mt-1 text-xl font-bold text-neonBlue">🪙 {account.totalEarned}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-panel p-5">
            <h3 className="text-sm text-gray-400">Trust Score</h3>
            <p className="mt-1 text-xl font-bold text-neonPurple">{account.trustScore}</p>
          </div>
        </div>
      ) : (
        <div className="text-gray-400">No account found.</div>
      )}

      <div className="rounded-xl border border-white/10 bg-panel p-5">
        <h3 className="mb-4 font-semibold text-white">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500">No transactions yet.</p>
        ) : (
          <ul className="space-y-2">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between rounded-md bg-white/5 px-4 py-2 text-sm"
              >
                <span className="text-gray-300">{tx.type}</span>
                <span className="font-medium text-white">🪙 {tx.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
