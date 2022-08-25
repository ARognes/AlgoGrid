import { bound } from '../setup'

export class Position {
  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
  
  static equals(pos: Position, other: Position): boolean {
    return pos.x === other.x && pos.y === other.y
  }

  static constrain(pos: Position, min: number, max: number): Position {
    return new Position(
      bound(pos.x, min, max),
      bound(pos.y, min, max)
    )
  }

  static distance(pos: Position, other: Position): number {
    return Math.sqrt(Math.pow(pos.x - other.x, 2) + Math.pow(pos.y - other.y, 2))
  }

  static distanceSquared(pos: Position, other: Position): number {
    return Math.pow(pos.x - other.x, 2) + Math.pow(pos.y - other.y, 2)
  }
}
