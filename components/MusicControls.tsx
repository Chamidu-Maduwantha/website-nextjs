import { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, ForwardIcon, BackwardIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';

interface MusicControlsProps {
  serverId: string;
}

interface CurrentSong {
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  url: string;
  requestedBy: string;
}

interface QueueItem {
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  requestedBy: string;
}

export default function MusicControls({ serverId }: MusicControlsProps) {
  const [currentSong, setCurrentSong] = useState<CurrentSong | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMusicStatus();
    const interval = setInterval(fetchMusicStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [serverId]);

  const fetchMusicStatus = async () => {
    try {
      const response = await fetch(`/api/music-status?serverId=${serverId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentSong(data.currentSong);
        setQueue(data.queue || []);
        setIsPlaying(data.isPlaying || false);
        setVolume(data.volume || 50);
      }
    } catch (error) {
      console.error('Error fetching music status:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendCommand = async (command: string, args?: string) => {
    try {
      const response = await fetch('/api/bot-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serverId, 
          command, 
          args: args || '' 
        })
      });

      if (response.ok) {
        // Refresh status after command
        setTimeout(fetchMusicStatus, 1000);
      }
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/20 rounded w-1/4"></div>
          <div className="h-32 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
      <h3 className="text-white font-medium mb-4 flex items-center">
        <SpeakerWaveIcon className="h-5 w-5 mr-2" />
        Music Controls
      </h3>

      {currentSong ? (
        <div className="space-y-4">
          {/* Current Song */}
          <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
            <img 
              src={currentSong.thumbnail} 
              alt={currentSong.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h4 className="text-white font-medium truncate">{currentSong.title}</h4>
              <p className="text-white/60 text-sm truncate">{currentSong.artist}</p>
              <p className="text-white/40 text-xs">Requested by {currentSong.requestedBy}</p>
            </div>
            <div className="text-white/60 text-sm">{currentSong.duration}</div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => sendCommand('skip')}
              className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <BackwardIcon className="h-5 w-5 text-white" />
            </button>
            
            <button
              onClick={() => sendCommand(isPlaying ? 'pause' : 'resume')}
              className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-full hover:bg-blue-500/30 transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="h-6 w-6 text-blue-300" />
              ) : (
                <PlayIcon className="h-6 w-6 text-blue-300" />
              )}
            </button>
            
            <button
              onClick={() => sendCommand('skip')}
              className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <ForwardIcon className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="space-y-2">
            <label className="text-white/80 text-sm">Volume: {volume}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                const newVolume = parseInt(e.target.value);
                setVolume(newVolume);
                sendCommand('volume', newVolume.toString());
              }}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Queue */}
          {queue.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white/80 font-medium">Queue ({queue.length} songs)</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {queue.slice(0, 5).map((song, index) => (
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
                    <span className="text-white/40 text-xs">{song.duration}</span>
                  </div>
                ))}
                {queue.length > 5 && (
                  <p className="text-white/60 text-sm text-center">
                    +{queue.length - 5} more songs...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => sendCommand('shuffle')}
              className="px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 text-sm"
            >
              🔀 Shuffle
            </button>
            <button
              onClick={() => sendCommand('clear')}
              className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 text-sm"
            >
              🗑️ Clear Queue
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-white/60 mb-4">No music currently playing</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => sendCommand('help')}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 text-sm"
            >
              📋 View Commands
            </button>
            <button
              onClick={() => sendCommand('stats')}
              className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 text-sm"
            >
              📊 Server Stats
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
