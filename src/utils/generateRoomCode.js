const ROOM_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export default function generateRoomCode(length = 6) {
  let roomCode = "";

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARACTERS.length);

    roomCode += ROOM_CODE_CHARACTERS[randomIndex];
  }

  return roomCode;
}
