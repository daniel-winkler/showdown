import { Socket, Server } from 'socket.io';
import { roomService } from '../services/RoomService.js';
import type {
  CreateRoomPayload,
  RoomCreatedResponse,
  JoinRoomPayload,
  JoinRoomResponse,
  SubmitVotePayload,
  RoomUpdatePayload,
  NextRoundPayload,
} from '../types.js';

export function registerRoomHandlers(socket: Socket, io: Server) {
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
      console.log(`🔌 Socket ${socket.id} joined room ${room.id}`);

      // Mark participant as online with their socket ID
      roomService.setParticipantOnline(room.id, userId, socket.id);

      // Broadcast updated room state to all participants (including the joiner)
      const updatePayload: RoomUpdatePayload = { room };
      io.to(room.id).emit('room-update', updatePayload);

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

  // Handle vote submission
  socket.on('submit-vote', (payload: SubmitVotePayload) => {
    try {
      console.log(`🗳️  Vote submission: User in room ${payload.roomId}`);

      // Submit vote
      const room = roomService.submitVote(payload.roomId, payload.userId, payload.vote);
      if (!room) {
        socket.emit('error', { message: 'Failed to submit vote' });
        return;
      }

      console.log(`📢 Broadcasting vote update to room ${payload.roomId}`);

      // Broadcast room update to all participants
      const updatePayload: RoomUpdatePayload = { room };
      io.to(payload.roomId).emit('room-update', updatePayload);

      // Log if all participants have voted (host can now reveal)
      if (roomService.allVoted(payload.roomId)) {
        console.log(`✅ All participants voted in room ${payload.roomId} - waiting for host to reveal`);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      socket.emit('error', { message: 'Failed to submit vote' });
    }
  });

  // Handle reveal votes (host only)
  socket.on('reveal-votes', (payload: { roomId: string; userId: string }) => {
    try {
      console.log(`👁️  Reveal votes request for room ${payload.roomId}`);

      // Get the room
      const room = roomService.getRoom(payload.roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Check if the user is the creator (host)
      const participant = room.participants.find(p => p.id === payload.userId);
      if (!participant || !participant.isCreator) {
        socket.emit('error', { message: 'Only the host can reveal votes' });
        return;
      }

      // Reveal votes
      const updatedRoom = roomService.revealVotes(payload.roomId);
      if (updatedRoom) {
        console.log(`✅ Votes revealed for room ${payload.roomId}`);
        const revealPayload: RoomUpdatePayload = { room: updatedRoom };
        io.to(payload.roomId).emit('room-update', revealPayload);
      }
    } catch (error) {
      console.error('Error revealing votes:', error);
      socket.emit('error', { message: 'Failed to reveal votes' });
    }
  });

  // Handle next round (host only)
  socket.on('next-round', (payload: NextRoundPayload) => {
    try {
      console.log(`➡️  Next round request for room ${payload.roomId}`);

      // Get the room
      const room = roomService.getRoom(payload.roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Check if the user is the creator (host)
      const participant = room.participants.find(p => p.id === payload.userId);
      if (!participant || !participant.isCreator) {
        socket.emit('error', { message: 'Only the host can move to next round' });
        return;
      }

      // Move to next round
      const updatedRoom = roomService.nextRound(payload.roomId);
      if (updatedRoom) {
        console.log(`✅ Moved to next round in room ${payload.roomId}`);
        const updatePayload: RoomUpdatePayload = { room: updatedRoom };
        io.to(payload.roomId).emit('room-update', updatePayload);
      }
    } catch (error) {
      console.error('Error moving to next round:', error);
      socket.emit('error', { message: 'Failed to move to next round' });
    }
  });
}
