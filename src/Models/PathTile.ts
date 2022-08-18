import { Tile } from './Tile'

export class PathTile extends Tile {
  private _g: number
  private _h: number
  private _reference: number

  constructor(x: number, y: number, g: number, h: number, reference: number) {
    super(x, y, TileEnum.Path)
    this._g = g
    this._h = h
    this._reference = reference
  }

  get x(): number {
    return super.x
  }

  get y(): number {
    return super.y
  }

  get g(): number {
    return this._g
  }

  get h(): number {
    return this._h
  }
  
  get reference(): number {
    return this._reference
  }

  set x(x: number) {
    super.x = x
  }

  set y(y: number) {
    super.y = y
  }

  set g(g: number) {
    this._g = g
  }

  set h(h: number) {
    this._h = h
  }

  set reference(reference: number) {
    this._reference = reference
  }
}