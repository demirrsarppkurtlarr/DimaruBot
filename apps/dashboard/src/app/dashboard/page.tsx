'use client';

import { useAuth } from '../../context/AuthContext';

export default function DashboardOverview() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome, {user?.username ?? 'Admin'}</h1>
        <p className="text-gray-400">DimaruBot management dashboard</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-panel p-5">
          <h3 className="text-sm font-medium text-gray-400">Economy</h3>
          <p className="mt-1 text-2xl font-bold text-white">DimaCoin</p>
          <p className="mt-1 text-xs text-gray-500">Balance, transfers, history</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-panel p-5">
          <h3 className="text-sm font-medium text-gray-400">Moderation</h3>
          <p className="mt-1 text-2xl font-bold text-white">Active</p>
          <p className="mt-1 text-xs text-gray-500">Bans, warns, mutes</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-panel p-5">
          <h3 className="text-sm font-medium text-gray-400">System</h3>
          <p className="mt-1 text-2xl font-bold text-white">Online</p>
          <p className="mt-1 text-xs text-gray-500">Health & metrics</p>
        </div>
      </div>
    </div>
  );
}
