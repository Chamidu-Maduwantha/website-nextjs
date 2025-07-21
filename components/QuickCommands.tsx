import { useState } from 'react';
import { CommandLineIcon, PlayIcon, PauseIcon, ForwardIcon, StopIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface QuickCommandsProps {
  serverId: string;
}

export default function QuickCommands({ serverId }: QuickCommandsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string>('');

  const executeCommand = async (command: string, args?: string) => {
    setLoading(command);
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
        const data = await response.json();
        setLastResponse(data.message || `${command} executed successfully`);
      } else {
        setLastResponse('Command failed');
      }
    } catch (error) {
      console.error('Error executing command:', error);
      setLastResponse('Error executing command');
    } finally {
      setLoading(null);
    }
  };

  const quickCommands = [
    {
      id: 'play',
      label: 'Resume',
      icon: PlayIcon,
      color: 'green',
      description: 'Resume playback'
    },
    {
      id: 'pause',
      label: 'Pause',
      icon: PauseIcon,
      color: 'yellow',
      description: 'Pause current song'
    },
    {
      id: 'skip',
      label: 'Skip',
      icon: ForwardIcon,
      color: 'blue',
      description: 'Skip current song'
    },
    {
      id: 'stop',
      label: 'Stop',
      icon: StopIcon,
      color: 'red',
      description: 'Stop and clear queue'
    },
    {
      id: 'shuffle',
      label: 'Shuffle',
      icon: ArrowPathIcon,
      color: 'purple',
      description: 'Shuffle the queue'
    }
  ];

  const getButtonClass = (color: string) => {
    const baseClass = "flex flex-col items-center p-4 rounded-lg transition-colors disabled:opacity-50";
    const colorClasses = {
      green: "bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30",
      yellow: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30",
      blue: "bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30",
      red: "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30",
      purple: "bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
    };
    return `${baseClass} ${colorClasses[color as keyof typeof colorClasses]}`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
      <h3 className="text-white font-medium mb-4 flex items-center">
        <CommandLineIcon className="h-5 w-5 mr-2" />
        Quick Commands
      </h3>

      {/* Command Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {quickCommands.map((cmd) => {
          const Icon = cmd.icon;
          return (
            <button
              key={cmd.id}
              onClick={() => executeCommand(cmd.id)}
              disabled={loading !== null}
              className={getButtonClass(cmd.color)}
              title={cmd.description}
            >
              {loading === cmd.id ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-current border-t-transparent"></div>
              ) : (
                <Icon className="h-6 w-6 mb-1" />
              )}
              <span className="text-xs font-medium">{cmd.label}</span>
            </button>
          );
        })}
      </div>

      {/* Volume Quick Control */}
      <div className="mb-4">
        <label className="block text-white/80 text-sm mb-2">Quick Volume</label>
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((vol) => (
            <button
              key={vol}
              onClick={() => executeCommand('volume', vol.toString())}
              disabled={loading !== null}
              className="px-3 py-2 bg-white/10 text-white/80 rounded hover:bg-white/20 transition-colors text-sm disabled:opacity-50"
            >
              {vol}%
            </button>
          ))}
        </div>
      </div>

      {/* Custom Command Input */}
      <div className="mb-4">
        <label className="block text-white/80 text-sm mb-2">Custom Command</label>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="e.g., play Rick Astley Never Gonna Give You Up"
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/60 focus:outline-none focus:border-blue-500 text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                const [command, ...args] = input.value.trim().split(' ');
                if (command) {
                  executeCommand(command, args.join(' '));
                  input.value = '';
                }
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
              const [command, ...args] = input.value.trim().split(' ');
              if (command) {
                executeCommand(command, args.join(' '));
                input.value = '';
              }
            }}
            disabled={loading !== null}
            className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded hover:bg-blue-500/30 disabled:opacity-50 text-sm"
          >
            Send
          </button>
        </div>
        <p className="text-white/40 text-xs mt-1">
          Press Enter or click Send to execute custom commands
        </p>
      </div>

      {/* Response Display */}
      {lastResponse && (
        <div className="p-3 bg-white/5 rounded-lg border-l-4 border-blue-500">
          <p className="text-white/80 text-sm">
            <span className="text-blue-300 font-medium">Bot Response:</span> {lastResponse}
          </p>
        </div>
      )}

      {/* Quick Help */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg">
        <p className="text-white/60 text-xs">
          💡 <strong>Tip:</strong> You can also type commands like "play song name", "volume 80", "queue", etc.
        </p>
      </div>
    </div>
  );
}
