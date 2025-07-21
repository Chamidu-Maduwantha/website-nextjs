import { useState } from 'react';

export default function MaintenanceToggle() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const toggleMaintenance = async (maintenanceMode: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maintenanceMode }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.message);
        // Refresh the page to see changes
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setStatus('Error updating maintenance mode');
      }
    } catch (error) {
      setStatus('Error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
      <h3 className="text-white font-medium mb-4">🔧 Manual Maintenance Control (Testing)</h3>
      <div className="space-y-3">
        <div className="flex gap-3">
          <button
            onClick={() => toggleMaintenance(true)}
            disabled={loading}
            className="px-4 py-2 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 disabled:opacity-50"
          >
            Enable Maintenance
          </button>
          <button
            onClick={() => toggleMaintenance(false)}
            disabled={loading}
            className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 disabled:opacity-50"
          >
            Disable Maintenance
          </button>
        </div>
        {status && (
          <p className="text-white/80 text-sm">{status}</p>
        )}
        <p className="text-white/60 text-xs">
          This manually overrides the maintenance status for testing. 
          The bot's dev mode status will override this when the bot restarts.
        </p>
      </div>
    </div>
  );
}
