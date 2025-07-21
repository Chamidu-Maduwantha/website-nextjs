import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  MusicalNoteIcon,
  CommandLineIcon,
  PlayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import PremiumBadge from './PremiumBadge';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';

interface CustomCommand {
  id: string;
  commandName: string;
  displayName: string;
  playlist: string[];
  description: string;
  createdAt: Date;
  usageCount: number;
  lastUsed: Date | null;
}

interface CustomCommandsProps {
  isPremium?: boolean;
}

export default function CustomCommands({ isPremium = false }: CustomCommandsProps) {
  const [commands, setCommands] = useState<CustomCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCommand, setEditingCommand] = useState<CustomCommand | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userStatus, setUserStatus] = useState({ isPremium: false });
  const { showSuccess, showError, showWarning } = useToast();
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; commandId: string; commandName: string }>({
    isOpen: false,
    commandId: '',
    commandName: ''
  });
  
  const [formData, setFormData] = useState({
    commandName: '',
    description: '',
    playlist: ['']
  });

  const fetchCustomCommands = async () => {
    try {
      const response = await fetch('/api/custom-commands');
      const data = await response.json();
      
      if (data.success) {
        setCommands(data.commands);
      }
    } catch (error) {
      console.error('Error fetching custom commands:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStatus = async () => {
    try {
      const response = await fetch('/api/premium/status');
      if (response.ok) {
        const data = await response.json();
        setUserStatus({ isPremium: data.isPremium });
      }
    } catch (error) {
      console.error('Error fetching user status:', error);
    }
  };

  useEffect(() => {
    fetchCustomCommands();
    fetchUserStatus();
  }, []);

  const resetForm = () => {
    setFormData({ commandName: '', description: '', playlist: [''] });
    setShowCreateForm(false);
    setEditingCommand(null);
  };

  const addPlaylistItem = () => {
    setFormData(prev => ({
      ...prev,
      playlist: [...prev.playlist, '']
    }));
  };

  const removePlaylistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      playlist: prev.playlist.filter((_, i) => i !== index)
    }));
  };

  const updatePlaylistItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      playlist: prev.playlist.map((item, i) => i === index ? value : item)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty playlist items
    const filteredPlaylist = formData.playlist.filter(item => item.trim() !== '');
    
    if (!formData.commandName || filteredPlaylist.length === 0) {
      showError('Validation Error', 'Please provide a command name and at least one song');
      return;
    }

    // Validate playlist size for standard users
    if (!userStatus.isPremium) {
      if (filteredPlaylist.length > 8) {
        showWarning('Playlist Limit Exceeded', 'Standard users can have a maximum of 8 songs in their playlist. Upgrade to premium for unlimited songs!');
        return;
      }
    }

    setSubmitting(true);
    try {
      const url = editingCommand 
        ? `/api/custom-commands/${editingCommand.id}`
        : '/api/custom-commands';
      
      const method = editingCommand ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commandName: formData.commandName,
          description: formData.description,
          playlist: filteredPlaylist
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess('Command Saved!', data.message);
        resetForm();
        fetchCustomCommands();
      } else {
        showError('Failed to Save Command', data.error);
      }
    } catch (error) {
      showError('Network Error', 'Failed to save custom command. Please try again.');
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (command: CustomCommand) => {
    setEditingCommand(command);
    setFormData({
      commandName: command.displayName,
      description: command.description,
      playlist: [...command.playlist]
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (commandId: string, commandName: string) => {
    setDeleteModal({ isOpen: true, commandId, commandName });
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/custom-commands/${deleteModal.commandId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess('Command Deleted', data.message);
        fetchCustomCommands();
      } else {
        showError('Delete Failed', data.error);
      }
    } catch (error) {
      showError('Network Error', 'Failed to delete custom command. Please try again.');
      console.error('Error:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/20 rounded"></div>
            <div className="h-4 bg-white/20 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CommandLineIcon className="h-6 w-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Custom Playlist Commands</h2>
          {userStatus.isPremium && <PremiumBadge size="sm" />}
        </div>
        <button
          onClick={() => {
            // Check if standard user can create more commands
            if (!userStatus.isPremium && commands.length >= 1) {
              showWarning('Command Limit Reached', 'Standard users can only create 1 custom command. Upgrade to premium for unlimited commands!');
              return;
            }
            setShowCreateForm(!showCreateForm);
          }}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Create Command</span>
        </button>
      </div>

      {/* User Tier Information */}
      {!userStatus.isPremium && (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <MusicalNoteIcon className="h-5 w-5 text-amber-400 mt-0.5" />
            </div>
            <div>
              <h4 className="text-amber-300 font-semibold mb-1">Standard User Limits</h4>
              <ul className="text-amber-100 text-sm space-y-1">
                <li>• Maximum 1 custom command</li>
                <li>• Maximum 8 songs per playlist</li>
                <li>• Commands used: {commands.length}/1</li>
              </ul>
              <p className="text-amber-200 text-xs mt-2">
                Upgrade to premium for unlimited custom commands and playlist sizes!
              </p>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white/5 rounded-lg p-6 mb-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {editingCommand ? 'Edit Custom Command' : 'Create New Custom Command'}
            </h3>
            <button
              onClick={resetForm}
              className="text-white/60 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Command Name
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-white/60">!</span>
                <input
                  type="text"
                  value={formData.commandName}
                  onChange={(e) => setFormData({ ...formData, commandName: e.target.value })}
                  placeholder="myvibes"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  pattern="[a-zA-Z0-9_]+"
                  title="Only letters, numbers, and underscores allowed"
                />
              </div>
              <p className="text-xs text-white/50 mt-1">
                Only letters, numbers, and underscores. Users will type !{formData.commandName || 'commandname'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="My favorite chill vibes playlist"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-white/80">
                  Playlist ({formData.playlist.filter(item => item.trim()).length} songs)
                  {!userStatus.isPremium && (
                    <span className="text-amber-400 text-xs ml-2">(max 8 songs)</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    // Check playlist size limits for standard users
                    if (!userStatus.isPremium && formData.playlist.filter(item => item.trim()).length >= 8) {
                      showWarning('Playlist Limit Reached', 'Standard users can only have up to 8 songs in their playlist. Upgrade to premium for unlimited songs!');
                      return;
                    }
                    addPlaylistItem();
                  }}
                  className={`text-sm px-2 py-1 rounded transition-colors ${
                    !userStatus.isPremium && formData.playlist.filter(item => item.trim()).length >= 8
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  disabled={!userStatus.isPremium && formData.playlist.filter(item => item.trim()).length >= 8}
                >
                  + Add Song
                </button>
              </div>
              
              {/* Playlist size validation warning for standard users */}
              {!userStatus.isPremium && (
                <div className="mb-3">
                  {formData.playlist.filter(item => item.trim()).length >= 8 && (
                    <p className="text-amber-400 text-xs">
                      ⚠️ Standard users are limited to 8 songs. Upgrade to premium for unlimited songs!
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {formData.playlist.map((song, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-white/60 w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={song}
                      onChange={(e) => updatePlaylistItem(index, e.target.value)}
                      placeholder="Song name or YouTube URL"
                      className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {formData.playlist.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePlaylistItem(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/50 mt-1">
                Add song names or YouTube URLs. Each song will be queued when the command is used.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {submitting ? 'Saving...' : (editingCommand ? 'Update Command' : 'Create Command')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {commands.length === 0 ? (
        <div className="text-center py-8">
          <CommandLineIcon className="h-12 w-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60 mb-2">No custom commands yet</p>
          <p className="text-white/40 text-sm">Create your first custom playlist command!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commands.map((command) => (
            <div
              key={command.id}
              className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-400/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono text-purple-400 font-bold">!{command.displayName}</span>
                    <PlayIcon className="h-4 w-4 text-green-400" />
                  </div>
                  {command.description && (
                    <p className="text-sm text-white/70 mb-2">{command.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-white/50">
                    <span>{command.playlist.length} songs</span>
                    <span>Created {formatDate(command.createdAt)}</span>
                    <span>Used {command.usageCount} times</span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(command)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
                    title="Edit Command"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(command.id, command.displayName)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
                    title="Delete Command"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-3">
                <h4 className="text-sm font-medium text-white/80 mb-2 flex items-center">
                  <MusicalNoteIcon className="h-4 w-4 mr-1" />
                  Playlist Preview
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {command.playlist.slice(0, 5).map((song, index) => (
                    <div key={index} className="text-xs text-white/60 truncate">
                      {index + 1}. {song}
                    </div>
                  ))}
                  {command.playlist.length > 5 && (
                    <div className="text-xs text-white/40">
                      +{command.playlist.length - 5} more songs...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, commandId: '', commandName: '' })}
        onConfirm={confirmDelete}
        title="Delete Custom Command"
        message={`Are you sure you want to delete the command '!${deleteModal.commandName}'? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
