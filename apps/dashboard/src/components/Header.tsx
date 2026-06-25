'use client';

import { useAuth } from '../context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-panel px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-neonBlue to-neonPurple" />
        <span className="text-lg font-bold text-white">DimaruBot</span>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-400">{user.username}</span>
            <button
              onClick={logout}
              className="rounded-md bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/20"
            >
              Logout
            </button>
          </>
        ) : (
          <span className="text-sm text-gray-500">Not logged in</span>
        )}
      </div>
    </header>
  );
}
