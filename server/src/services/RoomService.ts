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
  cardValues: [1, 3, 5, 8, 13, 21],
};

class RoomService {
  private rooms: Map<string, Room> = new Map();

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

    // Generate new user ID
    const userId = uuidv4();

    // Create participant
    const participant: Participant = {
      id: userId,
      name: userName,
      isCreator: false,
      connectedAt: new Date(),
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
}

// Export singleton instance
export const roomService = new RoomService();
