import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MinusIcon, 
  UsersIcon, 
  CalendarIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface Guild {
  id: string;
  name: string;
  icon?: string;
  memberCount: number;
  ownerId?: string;
  ownerName?: string;
  ownerAvatar?: string;
  joinedAt?: Date;
  leftAt?: Date;
  botJoinedAt?: Date;
  botPresent: boolean;
}

interface ServerActivityData {
  recentlyAdded: Guild[];
  recentlyLeft: Guild[];
}

export default function ServerActivity() {
  const [activityData, setActivityData] = useState<ServerActivityData>({ 
    recentlyAdded: [], 
    recentlyLeft: [] 
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    loadActivityData();
  }, [selectedPeriod]);

  const loadActivityData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/server-activity?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setActivityData(data);
      }
    } catch (error) {
      console.error('Error loading server activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown';
    
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  const getTimeAgo = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown';
    
    try {
      const d = new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      return 'Just now';
    } catch (error) {
      return 'Unknown';
    }
  };

  const ServerCard = ({ guild, type }: { guild: Guild; type: 'joined' | 'left' }) => (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/10 hover:bg-white/15 transition-all">
      <div className="flex items-center space-x-3">
        {/* Server Icon */}
        {guild.icon ? (
          <img
            src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`}
            alt={guild.name}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {guild.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Server Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-white font-semibold truncate">{guild.name}</h3>
            {type === 'joined' ? (
              <div className="flex items-center text-green-400 text-sm">
                <PlusIcon className="h-4 w-4 mr-1" />
                <span>Joined</span>
              </div>
            ) : (
              <div className="flex items-center text-red-400 text-sm">
                <MinusIcon className="h-4 w-4 mr-1" />
                <span>Left</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center text-white/60 text-sm mt-1">
            <UsersIcon className="h-4 w-4 mr-1" />
            <span>{guild.memberCount?.toLocaleString() || 'Unknown'} members</span>
          </div>
          
          <div className="flex items-center text-white/60 text-sm mt-1">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>{getTimeAgo(type === 'joined' ? guild.botJoinedAt : guild.leftAt)}</span>
          </div>
        </div>

        {/* Owner Info */}
        {guild.ownerName && (
          <div className="flex items-center space-x-2">
            {guild.ownerAvatar ? (
              <img
                src={guild.ownerAvatar}
                alt={guild.ownerName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {guild.ownerName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-right">
              <div className="text-white/80 text-sm font-medium">{guild.ownerName}</div>
              <div className="text-white/60 text-xs">Owner</div>
            </div>
          </div>
        )}
        
        <ChevronRightIcon className="h-5 w-5 text-white/40" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <ArrowTrendingUpIcon className="h-6 w-6 mr-2 text-blue-400" />
            Server Activity
          </h2>
          <p className="text-white/60 mt-1">
            Track recent server joins and departures
          </p>
        </div>
        
        {/* Period Selection */}
        <div className="flex space-x-2">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' }
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">Servers Joined</p>
              <p className="text-3xl font-bold text-green-400">
                {activityData.recentlyAdded.length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500/20">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">Servers Left</p>
              <p className="text-3xl font-bold text-red-400">
                {activityData.recentlyLeft.length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-500/20">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Joined */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <PlusIcon className="h-5 w-5 mr-2 text-green-400" />
            Recently Joined ({activityData.recentlyAdded.length})
          </h3>
          
          {activityData.recentlyAdded.length > 0 ? (
            <div className="space-y-3">
              {activityData.recentlyAdded.map((guild) => (
                <ServerCard key={guild.id} guild={guild} type="joined" />
              ))}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-8 border border-white/10 text-center">
              <PlusIcon className="h-12 w-12 text-white/40 mx-auto mb-3" />
              <p className="text-white/60">No servers joined in the selected period</p>
            </div>
          )}
        </div>

        {/* Recently Left */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <MinusIcon className="h-5 w-5 mr-2 text-red-400" />
            Recently Left ({activityData.recentlyLeft.length})
          </h3>
          
          {activityData.recentlyLeft.length > 0 ? (
            <div className="space-y-3">
              {activityData.recentlyLeft.map((guild) => (
                <ServerCard key={guild.id} guild={guild} type="left" />
              ))}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-8 border border-white/10 text-center">
              <MinusIcon className="h-12 w-12 text-white/40 mx-auto mb-3" />
              <p className="text-white/60">No servers left in the selected period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
