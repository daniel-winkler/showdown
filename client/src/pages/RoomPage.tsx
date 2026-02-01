import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socketService } from '../services/socket';
import { StorageService } from '../utils/storage';
import type { Room } from '@shared/types';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [userName, setUserName] = useState(StorageService.getUserName() || '');
  const [joiningRoom, setJoiningRoom] = useState(false);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // Check if user already has a name saved
    const savedName = StorageService.getUserName();
    const savedUserId = StorageService.getUserId();

    if (savedName && savedUserId) {
      // Try to join the room automatically
      joinRoom(savedName);
    } else {
      // Show name input modal
      setShowNameModal(true);
      setLoading(false);
    }
  }, [roomId]);

  const joinRoom = async (name: string) => {
    if (!roomId) return;

    setJoiningRoom(true);
    setError('');

    try {
      const response = await socketService.joinRoom({
        roomId,
        userName: name.trim(),
      });

      if (response.success && response.room && response.userId) {
        setRoom(response.room);
        StorageService.saveUserName(name.trim());
        StorageService.saveUserId(response.userId);
        StorageService.addRecentRoom(roomId);
        setShowNameModal(false);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
      setLoading(false);
      setJoiningRoom(false);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    joinRoom(userName);
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    // TODO: Show toast notification
    alert('Link copied to clipboard!');
  };

  // Name input modal
  if (showNameModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Join Planning Poker</h2>
          <p className="text-gray-600 mb-6">Enter your name to join the room</p>

          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={joiningRoom}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joiningRoom ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room...</p>
        </div>
      </div>
    );
  }

  // Error state (room not found or join failed)
  if (error && !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Room Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
          >
            Create New Room
          </button>
        </div>
      </div>
    );
  }

  // Room loaded successfully
  if (!room) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {room.name || 'Planning Poker Room'}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Round {room.currentRoundIndex + 1} of {room.rounds.length}: {room.rounds[room.currentRoundIndex]?.name}
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 text-sm"
            >
              📋 Copy Room Link
            </button>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Participants ({room.participants.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {room.participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {participant.name}
                    {participant.isCreator && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                        Host
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voting area - Coming in next commits */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-center">
            Voting interface coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
