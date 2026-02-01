import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { socketService } from './services/socket';
import CreateRoom from './pages/CreateRoom';
import RoomPage from './pages/RoomPage';

export default function App() {
  useEffect(() => {
    // Connect to server on app mount
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateRoom />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
