const STORAGE_KEYS = {
  USER_NAME: 'planningPoker_userName',
  USER_ID: 'planningPoker_userId',
  RECENT_ROOMS: 'planningPoker_recentRooms',
} as const;

export const StorageService = {
  // User name
  getUserName(): string | null {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME);
  },

  saveUserName(name: string): void {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
  },

  clearUserName(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
  },

  // User ID
  getUserId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.USER_ID);
  },

  saveUserId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.USER_ID, id);
  },

  clearUserId(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
  },

  // Recent rooms
  getRecentRooms(): string[] {
    const rooms = localStorage.getItem(STORAGE_KEYS.RECENT_ROOMS);
    return rooms ? JSON.parse(rooms) : [];
  },

  addRecentRoom(roomId: string): void {
    const rooms = this.getRecentRooms();
    // Add to beginning, remove duplicates, keep last 5
    const updated = [roomId, ...rooms.filter((id) => id !== roomId)].slice(0, 5);
    localStorage.setItem(STORAGE_KEYS.RECENT_ROOMS, JSON.stringify(updated));
  },

  clearRecentRooms(): void {
    localStorage.removeItem(STORAGE_KEYS.RECENT_ROOMS);
  },
};
