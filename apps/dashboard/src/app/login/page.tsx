'use client';

import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neonBlue border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark text-white">
        <p>You are already logged in.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-dark p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white">DimaruBot</h1>
          <p className="mt-2 text-gray-400">Dashboard</p>
        </div>

        <button
          onClick={login}
          className="w-full rounded-lg bg-gradient-to-r from-neonBlue to-neonPurple py-3 font-semibold text-dark hover:opacity-90"
        >
          Login with Discord
        </button>
      </div>
    </div>
  );
}
