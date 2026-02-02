import { io, Socket } from 'socket.io-client';
import type { 
  CreateRoomPayload, 
  RoomCreatedResponse,
  JoinRoomPayload,
  JoinRoomResponse,
  SubmitVotePayload,
  RoomUpdatePayload,
} from '@shared/types';

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;

  connect(url?: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Connect directly to backend in development, use env variable in production
    const socketUrl = url || import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket?.id);
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      this.connected = false;
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  /**
   * Creates a new room
   */
  createRoom(payload: CreateRoomPayload): Promise<RoomCreatedResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('create-room', payload, (response: RoomCreatedResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to create room'));
        }
      });
    });
  }

  /**
   * Joins an existing room
   */
  joinRoom(payload: JoinRoomPayload): Promise<JoinRoomResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('join-room', payload, (response: JoinRoomResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }

  /**
   * Submits a vote for the current round
   */
  submitVote(payload: SubmitVotePayload): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('submit-vote', payload);
  }

  /**
   * Reveals votes for the current round (host only)
   */
  revealVotes(payload: { roomId: string; userId: string }): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('reveal-votes', payload);
  }

  /**
   * Listens for room updates
   */
  onRoomUpdate(callback: (payload: RoomUpdatePayload) => void): void {
    if (!this.socket) return;
    this.socket.on('room-update', callback);
  }

  /**
   * Listens for user joined events
   */
  onUserJoined(callback: (data: { userId: string; userName: string }) => void): void {
    if (!this.socket) return;
    this.socket.on('user-joined', callback);
  }

  /**
   * Removes all event listeners
   */
  removeAllListeners(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
  }
}

// Export singleton instance
export const socketService = new SocketService();
