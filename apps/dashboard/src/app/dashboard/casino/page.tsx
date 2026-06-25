'use client';

import { useState } from 'react';
import { api } from '../../../lib/api';

export default function CasinoPage() {
  const [guildId, setGuildId] = useState('999999999999999999');
  const [amount, setAmount] = useState('100');
  const [choice, setChoice] = useState('');
  const [game, setGame] = useState('slot');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const play = () => {
    setResult(null);
    setStatus(null);
    api
      .post(`/v1/economy/games/${game}/bet`, { guildId, amount, choice: choice || undefined })
      .then((res) => {
        setResult(res.data);
        setStatus(res.data.won ? `Won ${res.data.payout}` : 'Lost');
      })
      .catch((err) => {
        setStatus(err.response?.data?.message || 'Game failed');
      });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Casino</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-panel p-5">
          <label className="block text-sm text-gray-400">Guild ID</label>
          <input
            value={guildId}
            onChange={(e) => setGuildId(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-dark px-3 py-2 text-sm text-white focus:border-neonBlue focus:outline-none"
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-panel p-5">
          <label className="block text-sm text-gray-400">Amount</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-dark px-3 py-2 text-sm text-white focus:border-neonBlue focus:outline-none"
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-panel p-5">
          <label className="block text-sm text-gray-400">Game</label>
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-dark px-3 py-2 text-sm text-white focus:border-neonBlue focus:outline-none"
          >
            <option value="slot">Slot</option>
            <option value="roulette">Roulette</option>
            <option value="blackjack">Blackjack</option>
          </select>
        </div>
        <div className="rounded-xl border border-white/10 bg-panel p-5">
          <label className="block text-sm text-gray-400">Choice (roulette only)</label>
          <input
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            placeholder="red, black, or 0-36"
            className="mt-1 w-full rounded-md border border-white/10 bg-dark px-3 py-2 text-sm text-white focus:border-neonBlue focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={play}
        className="rounded-lg bg-gradient-to-r from-neonBlue to-neonPurple px-6 py-2 font-semibold text-dark hover:opacity-90"
      >
        Play
      </button>

      {status && (
        <div className="rounded-md border border-white/10 bg-panel px-4 py-2 text-sm text-white">
          {status}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-white/10 bg-panel p-5">
          <h3 className="mb-2 font-semibold text-white">Result</h3>
          <pre className="text-xs text-gray-400">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
