import { v4 as uuidv4 } from 'uuid';
import type {
  Room,
  Round,
  Participant,
  CreateRoomPayload,
  RoomSettings,
  DEFAULT_ROOM_SETTINGS,
} from '../../shared/types.js';

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
}

// Export singleton instance
export const roomService = new RoomService();
