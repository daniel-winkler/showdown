import { Socket } from 'socket.io';
import { roomService } from '../services/RoomService.js';
import type {
  CreateRoomPayload,
  RoomCreatedResponse,
  JoinRoomPayload,
  JoinRoomResponse,
} from '../../../shared/types';

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

  // Handle joining a room
  socket.on('join-room', (payload: JoinRoomPayload, callback) => {
    try {
      console.log(`🚪 Join room request: ${payload.userName} → ${payload.roomId}`);

      // Validate payload
      if (!payload.userName?.trim()) {
        const response: JoinRoomResponse = {
          success: false,
          error: 'User name is required',
        };
        callback(response);
        return;
      }

      if (!payload.roomId?.trim()) {
        const response: JoinRoomResponse = {
          success: false,
          error: 'Room ID is required',
        };
        callback(response);
        return;
      }

      // Check if room exists
      const existingRoom = roomService.getRoom(payload.roomId);
      if (!existingRoom) {
        const response: JoinRoomResponse = {
          success: false,
          error: 'Room not found',
        };
        callback(response);
        return;
      }

      // Add participant to room
      const result = roomService.addParticipant(payload.roomId, payload.userName.trim());
      if (!result) {
        const response: JoinRoomResponse = {
          success: false,
          error: 'Failed to join room',
        };
        callback(response);
        return;
      }

      const { room, userId } = result;

      // Join the socket to the room
      socket.join(room.id);

      // Notify everyone in the room about the new participant
      socket.to(room.id).emit('user-joined', {
        userId,
        userName: payload.userName.trim(),
      });

      // Send success response
      const response: JoinRoomResponse = {
        success: true,
        room,
        userId,
      };
      callback(response);

      console.log(`✅ ${payload.userName} joined room ${room.id}`);
    } catch (error) {
      console.error('Error joining room:', error);
      const response: JoinRoomResponse = {
        success: false,
        error: 'Failed to join room',
      };
      callback(response);
    }
  });
}
