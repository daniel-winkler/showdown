import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socketService } from '../services/socket';
import { StorageService } from '../utils/storage';
import VotingResults from '../components/VotingResults';
import type { Room, RoomUpdatePayload } from '@shared/types';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [userName, setUserName] = useState(StorageService.getUserName() || '');
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // Wait for socket to connect before joining
    const attemptJoin = () => {
      if (!socketService.isConnected()) {
        console.log('Waiting for socket connection...');
        setTimeout(attemptJoin, 100); // Retry after 100ms
        return;
      }

      // Socket is connected, set up listeners first
      console.log('Socket connected, setting up listeners');
      
      // Listen for room updates
      socketService.onRoomUpdate((payload: RoomUpdatePayload) => {
        console.log('📡 Room update received:', payload.room);
        setRoom(payload.room);
        
        // Reset selected card when moving to a new voting round
        const currentRound = payload.room.rounds[payload.room.currentRoundIndex];
        if (currentRound?.status === 'voting' && currentRound.votes.length === 0) {
          setSelectedCard(null);
        }
      });

      // Listen for new users joining
      socketService.onUserJoined((data) => {
        console.log(`👋 ${data.userName} joined the room`);
      });

      // Now proceed with join logic
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
    };

    attemptJoin();

    // Cleanup listeners on unmount
    return () => {
      socketService.removeAllListeners();
    };
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
        setCurrentUserId(response.userId);
        StorageService.saveUserName(name.trim());
        StorageService.saveUserId(response.userId);
        StorageService.addRecentRoom(roomId);
        setShowNameModal(false);
        setLoading(false);
        
        // Restore selected card if user already voted
        const currentRound = response.room.rounds[response.room.currentRoundIndex];
        const existingVote = currentRound?.votes.find(v => v.userId === response.userId);
        if (existingVote) {
          setSelectedCard(existingVote.value);
        }
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
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000); // Reset after 2 seconds
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

  const currentRound = room.rounds[room.currentRoundIndex];

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
                Round {room.currentRoundIndex + 1} of {room.rounds.length}: {currentRound?.name}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/')}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 text-sm"
              >
                + New Room
              </button>
              <button
                onClick={handleCopyLink}
                className={`font-semibold py-2 px-4 rounded-lg transition duration-200 text-sm ${
                  linkCopied
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {linkCopied ? '✓ Copied!' : '📋 Copy Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Participants ({room.participants.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {room.participants.map((participant) => {
              const hasVoted = currentRound?.votes.some(v => v.userId === participant.id);
              const isCurrentUser = participant.id === currentUserId;
              
              return (
                <div
                  key={participant.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrentUser 
                      ? 'bg-blue-50' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-3 relative ${
                      isCurrentUser ? 'bg-blue-600' : 'bg-blue-500'
                    }`}>
                      {participant.name.charAt(0).toUpperCase()}
                      {/* Online status indicator */}
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          participant.isOnline ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={participant.isOnline ? 'Online' : 'Offline'}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {participant.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                            You
                          </span>
                        )}
                        {participant.isCreator && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            Host
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {hasVoted && (
                    <span className="text-green-600 text-xl">✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Voting Area */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {room.status === 'completed' ? (
            <div className="text-center py-8">
              <p className="text-green-600 font-semibold text-2xl mb-2">🎉 All Rounds Complete!</p>
              <p className="text-gray-600">Session has ended</p>
            </div>
          ) : currentRound?.status === 'voting' ? (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Select Your Card
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                {room.settings.cardValues.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleCardSelect(value)}
                    className={`w-20 h-28 rounded-lg border-2 flex items-center justify-center text-3xl font-bold transition-all duration-200 hover:scale-105 ${
                      selectedCard === value
                        ? 'border-blue-600 bg-blue-500 text-white shadow-lg scale-105'
                        : 'border-gray-300 bg-white text-gray-800 hover:border-blue-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <p className="text-center text-gray-600 mt-4 text-sm">
                {selectedCard !== null ? `You selected: ${selectedCard}` : 'Choose a card to vote'}
              </p>

              {/* Host Controls (Show Results + Skip) */}
              {isCurrentUserHost() && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex gap-3">
                    {/* Show Results Button */}
                    <button
                      onClick={() => socketService.revealVotes({ roomId: roomId!, userId: currentUserId! })}
                      disabled={currentRound?.votes.length === 0}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">👁️</span>
                      Show Results
                    </button>
                    
                    {/* Skip Button */}
                    <button
                      onClick={handleSkipRound}
                      disabled={isSkipping}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-600 disabled:cursor-wait text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                    >
                      {isSkipping ? (
                        <>
                          <span className="text-xl">🔄</span>
                          Skipping...
                        </>
                      ) : (
                        <>
                          <span className="text-xl">⏩</span>
                          Skip Round
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-center text-gray-500 text-sm mt-2">
                    {currentRound.votes.length} / {room.participants.length} participants have voted
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <VotingResults votes={currentRound?.votes || []} />
              
              {/* Next Round Button (Host Only) */}
              {isCurrentUserHost() && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  {room.currentRoundIndex < room.rounds.length - 1 ? (
                    <button
                      onClick={() => socketService.nextRound({ roomId: roomId!, userId: currentUserId! })}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                    >
                      Next Round →
                    </button>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-green-600 font-semibold text-lg">🎉 All Rounds Complete!</p>
                      <p className="text-gray-600 text-sm mt-2">Session has ended</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  function isCurrentUserHost(): boolean {
    return room?.participants.find(p => p.id === currentUserId)?.isCreator || false;
  }

  function handleCardSelect(value: number | string) {
    if (!roomId || !currentUserId) return;
    
    setSelectedCard(value);
    socketService.submitVote({
      roomId,
      userId: currentUserId,
      vote: value,
    });
  }

  function handleSkipRound() {
    if (!roomId || !currentUserId || isSkipping) return;
    
    setIsSkipping(true);
    
    // Add a small delay for visual feedback
    setTimeout(() => {
      socketService.nextRound({ roomId, userId: currentUserId });
      // Reset skipping state after a bit
      setTimeout(() => setIsSkipping(false), 500);
    }, 300);
  }
}
