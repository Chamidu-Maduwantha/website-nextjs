import { useState, useEffect } from 'react';
import { CogIcon, SpeakerWaveIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ServerSettingsProps {
  serverId: string;
  isOwner: boolean;
}

interface Settings {
  defaultVolume: number;
  maxQueueSize: number;
  autoLeave: boolean;
  autoLeaveTimeout: number;
  djRole?: string;
  allowedChannels: string[];
  blockedChannels: string[];
  welcomeMessages: boolean;
  nowPlayingMessages: boolean;
  deleteCommands: boolean;
}

export default function ServerSettings({ serverId, isOwner }: ServerSettingsProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState<{id: string, name: string}[]>([]);
  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchServerData();
  }, [serverId]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/server-settings?serverId=${serverId}`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || getDefaultSettings());
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const fetchServerData = async () => {
    try {
      const response = await fetch(`/api/server-data?serverId=${serverId}`);
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching server data:', error);
    }
  };

  const getDefaultSettings = (): Settings => ({
    defaultVolume: 50,
    maxQueueSize: 100,
    autoLeave: true,
    autoLeaveTimeout: 5,
    allowedChannels: [],
    blockedChannels: [],
    welcomeMessages: true,
    nowPlayingMessages: true,
    deleteCommands: false
  });

  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!isOwner) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/server-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serverId,
          settings: { ...settings, ...newSettings }
        })
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev!, ...newSettings }));
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
        <p className="text-white/60 text-center">Unable to load server settings</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-medium flex items-center">
          <CogIcon className="h-5 w-5 mr-2" />
          Server Settings
        </h3>
        {!isOwner && (
          <span className="text-orange-300 text-sm">👁️ View Only</span>
        )}
      </div>

      <div className="space-y-6">
        {/* Audio Settings */}
        <div className="space-y-4">
          <h4 className="text-white/80 font-medium flex items-center">
            <SpeakerWaveIcon className="h-4 w-4 mr-2" />
            Audio Settings
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-white/80 text-sm">
                Default Volume: {settings.defaultVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.defaultVolume}
                onChange={(e) => updateSettings({ defaultVolume: parseInt(e.target.value) })}
                disabled={!isOwner || saving}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-white/80 text-sm">Max Queue Size</label>
              <input
                type="number"
                min="10"
                max="1000"
                value={settings.maxQueueSize}
                onChange={(e) => updateSettings({ maxQueueSize: parseInt(e.target.value) })}
                disabled={!isOwner || saving}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/60 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Auto Leave Settings */}
        <div className="space-y-4">
          <h4 className="text-white/80 font-medium flex items-center">
            <ClockIcon className="h-4 w-4 mr-2" />
            Auto Leave Settings
          </h4>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoLeave"
              checked={settings.autoLeave}
              onChange={(e) => updateSettings({ autoLeave: e.target.checked })}
              disabled={!isOwner || saving}
              className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 disabled:opacity-50"
            />
            <label htmlFor="autoLeave" className="text-white/80">
              Auto leave when no one is listening
            </label>
          </div>
          
          {settings.autoLeave && (
            <div className="ml-6 space-y-2">
              <label className="block text-white/80 text-sm">
                Leave after {settings.autoLeaveTimeout} minutes
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={settings.autoLeaveTimeout}
                onChange={(e) => updateSettings({ autoLeaveTimeout: parseInt(e.target.value) })}
                disabled={!isOwner || saving}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
              />
            </div>
          )}
        </div>

        {/* Channel Permissions */}
        <div className="space-y-4">
          <h4 className="text-white/80 font-medium">Channel Permissions</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-white/80 text-sm">Allowed Channels (empty = all)</label>
              <select
                multiple
                value={settings.allowedChannels}
                onChange={(e) => updateSettings({ allowedChannels: Array.from(e.target.selectedOptions, o => o.value) })}
                disabled={!isOwner || saving}
                className="w-full h-32 px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id} className="bg-gray-800">
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-white/80 text-sm">Blocked Channels</label>
              <select
                multiple
                value={settings.blockedChannels}
                onChange={(e) => updateSettings({ blockedChannels: Array.from(e.target.selectedOptions, o => o.value) })}
                disabled={!isOwner || saving}
                className="w-full h-32 px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id} className="bg-gray-800">
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* DJ Role */}
        <div className="space-y-2">
          <label className="block text-white/80 text-sm">DJ Role (optional)</label>
          <select
            value={settings.djRole || ''}
            onChange={(e) => updateSettings({ djRole: e.target.value || undefined })}
            disabled={!isOwner || saving}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">No DJ role</option>
            {roles.map(role => (
              <option key={role.id} value={role.id} className="bg-gray-800">
                @{role.name}
              </option>
            ))}
          </select>
          <p className="text-white/60 text-xs">DJ role members can skip songs and manage the queue</p>
        </div>

        {/* Message Settings */}
        <div className="space-y-4">
          <h4 className="text-white/80 font-medium">Message Settings</h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="welcomeMessages"
                checked={settings.welcomeMessages}
                onChange={(e) => updateSettings({ welcomeMessages: e.target.checked })}
                disabled={!isOwner || saving}
                className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 disabled:opacity-50"
              />
              <label htmlFor="welcomeMessages" className="text-white/80">
                Send welcome messages when bot joins
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="nowPlayingMessages"
                checked={settings.nowPlayingMessages}
                onChange={(e) => updateSettings({ nowPlayingMessages: e.target.checked })}
                disabled={!isOwner || saving}
                className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 disabled:opacity-50"
              />
              <label htmlFor="nowPlayingMessages" className="text-white/80">
                Show now playing messages
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="deleteCommands"
                checked={settings.deleteCommands}
                onChange={(e) => updateSettings({ deleteCommands: e.target.checked })}
                disabled={!isOwner || saving}
                className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 disabled:opacity-50"
              />
              <label htmlFor="deleteCommands" className="text-white/80">
                Auto-delete command messages
              </label>
            </div>
          </div>
        </div>

        {/* Save Status */}
        {saving && (
          <div className="text-center py-4">
            <p className="text-blue-300">💾 Saving settings...</p>
          </div>
        )}
      </div>
    </div>
  );
}
