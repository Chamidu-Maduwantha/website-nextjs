import React, { useState, useEffect } from 'react';
import { WrenchScrewdriverIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';

const DevModeToggle = () => {
  const [devMode, setDevMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const { showSuccess, showError } = useToast();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: '', message: '' });

  useEffect(() => {
    fetchDevModeStatus();
  }, []);

  const fetchDevModeStatus = async () => {
    try {
      const response = await fetch('/api/admin/devmode-status');
      if (response.ok) {
        const data = await response.json();
        setDevMode(data.devMode);
      }
    } catch (error) {
      console.error('Error fetching dev mode status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDevMode = async () => {
    const action = devMode ? 'disable' : 'enable';
    const message = devMode 
      ? 'Are you sure you want to switch to Production mode? This will allow all users to execute commands normally.'
      : 'Are you sure you want to switch to Maintenance mode? This will restrict command access to developers only and show maintenance messages to regular users.';
    
    setConfirmModal({ 
      isOpen: true, 
      action: action,
      message: `${message}\n\nDevelopers will receive a Discord notification about this change.`
    });
  };

  const confirmToggle = async () => {
    setToggling(true);
    try {
      const response = await fetch('/api/admin/devmode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !devMode }),
      });

      if (response.ok) {
        const data = await response.json();
        setDevMode(data.enabled);
        
        // Show success message
        showSuccess('Mode Changed', `${data.message}\n\nDevelopers have been notified via Discord DM.`);
      } else {
        const error = await response.json();
        showError('Failed to Change Mode', error.error);
      }
    } catch (error) {
      console.error('Error toggling dev mode:', error);
      showError('Network Error', 'Failed to toggle dev mode. Please try again.');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <WrenchScrewdriverIcon className="h-6 w-6 mr-2 text-blue-400" />
          Development Mode
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          devMode 
            ? 'bg-orange-600 text-orange-100' 
            : 'bg-green-600 text-green-100'
        }`}>
          {devMode ? 'MAINTENANCE' : 'PRODUCTION'}
        </div>
      </div>

      <div className="mb-4">
        <div className={`p-4 rounded-lg border ${
          devMode 
            ? 'bg-orange-900/20 border-orange-600/50' 
            : 'bg-green-900/20 border-green-600/50'
        }`}>
          {devMode ? (
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-200">Bot is in Maintenance Mode</h4>
                <p className="text-sm text-orange-300 mt-1">
                  Only developers and admins can execute commands. Regular users will see a maintenance message.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-3">
              <div className="h-5 w-5 bg-green-400 rounded-full mt-0.5"></div>
              <div>
                <h4 className="font-medium text-green-200">Bot is in Production Mode</h4>
                <p className="text-sm text-green-300 mt-1">
                  All users can execute commands normally. Bot is fully operational.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Toggle development mode to control access during updates
        </div>
        <button
          onClick={toggleDevMode}
          disabled={toggling}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            devMode
              ? 'bg-green-600 hover:bg-green-700 text-green-100'
              : 'bg-orange-600 hover:bg-orange-700 text-orange-100'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {toggling ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Toggling...
            </span>
          ) : (
            `Switch to ${devMode ? 'Production' : 'Maintenance'}`
          )}
        </button>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: '', message: '' })}
        onConfirm={confirmToggle}
        title={`Switch to ${devMode ? 'Production' : 'Maintenance'} Mode`}
        message={confirmModal.message}
        confirmText="Switch Mode"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default DevModeToggle;
