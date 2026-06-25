'use client';

import { useState } from 'react';
import { api } from '../../../lib/api';

export default function AdminPage() {
  const [guildId, setGuildId] = useState('999999999999999999');
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const grant = async () => {
    try {
      await api.post('/v1/admin/economy/grant', { guildId, userId, amount, reason });
      setStatus('Grant request sent');
    } catch (err) {
      setStatus('Grant failed');
    }
  };

  const deduct = async () => {
    try {
      await api.post('/v1/admin/economy/deduct', { guildId, userId, amount, reason });
      setStatus('Deduct request sent');
    } catch (err) {
      setStatus('Deduct failed');
    }
  };

  const freeze = async () => {
    try {
      await api.post('/v1/admin/economy/freeze', { guildId, userId, reason });
      setStatus('Freeze request sent');
    } catch (err) {
      setStatus('Freeze failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Admin Panel</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-panel p-5">
          <label className="block text-sm text-gray-400">Guild ID</label>
          <input
            value={guildId}
            onChange={(e) => setGuildId(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-dark px-3 py-2 text-sm text-white focus:border-neonBlue focus:outline-none"
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-panel p-5">
          <label className="block text-sm text-gray-400">User ID</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
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
      </div>

      <div className="rounded-xl border border-white/10 bg-panel p-5">
        <label className="block text-sm text-gray-400">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 w-full rounded-md border border-white/10 bg-dark px-3 py-2 text-sm text-white focus:border-neonBlue focus:outline-none"
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={grant}
          className="rounded-lg bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-500/20"
        >
          Grant
        </button>
        <button
          onClick={deduct}
          className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
        >
          Deduct
        </button>
        <button
          onClick={freeze}
          className="rounded-lg bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-400 hover:bg-yellow-500/20"
        >
          Freeze
        </button>
      </div>

      {status && (
        <div className="rounded-md border border-white/10 bg-panel px-4 py-2 text-sm text-gray-300">
          {status}
        </div>
      )}
    </div>
  );
}
