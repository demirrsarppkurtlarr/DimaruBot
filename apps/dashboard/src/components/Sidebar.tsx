'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/guilds', label: 'Guilds' },
  { href: '/dashboard/economy', label: 'Economy' },
  { href: '/dashboard/casino', label: 'Casino' },
  { href: '/dashboard/levels', label: 'Levels' },
  { href: '/dashboard/admin', label: 'Admin' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-white/10 bg-panel p-4">
      <nav className="space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-gradient-to-r from-neonBlue/20 to-neonPurple/20 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
