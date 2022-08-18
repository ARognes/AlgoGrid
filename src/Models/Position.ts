import { bound } from '../setup'

export class Position {
  private _x: number
  private _y: number

  constructor(x: number, y: number) {
    this._x = x
    this._y = y
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

  get x(): number {
    return this._x
  }

  get y(): number {
    return this._y
  }

  set x(x: number) {
    this._x = x
  }

  set y(y: number) {
    this._y = y
  }
}
