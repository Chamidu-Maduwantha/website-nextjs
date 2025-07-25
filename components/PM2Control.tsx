import React, { useState, useEffect } from 'react';
import { 
  ArrowPathIcon, 
  StopIcon, 
  PlayIcon, 
  InformationCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';

const PM2Control = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const { showSuccess, showError } = useToast();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: '', message: '' });

  useEffect(() => {
    // Fetch initial status with error handling
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pm2-restart-ec2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'status' }),
      });

      const data = await response.json();
      if (data.success) {
        setStatus(data.output);
      } else {
        console.error('PM2 status error:', data.error);
        setStatus('Unable to fetch PM2 status. PM2 controls are still available.');
      }
    } catch (error) {
      console.error('Error fetching PM2 status:', error);
      setStatus('PM2 status unavailable. Controls are still functional.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pm2-restart-ec2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'logs' }),
      });

      const data = await response.json();
      if (data.success) {
        setLogs(data.output);
        setShowLogs(true);
      } else {
        showError(data.error || 'Failed to fetch logs');
      }
    } catch (error) {
      showError('Error fetching bot logs');
      console.error('Error fetching PM2 logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action) => {
    let actionText, confirmMessage;
    
    switch (action) {
      case 'restart':
        actionText = 'Restart Bot';
        confirmMessage = 'Are you sure you want to restart the bot? This will temporarily disconnect it from all voice channels and interrupt any ongoing music playback.';
        break;
      case 'stop':
        actionText = 'Stop Bot';
        confirmMessage = 'Are you sure you want to stop the bot? This will make it completely offline until manually started again.';
        break;
      case 'start':
        actionText = 'Start Bot';
        confirmMessage = 'Are you sure you want to start the bot?';
        break;
      default:
        return;
    }

    setConfirmModal({
      isOpen: true,
      action: action,
      message: confirmMessage
    });
  };

  const confirmAction = async () => {
    const action = confirmModal.action;
    setLoading(true);
    setConfirmModal({ isOpen: false, action: '', message: '' });

    try {
      const response = await fetch('/api/admin/pm2-restart-ec2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess(data.message);
        // Refresh status after action
        setTimeout(() => {
          fetchStatus();
        }, 2000);
      } else {
        // Handle PM2 not installed error specially
        if (data.error === 'PM2 not installed') {
          showError('PM2 not installed on this system. Check console for installation instructions.');
          console.error('PM2 Installation Required:');
          console.error('Run this command to install PM2 globally:');
          console.error('npm install -g pm2');
          console.error('');
          console.error('Alternative solutions:');
          if (data.suggestions) {
            data.suggestions.forEach((suggestion, index) => {
              console.error(`${index + 1}. ${suggestion}`);
            });
          }
        } else {
          showError(data.error || `Failed to ${action} bot`);
        }
        
        if (data.stderr) {
          console.error('PM2 stderr:', data.stderr);
        }
      }
    } catch (error) {
      showError(`Error ${action}ing bot`);
      console.error(`Error ${action}ing bot:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-discord-secondary rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <ArrowPathIcon className="h-6 w-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">PM2 Bot Control</h3>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="bg-discord-primary hover:bg-discord-primary-dark text-white px-3 py-1 rounded-md disabled:opacity-50 transition-colors duration-200 text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Status Display */}
      {status && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-white/70 mb-2">Bot Status:</h4>
          <pre className="bg-discord-dark text-white/80 p-3 rounded-md text-xs overflow-x-auto">
            {status}
          </pre>
        </div>
      )}

      {/* Control Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <button
          onClick={() => executeAction('restart')}
          disabled={loading}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md disabled:opacity-50 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <ArrowPathIcon className="h-4 w-4" />
          <span>Restart</span>
        </button>

        <button
          onClick={() => executeAction('stop')}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <StopIcon className="h-4 w-4" />
          <span>Stop</span>
        </button>

        <button
          onClick={() => executeAction('start')}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <PlayIcon className="h-4 w-4" />
          <span>Start</span>
        </button>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="bg-discord-primary hover:bg-discord-primary-dark text-white px-4 py-2 rounded-md disabled:opacity-50 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <DocumentTextIcon className="h-4 w-4" />
          <span>Logs</span>
        </button>
      </div>

      {/* Warning */}
      <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-md p-3">
        <div className="flex items-start space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 text-sm font-medium">Warning</p>
            <p className="text-yellow-300/80 text-xs">
              Restarting or stopping the bot will affect all users currently using it. 
              Use these controls responsibly.
            </p>
          </div>
        </div>
      </div>

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-discord-secondary rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-discord-dark">
              <h3 className="text-lg font-semibold text-white">Bot Logs (Last 20 lines)</h3>
              <button
                onClick={() => setShowLogs(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <pre className="bg-discord-dark text-white/80 p-4 rounded-md text-xs overflow-x-auto">
                {logs || 'No logs available'}
              </pre>
            </div>
            <div className="p-4 border-t border-discord-dark">
              <button
                onClick={() => setShowLogs(false)}
                className="bg-discord-primary hover:bg-discord-primary-dark text-white px-4 py-2 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={`${confirmModal.action?.charAt(0).toUpperCase() + confirmModal.action?.slice(1)} Bot`}
        message={confirmModal.message}
        onConfirm={confirmAction}
        onClose={() => setConfirmModal({ isOpen: false, action: '', message: '' })}
        confirmText={confirmModal.action?.charAt(0).toUpperCase() + confirmModal.action?.slice(1)}
        type={confirmModal.action === 'stop' || confirmModal.action === 'restart' ? 'danger' : 'warning'}
      />
    </div>
  );
};

export default PM2Control;
