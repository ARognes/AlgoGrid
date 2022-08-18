import { mod } from 'setup'
import { PathTile } from './PathTile'
import { Position } from './Position'
import { Tile } from './Tile'

const GRID_LINE_WIDTH = 6,
      MIN_WIDTH = 2,
      MAX_WIDTH = 256,
      SHOW_LABEL_DIST = 6

export const TILE_SIZE = 32

// camera view
export let canvas = document.getElementById('canvas') as HTMLCanvasElement
export let ctx = canvas.getContext('2d') as CanvasRenderingContext2D
export let cameraTrans: cameraTrans = { scale: 1, offset: new Position(0, 0) }

export class Grid implements IGrid {
  tilesCopy: TileEnum[] | null = null
  cursorGridPos = new Position(-1, -1)
  simple: boolean = false
  mode = GridMode.None
  lastMode = GridMode.None
  units = [] as Tile[]
  target: number = -1
  openTiles: PathTile[] = []
  closedTiles: PathTile[] = []
  pathTilePos: Position | null = null // used when retracing optimal path back to unit from target
  unitTurn = 0 // which unit is currently pathfinding
  stepIndex: number = -1
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

  // convert tile cartesian coordinates to tile array coordinates
  static cartesianToIndex(grid: Grid, x: number, y: number): number {
    return grid.simple ? mod(x, grid.width) + mod(y, grid.height) * grid.width : x + y * grid.width
  }

  static indexToCartesian(grid: Grid, i: number): Position {
    return new Position(i % grid.width, Math.floor(i / grid.width))
  }

  static within(grid: Grid, x: number, y: number): boolean {
    return x >= 0 && x < grid.width && y >= 0 && y < grid.height
  }

  draw() {
    let tileScaled = cameraTrans.scale * TILE_SIZE
    let beginX = Math.floor(-cameraTrans.offset.x / tileScaled)
    let beginY = Math.floor(-cameraTrans.offset.y / tileScaled)
    let endX, endY, viewWidth, viewHeight
    if (this.simple && this.mode !== GridMode.Pathfinding) {    // find first tile in view and the view size
      viewWidth = Math.ceil(canvas.width / tileScaled) + 1
      viewHeight = Math.ceil(canvas.height / tileScaled) + 1
      endX = beginX + viewWidth
      endY = beginY + viewHeight
    } else {              // if grid not in view, return, else find first and last tiles in view
      beginX = Math.max(beginX, 0)
      beginY = Math.max(beginY, 0)
      endX = Math.min(Math.ceil((canvas.width - cameraTrans.offset.x) / tileScaled), this.width)
      endY = Math.min(Math.ceil((canvas.height - cameraTrans.offset.y) / tileScaled), this.height)
    }
    
    if (this.simple) {  // draw simple grid for better performance

      ctx.lineWidth = 3
      if (this.mode === GridMode.Pathfinding) {  // pathfinding
        
        // draw grid background
        ctx.fillStyle = '#444'
        ctx.fillRect(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE)

        for (let i = beginX; i < endX; i++) {
          for (let j = beginY; j < endY; j++) {
            let tile = this.tiles[Grid.cartesianToIndex(this, i, j)]
            if (!tile) continue

            ctx.fillStyle = tileFillStyles.get(tile) as string

            ctx.fillRect(i * TILE_SIZE + 2, j * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4)   // draw alive
          }
        }
        if (this.cursorGridPos) {
          ctx.fillStyle = '#000'
          this.labelSearch(this.openTiles, true)
          this.labelSearch(this.closedTiles, true)
        }

        if (this.cursorGridPos.x === this.width && this.cursorGridPos.y === this.height) {
          ctx.strokeStyle = '#fff'
          ctx.strokeRect(this.width * TILE_SIZE, this.height * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        }
        return;
      }

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

      return
    }
    // draw normal grid with details

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

    this.mode === GridMode.Life 
      ? this.drawLife(beginX, endX, beginY, endY) 
      : this.drawPathfinding(beginX, endX, beginY, endY)

    if (this.cursorGridPos.x === this.width && this.cursorGridPos.y === this.height) {
      ctx.strokeStyle = '#000'
      ctx.strokeRect(this.width * TILE_SIZE, this.height * TILE_SIZE, TILE_SIZE, TILE_SIZE)
    }
  }

  resize(on = true) {
    if (on) {
      if (this.target) this.tiles[this.target] = 0
      this.units.forEach(unit => this.tiles[unit.x + unit.y * this.width] = 0)
      this.target = -1
      this.units = []
      this.clearPathfinding()
      this.tilesCopy = this.tiles
    }
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

  // switch draw function on mode change instead of on draw
  setMode(mode: GridMode) {
    this.lastMode = this.mode
    this.mode = mode

    if (this.mode === GridMode.Pathfinding) {
      if (this.target >= 0) this.tiles[this.target] = 2
      this.units.forEach(unit => this.tiles[unit.x + unit.y * this.width] = 3)
    }

    this.clearPathfinding()
  }
  
  drawLife(beginX: number, endX: number, beginY: number, endY: number) {
    const ignoreTileTypesLife = [TileEnum.None, TileEnum.Path, TileEnum.Closed, TileEnum.Open]

    // set drawing context to tile style
    ctx.fillStyle = '#020'
    ctx.strokeStyle = '#030'
    ctx.lineWidth = 9
    for (let i = beginX; i < endX; i++) {
      for (let j = beginY; j < endY; j++) {
        const k = Grid.cartesianToIndex(this, i, j)
  
        if (this.tiles[k] in ignoreTileTypesLife) continue

        ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        ctx.strokeRect(i * TILE_SIZE + ctx.lineWidth / 2, j * TILE_SIZE + ctx.lineWidth / 2, 
                       TILE_SIZE - ctx.lineWidth, TILE_SIZE - ctx.lineWidth)
      }
    }
  }

  // draw search tile numbers g, h, f;   f = g + h
  labelSearch(searched: PathTile[], usePointer: boolean) {
    ctx.textAlign = 'center'
    searched.forEach(tile => {
      // if (tile.reference === null) return
      
      if (usePointer && Math.pow(tile.x - this.cursorGridPos.x, 2) + Math.pow(tile.y - this.cursorGridPos.y, 2) > SHOW_LABEL_DIST) return
      const g = Math.round(tile.g * 10)
      const h = Math.round(tile.h * 10)
      const x = tile.x
      const y = tile.y
      ctx.font = '8px Nunito'
      ctx.fillText(String(g), (x + 0.5) * TILE_SIZE, (y + 1) * TILE_SIZE - 24)
      ctx.fillText(String(h), (x + 0.5) * TILE_SIZE, (y + 1) * TILE_SIZE - 16)

      ctx.font = Math.max(19 - 3 * (g + h).toFixed().length, 8) + 'px Nunito'
      ctx.fillText(String(g + h), (x + 0.5) * TILE_SIZE, (y + 1) * TILE_SIZE - 6)
    })
  }
  
  drawPathfinding(beginX: number, endX: number, beginY: number, endY: number) {
    for (let i = beginX; i < endX; i++) {
      for (let j = beginY; j < endY; j++) {
  
        // convert tile cartesian coordinates to tile array coordinates
        let k = Grid.cartesianToIndex(this, i, j)
  
        if (this.tiles[k] === TileEnum.None) continue

        const style = tilePathfindingStyles.get(this.tiles[k]) as style
        ctx.fillStyle = style.fill
        ctx.strokeStyle = style.stroke
        ctx.lineWidth = style.lineWidth

        ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        ctx.strokeRect(i * TILE_SIZE + ctx.lineWidth / 2, 
                       j * TILE_SIZE + ctx.lineWidth / 2, 
                       TILE_SIZE - ctx.lineWidth, TILE_SIZE - ctx.lineWidth)
      }
    }
  
    //if (cameraTrans.scale < 0.4) return;
    ctx.fillStyle = '#222'
    this.labelSearch(this.openTiles, false)
    this.labelSearch(this.closedTiles, false)
  
    // draw target tile's number order
    ctx.font = '16px Nunito'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // draw target tile
    if (this.target >= 0) 
      ctx.fillText('X', 
                   (this.target % this.width + 0.47) * TILE_SIZE + 1, 
                   (Math.floor(this.target / this.width) + 0.56) * TILE_SIZE)
      
    // draw unit tile's number
    this.units.forEach((unit, i) => 
      ctx.fillText(String(i + 1), 
                   (unit.x + 0.47) * TILE_SIZE + 1, 
                   (unit.y + 0.5) * TILE_SIZE))
  }

  clearPathfinding() {
    this.tiles = this.tiles.map(tile => Math.max(tile, 0))
    this.closedTiles = []
    this.openTiles = []
    this.unitTurn %= Math.max(this.units.length, 1)
    this.stepIndex = -1
    this.pathTilePos = null
  }
}

const tileFillStyles: Map<TileEnum, string> = new Map([
  [TileEnum.Path, '#000'],
  [TileEnum.Closed, '#f33'],
  [TileEnum.Open, '#3f3'],
  [TileEnum.Barrier, '#666'],
  [TileEnum.Target, '#777'],
  [TileEnum.Unit, '#999']
])

const tilePathfindingStyles: Map<TileEnum, style> = new Map([
  [TileEnum.Path,     { fill: '#ff0', stroke: '#dd0', lineWidth: 3 } as style],
  [TileEnum.Closed,   { fill: '#f66', stroke: '#f33', lineWidth: 3 } as style],
  [TileEnum.Open,     { fill: '#f99', stroke: '#f66', lineWidth: 3 } as style],
  [TileEnum.Barrier,  { fill: '#020', stroke: '#030', lineWidth: 3 } as style],
  [TileEnum.Target,   { fill: '#f44', stroke: '#d44', lineWidth: 3 } as style],
  [TileEnum.Unit,     { fill: '#4f4', stroke: '#4d4', lineWidth: 3 } as style]
])

// grid construction
export let grid = new Grid((window.innerWidth < window.innerHeight) ? Math.floor(window.innerWidth / TILE_SIZE) : Math.floor(window.innerHeight / TILE_SIZE)) // create grid to fill exactly or more than screen size;


interface IGrid {
  tilesCopy: TileEnum[] | null
  cursorGridPos: Position
  simple: boolean
  mode: GridMode
  lastMode: GridMode
  units: Tile[]
  target: number
  openTiles: PathTile[]
  closedTiles: PathTile[]
  pathTilePos: Position | null
  unitTurn: number
  stepIndex: number
  width: number
  height: number
  tiles: TileEnum[]

  cartesianToIndex(x: number, y: number): number

  indexToCartesian(index: number): Position

  draw(): void

  resize(on: boolean): void

  setCursorGridPos(pos: Position): void
}
