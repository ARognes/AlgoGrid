import { Position } from './Position'

export class Tile extends Position {
  type: TileEnum

  constructor(x: number, y: number, type: TileEnum) {
    super(x, y)
    this.type = type
  }
}