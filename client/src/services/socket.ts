import { io, Socket } from 'socket.io-client';
import type { 
  CreateRoomPayload, 
  RoomCreatedResponse,
  JoinRoomPayload,
  JoinRoomResponse,
} from '@shared/types';

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;

  connect(url?: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    // In development, use relative path to leverage Vite's proxy
    // In production, you'd set VITE_SOCKET_URL env variable
    const socketUrl = url || import.meta.env.VITE_SOCKET_URL || window.location.origin;

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
}

// Export singleton instance
export const socketService = new SocketService();
