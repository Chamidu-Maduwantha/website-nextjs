import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, UsersIcon, ShieldCheckIcon, CalendarIcon, UserIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import AdminBadge from './AdminBadge';

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
  ownerGlobalName?: string;
  ownerAvatar?: string;
  ownerDiscriminator?: string;
  ownerCreatedAt?: any;
  ownerJoinedAt?: any;
  ownerRoles?: any[];
  ownerBadges?: string[];
  joinedAt?: any;
  botJoinedAt?: any;
  createdAt?: any;
  features?: string[];
  region?: string;
  verificationLevel?: number;
  lastActive?: any;
  maxMembers?: number;
  premiumTier?: number;
  premiumSubscriptionCount?: number;
  description?: string;
  banner?: string;
  vanityURLCode?: string;
  verified?: boolean;
  partnered?: boolean;
}

interface ServerListProps {
  guilds: Guild[];
  totalServers: number;
  loading: boolean;
}

export default function ServerList({ guilds, totalServers, loading }: ServerListProps) {
  const { data: session } = useSession();
  const [showDetails, setShowDetails] = useState(true);
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [sortBy, setSortBy] = useState<'name' | 'members' | 'joinedAt' | 'botJoinedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const isAdmin = (session?.user as any)?.isAdmin || false;

  console.log('ServerList - Session:', session);
  console.log('ServerList - Is admin:', isAdmin);
  console.log('ServerList - Guilds:', guilds);
  console.log('ServerList - Total servers:', totalServers);

  // Sorting functions
  const sortServers = (servers: Guild[]) => {
    const sorted = [...servers].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'members':
          aValue = a.memberCount || 0;
          bValue = b.memberCount || 0;
          break;
        case 'joinedAt':
          aValue = getTimestamp(a.joinedAt) || 0;
          bValue = getTimestamp(b.joinedAt) || 0;
          break;
        case 'botJoinedAt':
          aValue = getTimestamp(a.botJoinedAt) || 0;
          bValue = getTimestamp(b.botJoinedAt) || 0;
          break;
        case 'name':
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
      }
      
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
    
    return sorted;
  };

  const getTimestamp = (timestamp: any): number => {
    if (!timestamp) return 0;
    
    try {
      // Handle Firestore timestamp formats
      if (timestamp._seconds) {
        return timestamp._seconds * 1000;
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().getTime();
      } else if (timestamp.seconds) {
        return timestamp.seconds * 1000;
      } else if (timestamp instanceof Date) {
        return timestamp.getTime();
      } else {
        return new Date(timestamp).getTime();
      }
    } catch (error) {
      return 0;
    }
  };

  // Separate and sort active and inactive servers
  const activeServers = sortServers(guilds.filter(g => g.botPresent));
  const inactiveServers = sortServers(guilds.filter(g => !g.botPresent));

  const toggleServer = (serverId: string) => {
    const newExpanded = new Set(expandedServers);
    if (newExpanded.has(serverId)) {
      newExpanded.delete(serverId);
    } else {
      newExpanded.add(serverId);
    }
    setExpandedServers(newExpanded);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    try {
      let date;
      
      // Handle Firestore timestamp formats
      if (timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const getVerificationLevelText = (level: number) => {
    const levels = ['None', 'Low', 'Medium', 'High', 'Very High'];
    return levels[level] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <UsersIcon className="h-6 w-6 mr-2 text-blue-400" />
          Active Servers ({activeServers.length})
        </h2>
        {isAdmin && (
          <AdminBadge />
        )}
      </div>

      {/* Server Count Summary */}
      <div className="mb-6">
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{activeServers.length}</div>
                <div className="text-sm text-gray-400">Active Servers</div>
              </div>
              {isAdmin && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {inactiveServers.length}
                    </div>
                    <div className="text-sm text-gray-400">Inactive Servers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {guilds.length}
                    </div>
                    <div className="text-sm text-gray-400">Total Servers</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Server Tabs (Admin Only) */}
      {isAdmin && (
        <div className="mb-6">
          <div className="bg-gray-700 rounded-lg p-1 border border-gray-600">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'active'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>Active ({activeServers.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('inactive')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'inactive'
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                <span>Inactive ({inactiveServers.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sorting Controls */}
      <div className="mb-6">
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">Sort Servers</span>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="flex items-center space-x-2">
                <label className="text-gray-300 text-sm">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-600 text-white border border-gray-500 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Server Name</option>
                  <option value="members">Member Count</option>
                  <option value="joinedAt">Date Joined Discord</option>
                  <option value="botJoinedAt">Bot Joined Date</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-gray-300 text-sm">Order:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="bg-gray-600 text-white border border-gray-500 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="asc">
                    {sortBy === 'name' ? 'A to Z' : 
                     sortBy === 'members' ? 'Smallest First' : 
                     'Oldest First'}
                  </option>
                  <option value="desc">
                    {sortBy === 'name' ? 'Z to A' : 
                     sortBy === 'members' ? 'Largest First' : 
                     'Newest First'}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Server Details */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2 text-yellow-400" />
              {activeTab === 'active' ? 'Active' : 'Inactive'} Server Details
            </h3>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          {showDetails && (
            <div className="space-y-4">
              {/* Show appropriate servers based on active tab */}
              {(activeTab === 'active' ? activeServers : inactiveServers).length === 0 ? (
                <div className="bg-gray-700 rounded-lg p-8 text-center border border-gray-600">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    activeTab === 'active' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <span className="text-2xl">
                      {activeTab === 'active' ? '🟢' : '🔴'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No {activeTab === 'active' ? 'Active' : 'Inactive'} Servers
                  </h3>
                  <p className="text-gray-400">
                    {activeTab === 'active' 
                      ? 'No servers are currently active with the bot.'
                      : 'No servers have been marked as inactive yet.'
                    }
                  </p>
                </div>
              ) : (
                (activeTab === 'active' ? activeServers : inactiveServers).map((guild) => (
                <div key={guild.id} className="bg-gray-700 rounded-lg border border-gray-600">
                  {/* Server Header - Always Visible */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => toggleServer(guild.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {guild.icon ? (
                          <img
                            src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`}
                            alt={guild.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {guild.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="text-white font-semibold">{guild.name}</h3>
                          <p className="text-gray-400 text-sm flex items-center">
                            <UsersIcon className="h-4 w-4 mr-1" />
                            {guild.memberCount.toLocaleString()} members
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          guild.botPresent 
                            ? 'bg-green-600 text-green-100' 
                            : 'bg-red-600 text-red-100'
                        }`}>
                          {guild.botPresent ? 'Active' : 'Inactive'}
                        </div>
                        {expandedServers.has(guild.id) ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedServers.has(guild.id) && (
                    <div className="px-4 pb-4 border-t border-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Basic Info */}
                        <div className="space-y-3">
                          <div className="flex items-start text-gray-300">
                            <UserIcon className="h-4 w-4 mr-2 mt-0.5 text-blue-400" />
                            <div className="flex-1">
                              <div className="text-sm mb-1">Owner:</div>
                              <div className="flex items-center space-x-2">
                                {guild.ownerAvatar ? (
                                  <img
                                    src={guild.ownerAvatar}
                                    alt={guild.ownerName}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">
                                      {(guild.ownerName || 'U').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <div className="text-white font-medium">
                                    {guild.ownerGlobalName || guild.ownerName || 'Unknown'}
                                    {guild.ownerDiscriminator && guild.ownerDiscriminator !== '0' && (
                                      <span className="text-gray-400">#{guild.ownerDiscriminator}</span>
                                    )}
                                  </div>
                                  {guild.ownerCreatedAt && (
                                    <div className="text-xs text-gray-400">
                                      Account created: {formatDate(guild.ownerCreatedAt)}
                                    </div>
                                  )}
                                  {guild.ownerJoinedAt && (
                                    <div className="text-xs text-gray-400">
                                      Joined server: {formatDate(guild.ownerJoinedAt)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {guild.ownerBadges && guild.ownerBadges.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {guild.ownerBadges.map((badge, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-purple-600 text-purple-100 rounded text-xs"
                                    >
                                      {badge.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center text-gray-300">
                            <CalendarIcon className="h-4 w-4 mr-2 text-green-400" />
                            <span className="text-sm">CMusics Joined: <span className="text-white">{formatDate(guild.joinedAt)}</span></span>
                          </div>
                          <div className="flex items-center text-gray-300">
                            <CalendarIcon className="h-4 w-4 mr-2 text-purple-400" />
                            <span className="text-sm">Server Created: <span className="text-white">{formatDate(guild.createdAt)}</span></span>
                          </div>
                          <div className="flex items-center text-gray-300">
                            <ShieldCheckIcon className="h-4 w-4 mr-2 text-yellow-400" />
                            <span className="text-sm">Verification: <span className="text-white">{getVerificationLevelText(guild.verificationLevel || 0)}</span></span>
                          </div>
                          <div className="flex items-center text-gray-300">
                            <span className="text-sm">Region: <span className="text-white">{guild.region || 'Unknown'}</span></span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="space-y-3">
                          <div className="text-gray-300">
                            <span className="text-sm">Commands Used: <span className="text-white font-semibold">{guild.commandsUsed}</span></span>
                          </div>
                          <div className="text-gray-300">
                            <span className="text-sm">Songs Played: <span className="text-white font-semibold">{guild.songsPlayed}</span></span>
                          </div>
                          <div className="text-gray-300">
                            <span className="text-sm">Last Active: <span className="text-white">{formatDate(guild.lastActive)}</span></span>
                          </div>
                          {guild.maxMembers && (
                            <div className="text-gray-300">
                              <span className="text-sm">Max Members: <span className="text-white">{guild.maxMembers.toLocaleString()}</span></span>
                            </div>
                          )}
                          {guild.premiumTier > 0 && (
                            <div className="text-gray-300">
                              <span className="text-sm">Premium Tier: <span className="text-white">Level {guild.premiumTier}</span></span>
                            </div>
                          )}
                          {guild.premiumSubscriptionCount > 0 && (
                            <div className="text-gray-300">
                              <span className="text-sm">Boosts: <span className="text-white">{guild.premiumSubscriptionCount}</span></span>
                            </div>
                          )}
                          <div className="text-gray-300">
                            <span className="text-sm">Server ID: <span className="text-white text-xs font-mono">{guild.id}</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      {guild.features && guild.features.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-600">
                          <h4 className="text-white font-medium mb-2">Server Features</h4>
                          <div className="flex flex-wrap gap-2">
                            {guild.features.map((feature, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-600 text-blue-100 rounded text-xs font-medium"
                              >
                                {feature.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Server Badges */}
                      <div className="mt-4 pt-3 border-t border-gray-600">
                        <h4 className="text-white font-medium mb-2">Server Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {guild.verified && (
                            <span className="px-2 py-1 bg-green-600 text-green-100 rounded text-xs font-medium">
                              ✓ Verified
                            </span>
                          )}
                          {guild.partnered && (
                            <span className="px-2 py-1 bg-purple-600 text-purple-100 rounded text-xs font-medium">
                              ⭐ Partnered
                            </span>
                          )}
                          {guild.vanityURLCode && (
                            <span className="px-2 py-1 bg-indigo-600 text-indigo-100 rounded text-xs font-medium">
                              🔗 Custom URL
                            </span>
                          )}
                          {guild.premiumTier > 0 && (
                            <span className="px-2 py-1 bg-pink-600 text-pink-100 rounded text-xs font-medium">
                              💎 Nitro Boosted
                            </span>
                          )}
                          {guild.description && (
                            <span className="px-2 py-1 bg-gray-600 text-gray-100 rounded text-xs font-medium">
                              📝 Has Description
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {guild.description && (
                        <div className="mt-4 pt-3 border-t border-gray-600">
                          <h4 className="text-white font-medium mb-2">Server Description</h4>
                          <p className="text-gray-300 text-sm italic">{guild.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Non-Admin Server List */}
      {!isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-blue-400" />
              Your Servers
            </h3>
          </div>

          <div className="space-y-4">
            {activeServers.length === 0 ? (
              <div className="bg-gray-700 rounded-lg p-8 text-center border border-gray-600">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-500/20">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No Servers Found
                </h3>
                <p className="text-gray-400">
                  You don't have access to any servers with this bot, or the bot isn't active in your servers.
                </p>
              </div>
            ) : (
              activeServers.map((guild) => (
                <div key={guild.id} className="bg-gray-700 rounded-lg border border-gray-600">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => toggleServer(guild.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {guild.icon ? (
                          <img
                            src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`}
                            alt={guild.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {guild.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="text-white font-semibold">{guild.name}</h3>
                          <p className="text-gray-400 text-sm flex items-center">
                            <UsersIcon className="h-4 w-4 mr-1" />
                            {guild.memberCount.toLocaleString()} members
                            {guild.botJoinedAt && (
                              <>
                                <CalendarIcon className="h-4 w-4 ml-3 mr-1" />
                                Joined {formatDate(guild.botJoinedAt)}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-green-100">
                          Active
                        </div>
                        {expandedServers.has(guild.id) ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details for Non-Admin */}
                  {expandedServers.has(guild.id) && (
                    <div className="px-4 pb-4 border-t border-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-3">
                          <div className="flex items-center text-gray-300">
                            <UsersIcon className="h-4 w-4 mr-2 text-blue-400" />
                            <span className="text-sm">
                              {guild.memberCount.toLocaleString()} members
                            </span>
                          </div>
                          {guild.botJoinedAt && (
                            <div className="flex items-center text-gray-300">
                              <CalendarIcon className="h-4 w-4 mr-2 text-green-400" />
                              <span className="text-sm">
                                Bot joined: {formatDate(guild.botJoinedAt)}
                              </span>
                            </div>
                          )}
                          {guild.joinedAt && (
                            <div className="flex items-center text-gray-300">
                              <CalendarIcon className="h-4 w-4 mr-2 text-purple-400" />
                              <span className="text-sm">
                                Server created: {formatDate(guild.joinedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {guild.commandsUsed > 0 && (
                            <div className="text-gray-300 text-sm">
                              <span className="text-yellow-400 font-medium">{guild.commandsUsed}</span> commands used
                            </div>
                          )}
                          {guild.songsPlayed > 0 && (
                            <div className="text-gray-300 text-sm">
                              <span className="text-blue-400 font-medium">{guild.songsPlayed}</span> songs played
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
