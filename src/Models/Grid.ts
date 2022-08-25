import { mod } from 'setup'
import { GRID_LINE_WIDTH, MAX_WIDTH, MIN_WIDTH, TILE_SIZE } from '../constants'
import { Position } from './Position'


export class Grid implements IGrid {
  tilesCopy: TileEnum[] | null = null
  cursorGridPos = new Position(-1, -1)
  viewMode = GridViewMode.Normal
  width: number
  height: number
  tiles: TileEnum[]

  constructor(width: number, height = 0) {
    this.width = Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH)

    this.height = height === 0 
      ? this.width
      : Math.min(Math.max(height, MIN_WIDTH), MAX_WIDTH)

    this.tiles = new Array(this.width * this.height).fill(0)
  }

  static cartesianToIndex(grid: Grid, x: number, y: number): number {
    return grid.viewMode === GridViewMode.Simple ? mod(x, grid.width) + mod(y, grid.height) * grid.width : x + y * grid.width
  }

  static indexToCartesian(grid: Grid, i: number): Position {
    return new Position(i % grid.width, Math.floor(i / grid.width))
  }

  static within(grid: Grid, x: number, y: number): boolean {
    return x >= 0 && x < grid.width && y >= 0 && y < grid.height
  }

  draw(canvasWidth: number, canvasHeight: number, ctx: Context2D, cameraTrans: cameraTrans) {

    if (this.viewMode === GridViewMode.Simple) 
      return this.drawSimple(canvasWidth, canvasHeight, ctx, cameraTrans)
    
    // if grid not in view, return, else find first and last tiles in view
    const tileScaled = cameraTrans.scale * TILE_SIZE
    const beginX = Math.max(Math.floor(-cameraTrans.offset.x / tileScaled), 0)
    const beginY = Math.max(Math.floor(-cameraTrans.offset.y / tileScaled), 0)
    const endX = Math.min(Math.ceil((canvasWidth - cameraTrans.offset.x) / tileScaled), this.width)
    const endY = Math.min(Math.ceil((canvasHeight - cameraTrans.offset.y) / tileScaled), this.height)

    // draw grid background
    ctx.fillStyle = '#fcc'
    ctx.fillRect(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE)

    // draw grid background lines
    ctx.strokeStyle = '#a99'
    ctx.lineWidth = GRID_LINE_WIDTH
    for (let i = beginX; i <= endX; i++) {
      ctx.beginPath()
      ctx.moveTo(i * TILE_SIZE, beginY * TILE_SIZE)
      ctx.lineTo(i * TILE_SIZE, endY * TILE_SIZE)
      ctx.stroke()
    }
    for (let i = beginY; i <= endY; i++) {
      ctx.beginPath()
      ctx.moveTo(beginX * TILE_SIZE, i * TILE_SIZE)
      ctx.lineTo(endX * TILE_SIZE, i * TILE_SIZE)
      ctx.stroke()
    }

    if (this.cursorGridPos.x === this.width && this.cursorGridPos.y === this.height) {
      ctx.strokeStyle = '#000'
      ctx.strokeRect(this.width * TILE_SIZE, this.height * TILE_SIZE, TILE_SIZE, TILE_SIZE)
    }
  }

  private drawSimple(canvasWidth: number, canvasHeight: number, ctx: Context2D, cameraTrans: cameraTrans) {
    const tileScaled = cameraTrans.scale * TILE_SIZE
    const beginX = Math.floor(-cameraTrans.offset.x / tileScaled)
    const beginY = Math.floor(-cameraTrans.offset.y / tileScaled)
    const viewWidth = Math.ceil(canvasWidth / tileScaled) + 1
    const viewHeight = Math.ceil(canvasHeight / tileScaled) + 1
    const endX = beginX + viewWidth
    const endY = beginY + viewHeight
  
    ctx.lineWidth = 3

    // draw grid background
    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE)
    
    // draw tiles
    ctx.fillStyle = '#fff'
    ctx.lineWidth = 3
    for (let i = beginX; i < endX; i++) {
      for (let j = beginY; j < endY; j++) {
        if (!this.tiles[Grid.cartesianToIndex(grid, i, j)]) continue      // only draw barriers
        ctx.fillRect(i * TILE_SIZE + 2, j * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4)   // draw alive
      }
    }

    if (this.cursorGridPos.x === this.width && this.cursorGridPos.y === this.height) {
      ctx.strokeStyle = '#fff'
      ctx.strokeRect(this.width * TILE_SIZE, this.height * TILE_SIZE, TILE_SIZE, TILE_SIZE)
    }
  }

  resize(on = true) {
    if (on) this.tilesCopy = this.tiles
    else if (this.tilesCopy !== null) this.tilesCopy = null
  }

  setCursorGridPos(pos: Position) { 
    if (Position.equals(pos, this.cursorGridPos)) return 

    this.cursorGridPos = Position.constrain(pos, MIN_WIDTH, MAX_WIDTH)

    if (this.tilesCopy === null) return // Resize grid

    this.tiles = new Array(this.cursorGridPos.x * this.cursorGridPos.y).fill(0)
    this.tilesCopy.forEach((tile, i) => {
      const pos = Grid.indexToCartesian(this, i)

      if (pos.x <= this.cursorGridPos.x && pos.y <= this.cursorGridPos.y) 
        this.tiles[pos.x + pos.y * this.cursorGridPos.x] = tile
    })

    this.tilesCopy = this.tiles
    this.width = this.cursorGridPos.x
    this.height = this.cursorGridPos.y
  }
}

// grid construction
export let grid = new Grid((window.innerWidth < window.innerHeight) ? Math.floor(window.innerWidth / TILE_SIZE) : Math.floor(window.innerHeight / TILE_SIZE)) // create grid to fill exactly or more than screen size;


export interface IGrid {
  tilesCopy: TileEnum[] | null
  cursorGridPos: Position
  viewMode: GridViewMode
  width: number
  height: number
  tiles: TileEnum[]

  draw(canvasWidth: number, canvasHeight: number, ctx: Context2D, cameraTrans: cameraTrans): void

  resize(on: boolean): void

  setCursorGridPos(pos: Position): void
}
