import { v4 as uuidv4 } from 'uuid';
import type {
  Room,
  Round,
  Participant,
  CreateRoomPayload,
  RoomSettings,
} from '../../../shared/types';

// Default settings
const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  anonymous: false,
  cardValues: [0.5, 1, 3, 5, 8, 13, 21, '☕', '?'],
};

class RoomService {
  private rooms: Map<string, Room> = new Map();
  private readonly ROOM_EXPIRATION_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

  constructor() {
    // Start cleanup job that runs every hour
    this.startCleanupJob();
  }

  /**
   * Starts the automatic cleanup job
   */
  private startCleanupJob(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupExpiredRooms();
    }, 60 * 60 * 1000); // 1 hour

    console.log('🧹 Room cleanup job started (runs every hour)');
  }

  /**
   * Cleans up rooms that have been inactive for more than 12 hours
   */
  private cleanupExpiredRooms(): void {
    const now = Date.now();
    const expiredRooms: string[] = [];

    for (const [roomId, room] of this.rooms.entries()) {
      const roomAge = now - new Date(room.createdAt).getTime();
      
      if (roomAge > this.ROOM_EXPIRATION_MS) {
        expiredRooms.push(roomId);
      }
    }

    if (expiredRooms.length > 0) {
      expiredRooms.forEach(roomId => {
        this.rooms.delete(roomId);
        console.log(`🗑️  Deleted expired room: ${roomId}`);
      });
      console.log(`🧹 Cleanup complete: ${expiredRooms.length} room(s) deleted`);
    } else {
      console.log('🧹 Cleanup complete: No expired rooms found');
    }
  }

  /**
   * Creates a new room
   */
  createRoom(payload: CreateRoomPayload): { room: Room; userId: string } {
    const roomId = uuidv4();
    const userId = uuidv4();

    // Create creator participant
    const creator: Participant = {
      id: userId,
      name: payload.userName,
      isCreator: true,
      connectedAt: new Date(),
      isOnline: true,
      socketId: undefined, // Will be set when socket joins
    };

    // Create rounds
    const rounds: Round[] = payload.roundNames.map((name) => ({
      id: uuidv4(),
      name,
      status: 'voting' as const,
      votes: [],
    }));

    // Merge default settings with user settings
    const settings: RoomSettings = {
      ...DEFAULT_ROOM_SETTINGS,
      ...payload.settings,
    };

    // Create room
    const room: Room = {
      id: roomId,
      name: payload.roomName,
      createdBy: userId,
      createdAt: new Date(),
      settings,
      rounds,
      currentRoundIndex: 0,
      status: 'waiting',
      participants: [creator],
    };

    this.rooms.set(roomId, room);
    console.log(`✅ Room created: ${roomId} by ${payload.userName}`);

    return { room, userId };
  }

  /**
   * Gets a room by ID
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Gets all rooms (for debugging)
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Deletes a room
   */
  deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  /**
   * Adds a participant to a room
   */
  addParticipant(roomId: string, userName: string): { room: Room; userId: string } | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    // Check if participant with this name already exists
    const existingParticipant = room.participants.find(p => p.name === userName);
    if (existingParticipant) {
      console.log(`ℹ️  ${userName} already in room: ${roomId}, returning existing user`);
      // Mark as online when rejoining
      existingParticipant.isOnline = true;
      return { room, userId: existingParticipant.id };
    }

    // Generate new user ID
    const userId = uuidv4();

    // Create participant
    const participant: Participant = {
      id: userId,
      name: userName,
      isCreator: false,
      connectedAt: new Date(),
      isOnline: true,
      socketId: undefined,
    };

    // Add to participants list
    room.participants.push(participant);

    console.log(`✅ ${userName} joined room: ${roomId}`);

    return { room, userId };
  }

  /**
   * Removes a participant from a room
   */
  removeParticipant(roomId: string, userId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    room.participants = room.participants.filter((p) => p.id !== userId);
    console.log(`👋 User ${userId} left room: ${roomId}`);

    return room;
  }

  /**
   * Marks a participant as online and updates their socket ID
   */
  setParticipantOnline(roomId: string, userId: string, socketId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const participant = room.participants.find(p => p.id === userId);
    if (participant) {
      participant.isOnline = true;
      participant.socketId = socketId;
    }

    return room;
  }

  /**
   * Marks a participant as offline
   */
  setParticipantOffline(roomId: string, socketId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const participant = room.participants.find(p => p.socketId === socketId);
    if (participant) {
      participant.isOnline = false;
      participant.socketId = undefined;
      console.log(`🔌 ${participant.name} went offline in room ${roomId}`);
    }

    return room;
  }

  /**
   * Submits a vote for the current round
   */
  submitVote(roomId: string, userId: string, vote: number | string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    const currentRound = room.rounds[room.currentRoundIndex];
    if (!currentRound) {
      return null;
    }

    // Find participant
    const participant = room.participants.find((p) => p.id === userId);
    if (!participant) {
      return null;
    }

    // Check if user already voted, update or add
    const existingVoteIndex = currentRound.votes.findIndex((v) => v.userId === userId);
    const voteData = {
      userId,
      userName: participant.name,
      value: vote,
      votedAt: new Date(),
    };

    if (existingVoteIndex >= 0) {
      currentRound.votes[existingVoteIndex] = voteData;
    } else {
      currentRound.votes.push(voteData);
    }

    console.log(`🗳️  ${participant.name} voted ${vote} in room ${roomId}`);

    // Check if all participants have voted
    if (currentRound.votes.length === room.participants.length && room.status === 'waiting') {
      room.status = 'active';
    }

    return room;
  }

  /**
   * Checks if all participants in a room have voted
   */
  allVoted(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const currentRound = room.rounds[room.currentRoundIndex];
    if (!currentRound) return false;

    return currentRound.votes.length === room.participants.length;
  }

  /**
   * Reveals votes for the current round
   */
  revealVotes(roomId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    const currentRound = room.rounds[room.currentRoundIndex];
    if (!currentRound) {
      return null;
    }

    currentRound.status = 'revealed';
    currentRound.revealedAt = new Date();

    console.log(`👁️  Votes revealed for room ${roomId}`);

    return room;
  }

  /**
   * Advances to the next round
   */
  nextRound(roomId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    // Check if there are more rounds
    if (room.currentRoundIndex >= room.rounds.length - 1) {
      // Last round - mark room as completed
      room.status = 'completed';
      console.log(`🏁 All rounds completed in room ${roomId}`);
      return room;
    }

    // Move to next round
    room.currentRoundIndex++;
    const nextRound = room.rounds[room.currentRoundIndex];
    
    // Reset round status to voting
    nextRound.status = 'voting';
    nextRound.votes = [];

    console.log(`➡️  Moved to round ${room.currentRoundIndex + 1} in room ${roomId}`);

    return room;
  }
}

// Export singleton instance
export const roomService = new RoomService();
