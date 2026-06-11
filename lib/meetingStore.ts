type Room = {
  id: string;
  createdAt: number;
};

const rooms: Record<string, Room> = {};

/**
 * Create a new room
 */
const STORAGE_KEY = "lumina_rooms";

function getRooms() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}

function saveRooms(rooms: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

export function createRoom(id: string) {
  const rooms = getRooms();

  rooms[id] = {
    id,
    createdAt: Date.now(),
  };

  saveRooms(rooms);
}

export function roomExists(id: string) {
  const rooms = getRooms();
  return Boolean(rooms[id]);
}