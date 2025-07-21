import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useSession, signIn, signOut } from 'next-auth/react';
import AdminBadge from './AdminBadge';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const navigation = [
    { name: 'Home', href: '/' },
    ...(session ? [{ name: 'Dashboard', href: '/dashboard' }] : []),
    ...(session?.user?.isAdmin ? [{ name: 'Admin', href: '/admin' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800">
      <Head>
        <title>CMusics - Discord Music Bot</title>
        <meta name="description" content="Experience high-quality music streaming in your Discord server with CMusics. Enjoy seamless playback, queue management, and real-time analytics." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="text-2xl font-bold text-white">
                  🎵 CMusics
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Authentication */}
            <div className="flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="text-white/70 text-sm">Loading...</div>
              ) : session ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {session.user?.image && (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="text-white/90 text-sm">
                        {session.user?.name}
                      </span>
                      <AdminBadge />
                    </div>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn('discord')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login with Discord
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white p-2"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white/5">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-white/90 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-lg border-t border-white/10 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-white/60">
            <p>&copy; 2025 CMusics™ Dashboard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
