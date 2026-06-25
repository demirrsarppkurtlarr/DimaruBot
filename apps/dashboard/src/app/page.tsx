export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-neonBlue">DimaruBot Dashboard</h1>
      <p className="mt-4 text-gray-400">Welcome to the next-generation Discord bot control panel.</p>
      <div className="mt-8 rounded-lg bg-panel p-6 shadow-lg shadow-neonPurple/20">
        <p>Status: <span className="text-green-400">Online</span></p>
        <p>DimaCoin economy integration is in progress.</p>
      </div>
    </main>
  );
}
