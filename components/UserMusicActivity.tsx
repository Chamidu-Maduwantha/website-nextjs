import { useState, useEffect } from 'react';
import { HeartIcon, ClockIcon, PlayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface UserMusicActivityProps {
  userId: string;
}

interface FavoriteSong {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  url: string;
  addedAt: string;
}

interface RecentActivity {
  id: string;
  type: 'played' | 'requested' | 'skipped';
  songTitle: string;
  artist: string;
  serverName: string;
  timestamp: string;
  thumbnail: string;
}

export default function UserMusicActivity({ userId }: UserMusicActivityProps) {
  const [favorites, setFavorites] = useState<FavoriteSong[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'favorites' | 'activity'>('favorites');

  useEffect(() => {
    fetchUserMusicData();
  }, [userId]);

  const fetchUserMusicData = async () => {
    setLoading(true);
    try {
      const [favoritesRes, activityRes] = await Promise.all([
        fetch(`/api/user-favorites?userId=${userId}`),
        fetch(`/api/user-music-activity?userId=${userId}`)
      ]);

      if (favoritesRes.ok) {
        const favData = await favoritesRes.json();
        setFavorites(favData.favorites || []);
      }

      if (activityRes.ok) {
        const actData = await activityRes.json();
        setRecentActivity(actData.activity || []);
      }
    } catch (error) {
      console.error('Error fetching user music data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (songData: Omit<FavoriteSong, 'id' | 'addedAt'>) => {
    try {
      const existingFav = favorites.find(fav => fav.url === songData.url);
      
      if (existingFav) {
        // Remove from favorites
        const response = await fetch('/api/user-favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, songId: existingFav.id })
        });

        if (response.ok) {
          setFavorites(prev => prev.filter(fav => fav.id !== existingFav.id));
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/user-favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...songData })
        });

        if (response.ok) {
          const newFav = await response.json();
          setFavorites(prev => [newFav.favorite, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const playFromFavorites = async (song: FavoriteSong, serverId?: string) => {
    if (!serverId) {
      alert('Please select a server first in the Music Hub tab');
      return;
    }

    try {
      const response = await fetch('/api/bot-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serverId, 
          command: 'play',
          args: song.url
        })
      });

      if (response.ok) {
        console.log(`Playing ${song.title} from favorites`);
      }
    } catch (error) {
      console.error('Error playing from favorites:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'played': return '▶️';
      case 'requested': return '➕';
      case 'skipped': return '⏭️';
      default: return '🎵';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'played': return 'text-green-300';
      case 'requested': return 'text-blue-300';
      case 'skipped': return 'text-orange-300';
      default: return 'text-white/60';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
      {/* Section Tabs */}
      <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setActiveSection('favorites')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'favorites'
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <HeartIcon className="h-4 w-4 inline mr-2" />
          Favorites ({favorites.length})
        </button>
        <button
          onClick={() => setActiveSection('activity')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'activity'
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <ClockIcon className="h-4 w-4 inline mr-2" />
          Recent Activity
        </button>
      </div>

      {/* Favorites Section */}
      {activeSection === 'favorites' && (
        <div className="space-y-3">
          {favorites.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Your Favorite Songs</h3>
                <span className="text-white/60 text-sm">{favorites.length} songs</span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {favorites.map((song) => (
                  <div key={song.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <img 
                      src={song.thumbnail} 
                      alt={song.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{song.title}</h4>
                      <p className="text-white/60 text-sm truncate">{song.artist}</p>
                      <p className="text-white/40 text-xs">
                        Added {new Date(song.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => playFromFavorites(song)}
                        className="p-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30"
                        title="Play now"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleFavorite({ title: song.title, artist: song.artist, thumbnail: song.thumbnail, url: song.url })}
                        className="p-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30"
                        title="Remove from favorites"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <HeartIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">No favorites yet</h3>
              <p className="text-white/60 text-sm">
                Heart songs while they're playing to add them to your favorites!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity Section */}
      {activeSection === 'activity' && (
        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            <>
              <h3 className="text-white font-medium">Recent Music Activity</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                    <img 
                      src={activity.thumbnail} 
                      alt={activity.songTitle}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                        </span>
                        <span className="text-white/40 text-xs">•</span>
                        <span className="text-white/60 text-xs">{activity.serverName}</span>
                      </div>
                      <p className="text-white text-sm truncate">{activity.songTitle}</p>
                      <p className="text-white/60 text-xs truncate">{activity.artist}</p>
                    </div>
                    <span className="text-white/40 text-xs">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">No recent activity</h3>
              <p className="text-white/60 text-sm">
                Start using music commands to see your activity here!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
