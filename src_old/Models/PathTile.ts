import { Tile } from './Tile'

export class PathTile extends Tile {
  g: number
  h: number
  reference: number

  constructor(x: number, y: number, g: number, h: number, reference: number) {
    super(x, y, TileEnum.Path)
    this.g = g
    this.h = h
    this.reference = reference
  }
}