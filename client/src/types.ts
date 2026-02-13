/**
 * Shared TypeScript types for Showdown
 * Used by both client and server to ensure type safety
 */

// ==================== Room Types ====================

export type RoomStatus = 'waiting' | 'active';

export type RoundStatus = 'voting' | 'revealed';

export interface RoomSettings {
  anonymous: boolean;           // Show participant names or not
  cardValues: (number | string)[];  // Available card values (numbers, emoji, or "?")
}

export interface Participant {
  id: string;                    // Unique user ID (generated on join)
  name: string;                  // Display name
  isCreator: boolean;            // True if this user created the room
  connectedAt: Date;
  isOnline: boolean;             // True if currently connected via socket
  socketId?: string;             // Current socket ID if online
}

export interface Vote {
  userId: string;
  userName: string;
  value: number | string;
  votedAt: Date;
}

export interface Round {
  id: string;                    // Unique round ID
  name: string;                  // User-defined round name (e.g., "User Story #123")
  status: RoundStatus;
  votes: Vote[];                 // All votes for this round
  revealedAt?: Date;
}

export interface Room {
  id: string;                    // Unique room ID (UUID)
  name?: string;                 // Optional room name
  createdBy: string;             // Creator's user ID
  createdAt: Date;
  settings: RoomSettings;
  currentRound: Round;           // Single round that resets
  roundNumber: number;           // Counter for display (increments with each reset)
  status: RoomStatus;
  participants: Participant[];
}

// ==================== Socket Event Payloads ====================

// Client -> Server events

export interface CreateRoomPayload {
  userName: string;              // Creator's name
  roomName?: string;             // Optional room name
  settings?: Partial<RoomSettings>; // Optional custom settings
}

export interface JoinRoomPayload {
  roomId: string;
  userName: string;
}

export interface SubmitVotePayload {
  roomId: string;
  userId: string;
  vote: number | string;
}

export interface RevealVotesPayload {
  roomId: string;
  userId: string;
}

export interface NextRoundPayload {
  roomId: string;
  userId: string;
}

export interface UpdateSettingsPayload {
  roomId: string;
  settings: Partial<RoomSettings>;
}

// Server -> Client events

export interface RoomCreatedResponse {
  success: boolean;
  room?: Room;
  userId?: string;               // The creator's generated user ID
  error?: string;
}

export interface JoinRoomResponse {
  success: boolean;
  room?: Room;
  userId?: string;               // The joining user's generated user ID
  error?: string;
}

export interface RoomUpdatePayload {
  room: Room;
}

export interface ErrorPayload {
  message: string;
}

export interface VoteSubmittedPayload {
  roomId: string;
  userId: string;
  hasVoted: boolean;
}

// ==================== Client-Only Types ====================

export interface VoteStatistics {
  average: number;
  median: number;
  min: number;
  max: number;
  consensus: boolean;            // True if all votes are the same
}

// ==================== Constants ====================

export const DEFAULT_CARD_VALUES = [0.5, 1, 2, 3, 5, 8, '☕', '?'];

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  anonymous: false,
  cardValues: DEFAULT_CARD_VALUES,
};

// ==================== Socket Event Names ====================

export const SOCKET_EVENTS = {
  // Client -> Server
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  SUBMIT_VOTE: 'submit-vote',
  REVEAL_VOTES: 'reveal-votes',
  NEXT_ROUND: 'next-round',
  UPDATE_SETTINGS: 'update-settings',
  LEAVE_ROOM: 'leave-room',
  
  // Server -> Client
  ROOM_CREATED: 'room-created',
  ROOM_JOINED: 'room-joined',
  ROOM_UPDATE: 'room-update',
  VOTE_SUBMITTED: 'vote-submitted',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  ERROR: 'error',
} as const;
