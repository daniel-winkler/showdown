import { Socket } from 'socket.io';
import { roomService } from '../services/RoomService.js';
import type {
  CreateRoomPayload,
  RoomCreatedResponse,
  SOCKET_EVENTS,
} from '../../shared/types.js';

export function registerRoomHandlers(socket: Socket) {
  // Handle room creation
  socket.on('create-room', (payload: CreateRoomPayload, callback) => {
    try {
      console.log(`📝 Create room request from: ${payload.userName}`);

      // Validate payload
      if (!payload.userName?.trim()) {
        const response: RoomCreatedResponse = {
          success: false,
          error: 'User name is required',
        };
        callback(response);
        return;
      }

      if (!payload.roundNames || payload.roundNames.length === 0) {
        const response: RoomCreatedResponse = {
          success: false,
          error: 'At least one round is required',
        };
        callback(response);
        return;
      }

      // Create the room
      const { room, userId } = roomService.createRoom(payload);

      // Join the socket to the room (for broadcasting)
      socket.join(room.id);

      // Send success response
      const response: RoomCreatedResponse = {
        success: true,
        room,
        userId,
      };
      callback(response);

      console.log(`✅ Room ${room.id} created successfully`);
    } catch (error) {
      console.error('Error creating room:', error);
      const response: RoomCreatedResponse = {
        success: false,
        error: 'Failed to create room',
      };
      callback(response);
    }
  });
}
