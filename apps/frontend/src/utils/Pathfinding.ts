import { Vector2 } from './Vector2';

interface Node {
  position: Vector2;
  gCost: number; // Cost from start to this node
  hCost: number; // Estimated cost from this node to end
  parent: Node | null;
}

export class Pathfinding {
  private static readonly DIAGONAL_COST = Math.sqrt(2);
  private static readonly STRAIGHT_COST = 1;

  /**
   * Find path using A* algorithm
   * @param start Starting position
   * @param end Target position
   * @param isWalkable Function that determines if a position is walkable
   * @param gridSize Size of each grid cell
   * @returns Array of positions forming the path, or empty array if no path found
   */
  static findPath(
    start: Vector2,
    end: Vector2,
    isWalkable: (pos: Vector2) => boolean,
    gridSize: number
  ): Vector2[] {
    // Convert positions to grid coordinates
    const startGrid = this.worldToGrid(start, gridSize);
    const endGrid = this.worldToGrid(end, gridSize);

    const openSet: Node[] = [];
    const closedSet: Set<string> = new Set();

    // Initialize start node
    const startNode: Node = {
      position: startGrid,
      gCost: 0,
      hCost: this.getHeuristicCost(startGrid, endGrid),
      parent: null
    };

    openSet.push(startNode);

    while (openSet.length > 0) {
      // Get node with lowest total cost
      const currentNode = this.getLowestCostNode(openSet);
      
      // Remove current node from open set
      openSet.splice(openSet.indexOf(currentNode), 1);
      
      // Add to closed set
      closedSet.add(this.positionToString(currentNode.position));

      // Check if we reached the end
      if (currentNode.position.equals(endGrid)) {
        return this.reconstructPath(currentNode, gridSize);
      }

      // Check all neighbors
      const neighbors = this.getNeighbors(currentNode.position);
      for (const neighborPos of neighbors) {
        // Skip if neighbor is in closed set
        if (closedSet.has(this.positionToString(neighborPos))) {
          continue;
        }

        // Skip if not walkable
        const worldPos = this.gridToWorld(neighborPos, gridSize);
        if (!isWalkable(worldPos)) {
          continue;
        }

        // Calculate costs
        const gCost = currentNode.gCost + this.getMovementCost(currentNode.position, neighborPos);
        const hCost = this.getHeuristicCost(neighborPos, endGrid);

        // Create neighbor node
        const neighborNode: Node = {
          position: neighborPos,
          gCost,
          hCost,
          parent: currentNode
        };

        // Check if neighbor is already in open set
        const existingNode = openSet.find(node => 
          node.position.equals(neighborPos)
        );

        if (existingNode) {
          // Update existing node if new path is better
          if (gCost < existingNode.gCost) {
            existingNode.gCost = gCost;
            existingNode.parent = currentNode;
          }
        } else {
          // Add new node to open set
          openSet.push(neighborNode);
        }
      }
    }

    // No path found
    return [];
  }

  private static getNeighbors(position: Vector2): Vector2[] {
    const neighbors: Vector2[] = [];
    
    // Add all 8 surrounding positions
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        if (x === 0 && y === 0) continue;
        neighbors.push(new Vector2(position.x + x, position.y + y));
      }
    }

    return neighbors;
  }

  private static getMovementCost(from: Vector2, to: Vector2): number {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    return dx === 1 && dy === 1 ? this.DIAGONAL_COST : this.STRAIGHT_COST;
  }

  private static getHeuristicCost(from: Vector2, to: Vector2): number {
    // Using octile distance as heuristic (allows for diagonal movement)
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    return this.STRAIGHT_COST * Math.max(dx, dy) + 
           (this.DIAGONAL_COST - this.STRAIGHT_COST) * Math.min(dx, dy);
  }

  private static getLowestCostNode(nodes: Node[]): Node {
    return nodes.reduce((lowest, node) => {
      const totalCost = node.gCost + node.hCost;
      const lowestTotalCost = lowest.gCost + lowest.hCost;
      return totalCost < lowestTotalCost ? node : lowest;
    });
  }

  private static reconstructPath(endNode: Node, gridSize: number): Vector2[] {
    const path: Vector2[] = [];
    let currentNode: Node | null = endNode;

    while (currentNode) {
      path.unshift(this.gridToWorld(currentNode.position, gridSize));
      currentNode = currentNode.parent;
    }

    return path;
  }

  private static worldToGrid(position: Vector2, gridSize: number): Vector2 {
    return new Vector2(
      Math.floor(position.x / gridSize),
      Math.floor(position.y / gridSize)
    );
  }

  private static gridToWorld(position: Vector2, gridSize: number): Vector2 {
    return new Vector2(
      (position.x + 0.5) * gridSize,
      (position.y + 0.5) * gridSize
    );
  }

  private static positionToString(position: Vector2): string {
    return `${position.x},${position.y}`;
  }
} 