export function getFloorFromRoom(roomNumber: string): number {
  const num = parseInt(roomNumber, 10);
  if (isNaN(num) || num < 100) return 0;
  return Math.floor(num / 100);
}
