import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import AdminBadge from '../components/AdminBadge';
import PM2Control from '../components/PM2Control';

interface AdminStats {
  totalServers: number;
  totalUsers: number;
  totalCommands: number;
  totalSongs: number;
  recentErrors: number;
  performance: {
    avgResponseTime: number;
    errorRate: number;
  };
  sensitiveData: {
    guilds: Array<{
      id: string;
      name: string;
      ownerId: string;
      ownerName: string;
      memberCount: number;
      commandsUsed: number;
      songsPlayed: number;
      lastActive: string;
    }>;
    users: Array<{
      id: string;
      username: string;
      commandsUsed: number;
      songsPlayed: number;
      lastSeen: string;
    }>;
    errors: Array<{
      error: string;
      timestamp: string;
      userId: string;
      guildId: string;
      severity: string;
    }>;
  };
}

interface AdminPageProps {
  initialStats: AdminStats;
}

export default function AdminPage({ initialStats }: AdminPageProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stats');
      const newStats = await response.json();
      setStats(newStats);
    } catch (error) {
      console.error('Error refreshing admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Refresh data every 60 seconds
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!session?.user?.isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-white/70">You don't have permission to view this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Discord Bot</title>
        <meta name="description" content="Admin Dashboard for Discord Bot" />
      </Head>
      
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <AdminBadge />
            </div>
            <button
              onClick={refreshData}
              disabled={loading}
              className="bg-discord-primary hover:bg-discord-primary-dark text-white px-4 py-2 rounded-md disabled:opacity-50 transition-colors duration-200"
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>

          {/* Admin Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-discord-secondary rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Total Servers</h3>
              <p className="text-3xl font-bold text-blue-400">{stats.totalServers}</p>
            </div>
            <div className="bg-discord-secondary rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-green-400">{stats.totalUsers}</p>
            </div>
            <div className="bg-discord-secondary rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Commands Used</h3>
              <p className="text-3xl font-bold text-yellow-400">{stats.totalCommands}</p>
            </div>
            <div className="bg-discord-secondary rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Recent Errors</h3>
              <p className="text-3xl font-bold text-red-400">{stats.recentErrors}</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-discord-secondary rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-white/70">Average Response Time</p>
                <p className="text-2xl font-bold text-white">{stats.performance.avgResponseTime}ms</p>
              </div>
              <div>
                <p className="text-white/70">Error Rate</p>
                <p className="text-2xl font-bold text-white">{stats.performance.errorRate}%</p>
              </div>
            </div>
          </div>

          {/* Tabs for Sensitive Data */}
          <div className="bg-discord-secondary rounded-lg p-6">
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                  activeTab === 'overview' 
                    ? 'bg-discord-primary text-white' 
                    : 'bg-discord-dark text-white/70 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('control')}
                className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                  activeTab === 'control' 
                    ? 'bg-discord-primary text-white' 
                    : 'bg-discord-dark text-white/70 hover:text-white'
                }`}
              >
                Bot Control
              </button>
              <button
                onClick={() => setActiveTab('guilds')}
                className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                  activeTab === 'guilds' 
                    ? 'bg-discord-primary text-white' 
                    : 'bg-discord-dark text-white/70 hover:text-white'
                }`}
              >
                Guilds
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                  activeTab === 'users' 
                    ? 'bg-discord-primary text-white' 
                    : 'bg-discord-dark text-white/70 hover:text-white'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('errors')}
                className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                  activeTab === 'errors' 
                    ? 'bg-discord-primary text-white' 
                    : 'bg-discord-dark text-white/70 hover:text-white'
                }`}
              >
                Errors
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">System Overview</h3>
                <p className="text-white/70">
                  Bot is running smoothly across {stats.totalServers} servers with {stats.totalUsers} users.
                </p>
              </div>
            )}

            {activeTab === 'control' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Bot Control Panel</h3>
                <p className="text-white/70 mb-4">
                  Manage the bot process, view logs, and control bot operations.
                </p>
                <PM2Control />
              </div>
            )}

            {activeTab === 'guilds' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Server Information</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-2">Server Name</th>
                        <th className="text-left py-2">Owner</th>
                        <th className="text-left py-2">Members</th>
                        <th className="text-left py-2">Commands</th>
                        <th className="text-left py-2">Songs</th>
                        <th className="text-left py-2">Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.sensitiveData.guilds.map((guild) => (
                        <tr key={guild.id} className="border-b border-white/10">
                          <td className="py-2">{guild.name}</td>
                          <td className="py-2">{guild.ownerName}</td>
                          <td className="py-2">{guild.memberCount}</td>
                          <td className="py-2">{guild.commandsUsed}</td>
                          <td className="py-2">{guild.songsPlayed}</td>
                          <td className="py-2">{guild.lastActive}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">User Activity</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-2">Username</th>
                        <th className="text-left py-2">Commands Used</th>
                        <th className="text-left py-2">Songs Played</th>
                        <th className="text-left py-2">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.sensitiveData.users.map((user) => (
                        <tr key={user.id} className="border-b border-white/10">
                          <td className="py-2">{user.username}</td>
                          <td className="py-2">{user.commandsUsed}</td>
                          <td className="py-2">{user.songsPlayed}</td>
                          <td className="py-2">{user.lastSeen}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'errors' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Recent Errors</h3>
                <div className="space-y-2">
                  {stats.sensitiveData.errors.map((error, index) => (
                    <div key={index} className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-red-400 font-semibold">{error.severity.toUpperCase()}</span>
                        <span className="text-white/70 text-sm">{error.timestamp}</span>
                      </div>
                      <p className="text-white mt-2">{error.error}</p>
                      <p className="text-white/70 text-sm mt-1">
                        User: {error.userId} | Guild: {error.guildId}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, {});
  
  if (!session?.user?.isAdmin) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
  
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/stats`);
    const initialStats = await response.json();
    
    return {
      props: {
        initialStats,
      },
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return {
      props: {
        initialStats: {
          totalServers: 0,
          totalUsers: 0,
          totalCommands: 0,
          totalSongs: 0,
          recentErrors: 0,
          performance: {
            avgResponseTime: 0,
            errorRate: 0,
          },
          sensitiveData: {
            guilds: [],
            users: [],
            errors: [],
          },
        },
      },
    };
  }
};
