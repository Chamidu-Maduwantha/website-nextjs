import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { MusicalNoteIcon, ClockIcon, UsersIcon, CommandLineIcon } from '@heroicons/react/24/outline';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface ServerMusicStatsProps {
  serverId: string;
}

interface MusicStats {
  totalSongs: number;
  totalPlaytime: number;
  totalCommands: number;
  activeUsers: number;
  topGenres: { genre: string; count: number }[];
  recentSongs: { title: string; artist: string; playedAt: string; thumbnail: string }[];
  dailyActivity: { date: string; songs: number; commands: number }[];
  topUsers: { username: string; songsPlayed: number; avatar?: string }[];
}

export default function ServerMusicStats({ serverId }: ServerMusicStatsProps) {
  const [stats, setStats] = useState<MusicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, all

  useEffect(() => {
    fetchStats();
  }, [serverId, timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/server-music-stats?serverId=${serverId}&range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching music stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPlaytime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const genreChartData = {
    labels: stats?.topGenres.map(g => g.genre) || [],
    datasets: [{
      data: stats?.topGenres.map(g => g.count) || [],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 101, 101, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
      ],
      borderWidth: 0
    }]
  };

  const activityChartData = {
    labels: stats?.dailyActivity.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Songs Played',
        data: stats?.dailyActivity.map(d => d.songs) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4
      },
      {
        label: 'Commands Used',
        data: stats?.dailyActivity.map(d => d.commands) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 4
      }
    ]
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-white/20 rounded"></div>
            <div className="h-24 bg-white/20 rounded"></div>
          </div>
          <div className="h-64 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
        <p className="text-white/60 text-center">No music stats available for this server</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium flex items-center">
            <MusicalNoteIcon className="h-5 w-5 mr-2" />
            Music Statistics
          </h3>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <MusicalNoteIcon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.totalSongs}</div>
            <div className="text-white/60 text-sm">Songs Played</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <ClockIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{formatPlaytime(stats.totalPlaytime)}</div>
            <div className="text-white/60 text-sm">Total Playtime</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <CommandLineIcon className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.totalCommands}</div>
            <div className="text-white/60 text-sm">Commands Used</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <UsersIcon className="h-8 w-8 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
            <div className="text-white/60 text-sm">Active Users</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Genre Distribution */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Top Genres</h4>
            <div className="h-48">
              <Doughnut 
                data={genreChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: 'rgba(255, 255, 255, 0.8)' }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Daily Activity */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Daily Activity</h4>
            <div className="h-48">
              <Bar 
                data={activityChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: 'rgba(255, 255, 255, 0.8)' }
                    }
                  },
                  scales: {
                    x: {
                      ticks: { color: 'rgba(255, 255, 255, 0.6)' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                      ticks: { color: 'rgba(255, 255, 255, 0.6)' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <h4 className="text-white font-medium mb-3">Top Listeners</h4>
          <div className="space-y-2">
            {stats.topUsers.slice(0, 5).map((user, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <UsersIcon className="h-4 w-4 text-white/60" />
                    </div>
                  )}
                  <span className="text-white">{user.username}</span>
                </div>
                <span className="text-white/60 text-sm">{user.songsPlayed} songs</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Songs */}
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Recently Played</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.recentSongs.map((song, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-white/5 rounded">
                <img 
                  src={song.thumbnail} 
                  alt={song.title}
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{song.title}</p>
                  <p className="text-white/60 text-xs truncate">{song.artist}</p>
                </div>
                <span className="text-white/40 text-xs">
                  {new Date(song.playedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
