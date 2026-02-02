import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../services/socket';
import { StorageService } from '../utils/storage';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(StorageService.getUserName() || '');
  const [roomName, setRoomName] = useState('');
  const [roundsText, setRoundsText] = useState('Round 1\nRound 2\nRound 3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    // Parse rounds from textarea
    const rounds = roundsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (rounds.length === 0) {
      setError('Please enter at least one round');
      return;
    }

    setLoading(true);

    try {
      const response = await socketService.createRoom({
        userName: userName.trim(),
        roomName: roomName.trim() || undefined,
        roundNames: rounds.map(name => name || 'Untitled Round'),
      });

      if (response.success && response.room && response.userId) {
        // Save user info to localStorage
        StorageService.saveUserName(userName.trim());
        StorageService.saveUserId(response.userId);
        StorageService.addRecentRoom(response.room.id);

        // Navigate to room
        navigate(`/room/${response.room.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Create Planning Poker Room
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Set up your estimation session
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Name */}
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
                required
              />
            </div>

            {/* Room Name (Optional) */}
            <div>
              <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
                Room Name (Optional)
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., Sprint 24 Planning"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Rounds */}
            <div>
              <label htmlFor="rounds" className="block text-sm font-medium text-gray-700 mb-2">
                Rounds (one per line) *
              </label>
              <textarea
                id="rounds"
                value={roundsText}
                onChange={(e) => setRoundsText(e.target.value)}
                placeholder="Round 1&#10;Round 2&#10;Round 3"
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {roundsText.split('\n').filter(line => line.trim().length > 0).length} round(s)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Room...' : 'Create Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
