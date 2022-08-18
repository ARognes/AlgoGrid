import { Position } from './Position'

export class Tile extends Position {
  private _type: TileEnum

  constructor(x: number, y: number, type: TileEnum) {
    super(x, y)
    this._type = type
  }

  get x(): number {
    return super.x
  }

  get y(): number {
    return super.y
  }

  get type(): TileEnum {
    return this._type
  }

  set x(x: number) {
    super.x = x
  }

  set y(y: number) {
    super.y = y
  }

  set type(type: TileEnum) {
    this._type = type
  }
}