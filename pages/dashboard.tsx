import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Layout from '../components/Layout';
import ServerList from '../components/ServerList';
import ServerActivity from '../components/ServerActivity';
import DevModeToggle from '../components/DevModeToggle';
import PremiumUserManagement from '../components/PremiumUserManagement';
import PremiumBadge from '../components/PremiumBadge';
import CustomCommands from '../components/CustomCommands';
import BotStatus from '../components/BotStatus';
import MaintenanceToggle from '../components/MaintenanceToggle';
import MusicSearch from '../components/MusicSearch';
import ServerMusicStats from '../components/ServerMusicStats';
import ServerSettings from '../components/ServerSettings';
import UserMusicActivity from '../components/UserMusicActivity';


interface DashboardStats {
  totalServers: number;
  totalUsers: number;
  totalCommands: number;
  totalSongs: number;
}

interface Guild {
  id: string;
  name: string;
  icon?: string;
  memberCount: number;
  commandsUsed: number;
  songsPlayed: number;
  botPresent: boolean;
  ownerId?: string;
  ownerName?: string;
  joinedAt?: any;
  botJoinedAt?: any;
  features?: string[];
  region?: string;
  verificationLevel?: number;
  lastActive?: any;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedServerId, setSelectedServerId] = useState('');

  // All hooks must be called before any early returns
  const isAdmin = (session?.user as any)?.isAdmin || false;
  
  // Manual admin check for debugging
  const manualAdminCheck = session?.user?.id && 
    process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',').includes(session.user.id);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('Loading dashboard data...');
      console.log('Is admin:', isAdmin);
      console.log('Using API endpoint:', isAdmin ? '/api/guilds/admin' : '/api/guilds/user');
      
      const [statsRes, guildsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch(isAdmin ? '/api/guilds/admin' : '/api/guilds/user')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (guildsRes.ok) {
        const guildsData = await guildsRes.json();
        console.log('Guilds data received:', guildsData);
        setGuilds(guildsData.guilds || []);
      }

      // Check premium status
      try {
        const premiumRes = await fetch('/api/premium/status');
        if (premiumRes.ok) {
          const premiumData = await premiumRes.json();
          console.log('Premium data received:', premiumData);
          setIsPremium(premiumData.isPremium);
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadDashboardData();
    }
  }, [session, isAdmin]);

  // Authentication guard
  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center min-h-[70vh] text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-white/10 max-w-md">
            <h1 className="text-3xl font-bold text-white mb-4">🔒 Authentication Required</h1>
            <p className="text-white/70 mb-6">
              You need to login with Discord to access your dashboard.
            </p>
            <button
              onClick={() => signIn('discord')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
            >
              <span>🎮</span>
              <span>Login with Discord</span>
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  console.log('Session user:', session?.user);
  console.log('Is admin:', isAdmin);
  console.log('Admin user IDs:', process.env.NEXT_PUBLIC_ADMIN_USER_IDS);
  console.log('User ID:', session?.user?.id);
  console.log('Manual admin check:', manualAdminCheck);

  const refreshData = async () => {
    await loadDashboardData();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'music', name: 'Music Hub', icon: '🎵' },
    { id: 'servers', name: 'Servers', icon: '🖥️' },
    { id: 'commands', name: 'Custom Commands', icon: '⚡' },
    ...(isAdmin ? [
      { id: 'activity', name: 'Server Activity', icon: '📈' },
      { id: 'admin', name: 'Admin Panel', icon: '👑' },
      { id: 'devmode', name: 'Dev Mode', icon: '🔧' }
    ] : []),
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Bot Status - Full Width */}
            <BotStatus />
            
            {/* Refresh Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
              <button
                onClick={refreshData}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2 rounded-lg border border-blue-500/30 transition-colors flex items-center space-x-2"
                disabled={loading}
              >
                <span className={loading ? "animate-spin" : ""}>🔄</span>
                <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
              </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Total Servers</p>
                    <p className="text-3xl font-bold text-white">
                      {loading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        stats?.totalServers || 0
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500/20">
                    <span className="text-2xl">🖥️</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold text-white">
                      {loading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        stats?.totalUsers || 0
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-500/20">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>

             

            
            </div>

            {/* Quick Overview */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white/80 font-medium mb-2">Bot Status</h4>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 font-medium">Online & Active</span>
                  </div>
                  <p className="text-white/60 text-sm">
                    Your music bot is running smoothly across {stats?.totalServers || 0} servers with {stats?.totalUsers || 0} users.
                  </p>
                </div>
                <div>
                  <h4 className="text-white/80 font-medium mb-2">Account Status</h4>
                  <div className="flex items-center space-x-2 flex-wrap">
                    {isAdmin && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30">
                        ADMIN
                      </span>
                    )}
                    {isPremium && (
                      <span className="flex items-center space-x-1">
                        <PremiumBadge size="sm" />
                        <span className="text-yellow-400 text-sm">Premium Active</span>
                      </span>
                    )}
                    {!isPremium && !isAdmin && (
                      <span className="text-white/60 text-sm">Standard User</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Features Available for Standard Users */}
            {!isAdmin && (
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  🎵 What You Can Do with CMusics Dashboard
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-3xl mb-2">🎮</div>
                    <h4 className="text-white font-medium mb-2">Music Controls</h4>
                    <p className="text-white/60 text-sm">Control your bot's music playback with easy-to-use buttons. Play, pause, skip, adjust volume, and manage the queue without typing commands!</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-3xl mb-2">🔍</div>
                    <h4 className="text-white font-medium mb-2">Music Search</h4>
                    <p className="text-white/60 text-sm">Search for songs, artists, and playlists directly from the web. Preview results and add them to your queue with one click!</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-3xl mb-2">📊</div>
                    <h4 className="text-white font-medium mb-2">Server Stats</h4>
                    <p className="text-white/60 text-sm">View detailed music statistics for your servers including top genres, listening habits, and activity charts.</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-3xl mb-2">❤️</div>
                    <h4 className="text-white font-medium mb-2">Personal Favorites</h4>
                    <p className="text-white/60 text-sm">Save your favorite songs and access them anytime. Build your personal music collection and play them instantly!</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-3xl mb-2">🔧</div>
                    <h4 className="text-white font-medium mb-2">Server Settings</h4>
                    <p className="text-white/60 text-sm">{guilds.some(g => g.ownerId === session?.user?.id) ? "Configure your server's bot settings including volume, auto-leave, and channel permissions." : "View your server's bot configuration (server owners can edit settings)."}</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-white/5 rounded-lg border border-blue-500/30">
                  <p className="text-blue-300 text-sm">
                    <strong>🚀 Get Started:</strong> Click on the "Music Hub" tab above to start controlling your music, or browse your servers to see detailed information about each one!
                  </p>
                </div>
                
                {!isPremium && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/30">
                    <p className="text-yellow-300 text-sm">
                      <strong>⭐ Want More?</strong> Upgrade to Premium for custom commands, advanced playlist management, and priority support!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'music':
        return (
          <div className="space-y-6">
            {/* Select Server for Music Controls */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-medium mb-4">🎵 Select a Server</h3>
              <select
                value={selectedServerId}
                onChange={(e) => setSelectedServerId(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Choose a server...</option>
                {guilds
                  .filter(guild => guild.botPresent)
                  .map(guild => (
                    <option key={guild.id} value={guild.id} className="bg-gray-800">
                      {guild.name}
                    </option>
                  ))}
              </select>
              {selectedServerId && guilds.find(g => g.id === selectedServerId)?.botPresent === false && (
                <p className="text-red-300 text-sm mt-2">⚠️ Bot is not present in this server</p>
              )}
            </div>

            {selectedServerId && guilds.find(g => g.id === selectedServerId)?.botPresent && (
              <div className="space-y-6">
                {/* User's Personal Music Activity */}
                <UserMusicActivity userId={session?.user?.id || ''} />
                
                {/* Server Music Controls and Stats */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <MusicSearch serverId={selectedServerId} />
                  </div>
                  <div className="space-y-6">
                    <ServerMusicStats serverId={selectedServerId} />
                    <ServerSettings 
                      serverId={selectedServerId} 
                      isOwner={guilds.find(g => g.id === selectedServerId)?.ownerId === session?.user?.id}
                    />
                  </div>
                </div>
              </div>
            )}

            {!selectedServerId && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-white font-medium mb-2">Welcome to Music Hub</h3>
                <p className="text-white/60 mb-6">Select a server above to start controlling music, searching songs, and viewing statistics!</p>
                <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl mb-2">🎮</div>
                    <h4 className="text-white font-medium">Music Controls</h4>
                    <p className="text-white/60 text-sm">Play, pause, skip, and control volume</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl mb-2">🔍</div>
                    <h4 className="text-white font-medium">Search & Play</h4>
                    <p className="text-white/60 text-sm">Search for songs and add to queue</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <h4 className="text-white font-medium">Music Stats</h4>
                    <p className="text-white/60 text-sm">View listening habits and top songs</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'servers':
        return (
          <div>
            <ServerList 
              guilds={guilds} 
              totalServers={stats?.totalServers || 0} 
              loading={loading} 
            />
          </div>
        );

      case 'commands':
        return (
          <div>
            <CustomCommands isPremium={isPremium} />
          </div>
        );

      case 'activity':
        return isAdmin ? (
          <div>
            <ServerActivity />
          </div>
        ) : null;

      case 'admin':
        return isAdmin ? (
          <div className="space-y-6">
            <PremiumUserManagement />
          </div>
        ) : null;

      case 'devmode':
        return isAdmin ? (
          <div className="space-y-6">
            <DevModeToggle />
            <MaintenanceToggle />
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center flex-wrap">
              Dashboard
              {isPremium && (
                <span className="ml-3">
                  <PremiumBadge size="md" />
                </span>
              )}
              {isAdmin && (
                <span className="ml-3 px-2 py-1 bg-red-500/20 text-red-400 text-sm rounded border border-red-500/30">
                  ADMIN
                </span>
              )}
            </h1>
            <p className="text-white/60 mt-2">
              Welcome to your CMusics dashboard!
              {isPremium && !isAdmin && (
                <span className="ml-2 text-yellow-400">
                  ✨ Enjoying premium features
                </span>
              )}
              {isAdmin && (
                <span className="ml-2 text-yellow-400">
                  (Admin mode - showing all servers)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={refreshData}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors backdrop-blur-lg border border-white/10 flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-1 border border-white/10">
            <div className="flex flex-wrap gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all text-sm md:text-base ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
}
