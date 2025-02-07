import { Vector2 } from './Vector2';
import { Room } from '../engine/Game';

export class Navigation {
  private static readonly DOOR_WIDTH = 2; // Width of doors in grid cells

  /**
   * Check if a position is walkable (not colliding with walls)
   * @param position Position to check
   * @param rooms List of rooms
   * @param gridSize Size of each grid cell
   * @returns Whether the position is walkable
   */
  static isWalkable(position: Vector2, rooms: Room[], gridSize: number): boolean {
    const gridPos = new Vector2(
      Math.floor(position.x / gridSize),
      Math.floor(position.y / gridSize)
    );

    // Check if position is inside any room
    const room = this.getRoomAtPosition(gridPos, rooms);
    if (room) return true;

    // Check if position is in a doorway between rooms
    return this.isInDoorway(gridPos, rooms);
  }

  /**
   * Get the room at a grid position
   * @param gridPos Grid position to check
   * @param rooms List of rooms
   * @returns Room at position, or null if none
   */
  static getRoomAtPosition(gridPos: Vector2, rooms: Room[]): Room | null {
    return rooms.find(room => 
      gridPos.x >= room.gridX &&
      gridPos.x < room.gridX + room.gridWidth &&
      gridPos.y >= room.gridY &&
      gridPos.y < room.gridY + room.gridHeight
    ) || null;
  }

  /**
   * Check if a grid position is in a doorway between rooms
   * @param gridPos Grid position to check
   * @param rooms List of rooms
   * @returns Whether the position is in a doorway
   */
  private static isInDoorway(gridPos: Vector2, rooms: Room[]): boolean {
    // Check each pair of rooms
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const room1 = rooms[i];
        const room2 = rooms[j];

        // Check if rooms are adjacent horizontally
        if (Math.abs((room1.gridX + room1.gridWidth) - room2.gridX) === 0 ||
            Math.abs(room1.gridX - (room2.gridX + room2.gridWidth)) === 0) {
          // Check vertical overlap
          const overlapStart = Math.max(room1.gridY, room2.gridY);
          const overlapEnd = Math.min(room1.gridY + room1.gridHeight, room2.gridY + room2.gridHeight);
          
          if (overlapEnd - overlapStart >= this.DOOR_WIDTH) {
            // Create door in middle of overlap
            const doorY = Math.floor((overlapStart + overlapEnd - this.DOOR_WIDTH) / 2);
            const doorX = Math.min(room1.gridX + room1.gridWidth, room2.gridX);

            if (gridPos.x === doorX &&
                gridPos.y >= doorY &&
                gridPos.y < doorY + this.DOOR_WIDTH) {
              return true;
            }
          }
        }

        // Check if rooms are adjacent vertically
        if (Math.abs((room1.gridY + room1.gridHeight) - room2.gridY) === 0 ||
            Math.abs(room1.gridY - (room2.gridY + room2.gridHeight)) === 0) {
          // Check horizontal overlap
          const overlapStart = Math.max(room1.gridX, room2.gridX);
          const overlapEnd = Math.min(room1.gridX + room1.gridWidth, room2.gridX + room2.gridWidth);
          
          if (overlapEnd - overlapStart >= this.DOOR_WIDTH) {
            // Create door in middle of overlap
            const doorX = Math.floor((overlapStart + overlapEnd - this.DOOR_WIDTH) / 2);
            const doorY = Math.min(room1.gridY + room1.gridHeight, room2.gridY);

            if (gridPos.y === doorY &&
                gridPos.x >= doorX &&
                gridPos.x < doorX + this.DOOR_WIDTH) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Find a path between two rooms
   * @param start Starting position
   * @param end Target position
   * @param rooms List of rooms
   * @param gridSize Size of each grid cell
   * @returns Array of positions forming the path, or empty array if no path found
   */
  static findRoomPath(
    start: Vector2,
    end: Vector2,
    rooms: Room[],
    gridSize: number
  ): Vector2[] {
    // Convert to grid coordinates
    const startGrid = new Vector2(
      Math.floor(start.x / gridSize),
      Math.floor(start.y / gridSize)
    );
    const endGrid = new Vector2(
      Math.floor(end.x / gridSize),
      Math.floor(end.y / gridSize)
    );

    const startRoom = this.getRoomAtPosition(startGrid, rooms);
    const endRoom = this.getRoomAtPosition(endGrid, rooms);

    if (!startRoom || !endRoom) return [];

    // If in same room, return direct path
    if (startRoom === endRoom) {
      return [
        new Vector2((startGrid.x + 0.5) * gridSize, (startGrid.y + 0.5) * gridSize),
        new Vector2((endGrid.x + 0.5) * gridSize, (endGrid.y + 0.5) * gridSize)
      ];
    }

    // Find path through doorways
    const path = this.findDoorwayPath(startRoom, endRoom, rooms);
    if (!path.length) return [];

    // Convert path to world coordinates
    return path.map(pos => 
      new Vector2((pos.x + 0.5) * gridSize, (pos.y + 0.5) * gridSize)
    );
  }

  /**
   * Find a path between two rooms through doorways
   * @param startRoom Starting room
   * @param endRoom Target room
   * @param rooms List of all rooms
   * @returns Array of grid positions forming the path
   */
  private static findDoorwayPath(
    startRoom: Room,
    endRoom: Room,
    rooms: Room[]
  ): Vector2[] {
    // Simple implementation: find direct doorway if rooms are adjacent
    const doorway = this.findDoorwayBetweenRooms(startRoom, endRoom);
    if (doorway) {
      // Return path through doorway
      const startCenter = new Vector2(
        startRoom.gridX + Math.floor(startRoom.gridWidth / 2),
        startRoom.gridY + Math.floor(startRoom.gridHeight / 2)
      );
      const endCenter = new Vector2(
        endRoom.gridX + Math.floor(endRoom.gridWidth / 2),
        endRoom.gridY + Math.floor(endRoom.gridHeight / 2)
      );
      return [startCenter, doorway, endCenter];
    }

    // TODO: Implement full pathfinding between non-adjacent rooms
    return [];
  }

  /**
   * Find a doorway between two rooms if they are adjacent
   * @param room1 First room
   * @param room2 Second room
   * @returns Position of doorway, or null if rooms are not adjacent
   */
  private static findDoorwayBetweenRooms(room1: Room, room2: Room): Vector2 | null {
    // Check horizontal adjacency
    if (Math.abs((room1.gridX + room1.gridWidth) - room2.gridX) === 0 ||
        Math.abs(room1.gridX - (room2.gridX + room2.gridWidth)) === 0) {
      // Check vertical overlap
      const overlapStart = Math.max(room1.gridY, room2.gridY);
      const overlapEnd = Math.min(room1.gridY + room1.gridHeight, room2.gridY + room2.gridHeight);
      
      if (overlapEnd - overlapStart >= this.DOOR_WIDTH) {
        // Create door in middle of overlap
        const doorY = Math.floor((overlapStart + overlapEnd - this.DOOR_WIDTH) / 2);
        const doorX = Math.min(room1.gridX + room1.gridWidth, room2.gridX);
        return new Vector2(doorX, doorY + Math.floor(this.DOOR_WIDTH / 2));
      }
    }

    // Check vertical adjacency
    if (Math.abs((room1.gridY + room1.gridHeight) - room2.gridY) === 0 ||
        Math.abs(room1.gridY - (room2.gridY + room2.gridHeight)) === 0) {
      // Check horizontal overlap
      const overlapStart = Math.max(room1.gridX, room2.gridX);
      const overlapEnd = Math.min(room1.gridX + room1.gridWidth, room2.gridX + room2.gridWidth);
      
      if (overlapEnd - overlapStart >= this.DOOR_WIDTH) {
        // Create door in middle of overlap
        const doorX = Math.floor((overlapStart + overlapEnd - this.DOOR_WIDTH) / 2);
        const doorY = Math.min(room1.gridY + room1.gridHeight, room2.gridY);
        return new Vector2(doorX + Math.floor(this.DOOR_WIDTH / 2), doorY);
      }
    }

    return null;
  }
} 