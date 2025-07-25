import React from 'react';

const PM2ControlSimple = () => {
  console.log('PM2ControlSimple component is rendering');
  
  return (
    <div className="bg-discord-secondary rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">🔧 PM2 Bot Control (Test)</h3>
      <p className="text-white/70">PM2 control component is working!</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md">
          Restart
        </button>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
          Stop
        </button>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
          Start
        </button>
        <button className="bg-discord-primary hover:bg-discord-primary-dark text-white px-4 py-2 rounded-md">
          Logs
        </button>
      </div>
    </div>
  );
};

export default PM2ControlSimple;
