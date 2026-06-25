import type { Metadata } from 'next';
import { ReactNode } from 'react';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata: Metadata = {
  title: 'DimaruBot Dashboard',
  description: 'Control panel for DimaruBot',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-dark text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
