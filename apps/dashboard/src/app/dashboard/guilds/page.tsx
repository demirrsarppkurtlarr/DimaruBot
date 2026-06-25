'use client';

import { useState } from 'react';

export default function GuildsPage() {
  const [selected, setSelected] = useState<string>('');

  // TODO: fetch guilds from /api/v1/auth/guilds when endpoint ready
  const guilds = [
    { id: '999999999999999999', name: 'DimaruBot Test Server' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Select Guild</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {guilds.map((guild) => (
          <button
            key={guild.id}
            onClick={() => setSelected(guild.id)}
            className={`rounded-xl border p-5 text-left transition ${
              selected === guild.id
                ? 'border-neonBlue bg-neonBlue/10'
                : 'border-white/10 bg-panel hover:border-white/20'
            }`}
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-neonBlue to-neonPurple" />
            <h3 className="mt-3 font-semibold text-white">{guild.name}</h3>
            <p className="text-xs text-gray-500">{guild.id}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="rounded-xl border border-white/10 bg-panel p-4 text-sm text-gray-300">
          Selected guild: <span className="text-white">{selected}</span>
        </div>
      )}
    </div>
  );
}
