import { useState, useEffect } from 'react';

interface BotStatusData {
  status: string;
  maintenanceMode: boolean;
  devMode: boolean;
  lastStatusUpdate: any;
  uptime: number;
  totalGuilds: number;
  totalUsers: number;
}

export default function BotStatus() {
  const [botStatus, setBotStatus] = useState<BotStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBotStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchBotStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBotStatus = async () => {
    try {
      const response = await fetch('/api/bot-status');
      if (response.ok) {
        const data = await response.json();
        console.log('Bot status data:', data); // Debug log
        setBotStatus(data);
      }
    } catch (error) {
      console.error('Error fetching bot status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getStatusColor = () => {
    if (!botStatus) return 'gray';
    if (botStatus.maintenanceMode || botStatus.devMode) return 'orange';
    if (botStatus.status === 'online') return 'green';
    return 'red';
  };

  const getStatusText = () => {
    if (!botStatus) return 'Unknown';
    if (botStatus.maintenanceMode || botStatus.devMode) return 'Maintenance Mode';
    if (botStatus.status === 'online') return 'Online';
    return 'Offline';
  };

  const getStatusIcon = () => {
    if (!botStatus) return '❓';
    if (botStatus.maintenanceMode || botStatus.devMode) return '🔧';
    if (botStatus.status === 'online') return '🟢';
    return '🔴';
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="h-8 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white/60 text-sm font-medium">Bot Status</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl">{getStatusIcon()}</span>
            <p className={`text-xl font-bold ${
              getStatusColor() === 'green' ? 'text-green-400' :
              getStatusColor() === 'orange' ? 'text-orange-400' :
              getStatusColor() === 'red' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        <div className={`p-3 rounded-full ${
          getStatusColor() === 'green' ? 'bg-green-500/20' :
          getStatusColor() === 'orange' ? 'bg-orange-500/20' :
          getStatusColor() === 'red' ? 'bg-red-500/20' : 'bg-gray-500/20'
        }`}>
          <span className="text-2xl">🤖</span>
        </div>
      </div>
      
      {botStatus && (
        <div className="space-y-2 text-sm">
          {botStatus.maintenanceMode && (
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <p className="text-orange-200 font-medium">
                  Bot is currently under maintenance
                </p>
              </div>
              <p className="text-orange-300/80 text-xs mt-1">
                Only admins and developers can use commands
              </p>
            </div>
          )}
          
          {!botStatus.maintenanceMode && botStatus.status === 'online' && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span>✅</span>
                <p className="text-green-200 font-medium">
                  Bot is online and ready
                </p>
              </div>
              <p className="text-green-300/80 text-xs mt-1">
                All commands are available to users
              </p>
            </div>
          )}
          
          <div className="flex justify-between text-white/60">
            <span>Uptime:</span>
            <span className="text-white">{formatUptime(botStatus.uptime || 0)}</span>
          </div>
          
          {botStatus.lastStatusUpdate && (
            <div className="flex justify-between text-white/60">
              <span>Last Update:</span>
              <span className="text-white">
                {(() => {
                  try {
                    let date;
                    if (botStatus.lastStatusUpdate._seconds) {
                      // Firebase Timestamp
                      date = new Date(botStatus.lastStatusUpdate._seconds * 1000);
                    } else if (typeof botStatus.lastStatusUpdate === 'string') {
                      // ISO string
                      date = new Date(botStatus.lastStatusUpdate);
                    } else {
                      // Already a Date object
                      date = new Date(botStatus.lastStatusUpdate);
                    }
                    return date.toLocaleTimeString();
                  } catch (error) {
                    return 'Unknown';
                  }
                })()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
