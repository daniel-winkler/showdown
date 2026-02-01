import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { socketService } from './services/socket';
import './index.css';

function App() {
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState<string>('');

  useEffect(() => {
    const socket = socketService.connect();

    socket.on('connect', () => {
      setConnected(true);
      setSocketId(socket.id || '');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setSocketId('');
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          PlannitPoker
        </h1>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
            <span className="text-gray-700 font-medium">Connection Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              connected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {connected && socketId && (
            <div className="p-4 rounded-lg bg-blue-50">
              <p className="text-sm text-gray-600 mb-1">Socket ID:</p>
              <p className="text-xs font-mono text-gray-800 break-all">
                {socketId}
              </p>
            </div>
          )}

          <div className="text-center text-gray-500 text-sm mt-6">
            Frontend and backend connected successfully!
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
