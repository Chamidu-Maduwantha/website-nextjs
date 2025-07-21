import Layout from '../components/Layout';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  const features = [
    {
      title: 'Multi-Server Support',
      description: 'Works across multiple Discord servers simultaneously',
      icon: '🖥️',
      color: 'text-blue-400',
    },
    {
      title: 'Advanced Queue',
      description: 'Queue management with playlist support',
      icon: '📝',
      color: 'text-green-400',
    },
    {
      title: 'Real-time Analytics',
      description: 'Track usage and performance metrics',
      icon: '📊',
      color: 'text-purple-400',
    },
    {
      title: '24/7 Uptime',
      description: 'Reliable service with continuous availability',
      icon: '⏰',
      color: 'text-yellow-400',
    },
    {
      title: 'High Quality Audio',
      description: 'Crystal clear music streaming',
      icon: '🔊',
      color: 'text-red-400',
    },
    {
      title: 'Easy Controls',
      description: 'Simple commands for music control',
      icon: '▶️',
      color: 'text-indigo-400',
    },
  ];

  const commands = [
    { command: '!play [song/url]', description: 'Play music from YouTube or playlists' },
    { command: '!skip', description: 'Skip current song' },
    { command: '!pause', description: 'Pause current song' },
    { command: '!resume', description: 'Resume paused song' },
    { command: '!queue', description: 'Show current queue' },
    { command: '!volume [1-100]', description: 'Adjust volume' },
    { command: '!nowplaying', description: 'Show current song info' },
    { command: '!shuffle', description: 'Shuffle the queue' },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            🎵 CMusics
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Experience high-quality music streaming in your Discord server with CMusics.
            Enjoy seamless playback, queue management, and real-time analytics.
          </p>
          <div className="flex justify-center space-x-4">
            {session ? (
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <button
                onClick={() => signIn('discord')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>🎮</span>
                <span>Login with Discord</span>
              </button>
            )}
            <a
              href="#invite"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-medium transition-colors backdrop-blur-lg border border-white/10"
            >
              Invite CMusics
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-105"
            >
              <div className={`text-4xl mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white/70">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Commands Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Available Commands
            </h2>
            <div className="space-y-4">
              {commands.map((cmd, index) => (
                <div key={index} className="border-b border-white/10 pb-4 last:border-b-0">
                  <code className="text-blue-400 font-mono text-lg">
                    {cmd.command}
                  </code>
                  <p className="text-white/70 mt-1">
                    {cmd.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Getting Started
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-white font-medium">Invite CMusics</h3>
                  <p className="text-white/70">
                    Click the invite button to add CMusics to your Discord server
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-white font-medium">Join Voice Channel</h3>
                  <p className="text-white/70">
                    Join a voice channel in your server
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-white font-medium">Start Playing</h3>
                  <p className="text-white/70">
                    Use <code className="text-blue-400">!play</code> to start playing music
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-white font-medium">Manage Dashboard</h3>
                  <p className="text-white/70">
                    Login to view statistics and manage your servers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
