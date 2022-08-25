import { mod } from 'setup'
import { MIN_WIDTH, MAX_WIDTH, TILE_SIZE, GRID_LINE_WIDTH, SHOW_LABEL_DIST, SQRT_2 } from '../constants'
import { cameraTrans, canvas, ctx } from '../main'
import { Grid, IGrid } from './Grid'
import { PathTile } from './PathTile'
import { Position } from './Position'
import { Tile } from './Tile'


export class PathGrid extends Grid implements IPathGrid {
  units = [] as Tile[]
  target: number = -1
  openTiles: PathTile[] = []
  closedTiles: PathTile[] = []
  pathTilePos: Position | null = null // used when retracing optimal path back to unit from target
  unitTurn = 0 // which unit is currently pathfinding
  stepIndex: number = -1

  constructor(width: number, height = 0) {
    super(width, height)
  }

  draw() {
    let tileScaled = cameraTrans.scale * TILE_SIZE
    let beginX = Math.floor(-cameraTrans.offset.x / tileScaled)
    let beginY = Math.floor(-cameraTrans.offset.y / tileScaled)
    const viewWidth = Math.ceil(canvas.width / tileScaled) + 1
    const viewHeight = Math.ceil(canvas.height / tileScaled) + 1
    const endX = beginX + viewWidth
    const endY = beginY + viewHeight

    // draw grid background
    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE)
    
    // draw tiles
    ctx.fillStyle = '#fff'
    ctx.lineWidth = 3
    for (let i = beginX; i < endX; i++) 
      for (let j = beginY; j < endY; j++) 
        if (this.tiles[Grid.cartesianToIndex(grid, i, j)]) 
          ctx.fillRect(i * TILE_SIZE + 2, j * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4)   // draw alive
    
    if (this.cursorGridPos.x === this.width && this.cursorGridPos.y === this.height) {
      ctx.strokeStyle = '#fff'
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

  step(pause: Function) {

    // TODO add heuristic changes to steps (undo)

    const target: Position = Grid.indexToCartesian(this, this.target)


    if (this.pathTilePos !== null) {  // find optimal path back from target


      // stepIndex where this unit will step next
      if (this.stepIndex >= 0) {

        // step unit
        super.tiles[this.units[this.unitTurn].x + this.units[this.unitTurn].y * super.width] = 0
        this.units[this.unitTurn].x = this.closedTiles[this.stepIndex].x
        this.units[this.unitTurn].y = this.closedTiles[this.stepIndex].y
        super.tiles[this.units[this.unitTurn].x + this.units[this.unitTurn].y * super.width] = 3

        // next unit loop
        this.unitTurn++
        this.clearPathfinding()
      } else {
        
        if (Position.distanceSquared(this.units[this.unitTurn], target) < 2) {
          super.tiles[this.units[this.unitTurn].x + this.units[this.unitTurn].y * this.width] = 0
          this.units.splice(this.unitTurn, 1)
          this.clearPathfinding() // clear all heuristics
          pause()
          return
        }

        // go through all closed tiles to find lowest optimal g cost
        // only consider tiles adjacent to the target
        const optimalIndex = this.closedTiles.reduce((optimalIndex: number, tile: PathTile, i: number) => {
          if (Math.abs(this.pathTilePos.x - tile.x) > 1 || Math.abs(this.pathTilePos.y - tile.y) > 1) return optimalIndex
          return optimalIndex === -1 || tile.g < this.closedTiles[optimalIndex].g ? i : optimalIndex
        }, -1)

        if (optimalIndex !== -1) {
          const optimalTile = grid.closedTiles[optimalIndex]
          grid.tiles[optimalTile.reference] = -3
          if (optimalTile.g < 1.5) {  // found next move for this unit
            grid.stepIndex = optimalIndex
            pause()
          } else {
            grid.pathTilePos.x = optimalTile.x
            grid.pathTilePos.y = optimalTile.y
          }
        }
      }
    } else { // no optimal path made yet, still searching

      // initially close tile unit is on, then close openTiles. Calc will find pathTilePos
      this.openTiles.length
        ? this.calculateAdjacentNodes(this.openTiles[0].x, this.openTiles[0].y, target.x, target.y, this.openTiles[0].g)
        : this.calculateAdjacentNodes(this.units[this.unitTurn].x, this.units[this.unitTurn].y, target.x, target.y, 0)

      if (this.openTiles.length) return  // there are still tiles to search

      console.log('No path possible')
      let optimalIndex: number = -1

      if (!this.closedTiles.length) {  // completely boxed in
        this.unitTurn++
        this.clearPathfinding()
        pause()
        return
      }

      // find optimalIndex to move towards target with minimal g + h
      this.closedTiles.forEach((tile: PathTile, i: number) => {
        let unitTile = this.units[this.unitTurn]
        if (Math.abs(tile.x - unitTile.x) > 1 || Math.abs(tile.y - unitTile.y) > 1) return // find neighboring closed tiles
        if (optimalIndex === -1 
            || tile.g + tile.h < this.closedTiles[optimalIndex].g + this.closedTiles[optimalIndex].h) 
              optimalIndex = i  // find optimal direction to move
      })

      if (optimalIndex !== null) {
        let optimalTile = this.closedTiles[optimalIndex]
        super.tiles[optimalTile.reference] = -3
        this.pathTilePos = new Position(optimalTile.x, optimalTile.y)
        this.stepIndex = optimalIndex
        pause()
      }
    }
  }

  private calculateAdjacentNodes(x: number, y: number, targetX: number, targetY: number, addG: number) {
    let neighborTiles: (TileEnum | null)[] = [null, null, null, null, null, null, null, null]
  
    // if they exist, get right, left, up, down tile's style
    if (x < this.width - 1) neighborTiles[7] = this.tiles[x + 1 + y * this.width]
    if (x > 0) neighborTiles[3] = this.tiles[x - 1 + y * this.width]
    if (y > 0) neighborTiles[1] = this.tiles[x + (y - 1) * this.width]
    if (y < this.height - 1) neighborTiles[5] = this.tiles[x + (y + 1) * this.width]
  
    // find if corner neighbor tiles upright, upleft, downright, and downleft exist, if so, get their tile's style
    if (neighborTiles[1] !== null) {
      if (neighborTiles[7] !== null/* && (neighborTiles[1] <= 0 || neighborTiles[7] <= 0) USE THIS TO DISABLE CORNER TILE CROSSING*/) neighborTiles[0] = this.tiles[x + 1 + (y - 1) * this.width]
      if (neighborTiles[3] !== null/* && (neighborTiles[1] <= 0 || neighborTiles[3] <= 0)*/) neighborTiles[2] = this.tiles[x - 1 + (y - 1) * this.width]
    }
    if (neighborTiles[5] !== null) {
      if (neighborTiles[7] !== null/* && (neighborTiles[5] <= 0 || neighborTiles[7] <= 0)*/) neighborTiles[6] = this.tiles[x + 1 + (y + 1) * this.width]
      if (neighborTiles[3] !== null/* && (neighborTiles[5] <= 0 || neighborTiles[3] <= 0)*/) neighborTiles[4] = this.tiles[x - 1 + (y + 1) * this.width]
    }
  
    if (this.openTiles.length > 0) {
      this.tiles[this.openTiles[0].x + this.openTiles[0].y * this.width] = -2   // lowest f cost openTile looks like a closed tile
      this.closedTiles.push(this.openTiles.shift() as PathTile)                  // remove lowest f cost openTile and add it to closedTiles
    }
  
    // go through all neighbor tiles
    for (let j = 0; j < 8; j++) {
      let xPos = x
      let yPos = y
      if (j < 3) yPos--
      else if (j !== 3 && j !== 7) yPos++
      if (j > 1 && j < 5) xPos--
      else if (j != 1 && j != 5) xPos++   // get neighbor tile's position
  
      const distX = Math.abs(targetX - xPos)
      const distY = Math.abs(targetY - yPos)
      const g = ((xPos != x && yPos != y) ? SQRT_2 + addG : 1 + addG)  // real distance from unit
      const h = Math.sqrt(distX * distX + distY * distY)  // line distance to target
      //const h = distX + distY;  // easy calculation to target
  
      if (neighborTiles[j] === 0) {   // for each open neighbor tile
        const reference = xPos + yPos * super.width
        super.tiles[reference] = -1
  
        // insert in sorted openTiles position
        if (this.openTiles.length > 0) {
          this.openTiles.push(new PathTile(xPos, yPos, g, h, reference))
          this.openTiles.sort((a: PathTile, b: PathTile) => {
            const dif = a.g + a.h - b.g - b.h
            return !dif ? a.g + a.h : dif
          })
        } else this.openTiles.push(new PathTile(xPos, yPos, g, h, reference))
  
      } else if (neighborTiles[j] === -1) {  // refactor self to other open tile
        for (let k = 0; k < this.openTiles.length; k++) {
          if (this.openTiles[k].x === xPos 
              && this.openTiles[k].y === yPos 
              && g < this.openTiles[k].g) {
            this.openTiles[k].g = g
  
            this.openTiles.sort((a: PathTile, b: PathTile) => a.g + a.h - b.g - b.h)
            break
          }
        }
      }
    }
  
    // unit is next to target
    if (Math.abs(targetX - x) < 2 && Math.abs(targetY - y) < 2) 
      this.pathTilePos = new Position(targetX, targetY)
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


interface IPathGrid extends IGrid {
  units: Tile[]
  target: number
  openTiles: PathTile[]
  closedTiles: PathTile[]
  pathTilePos: Position | null
  unitTurn: number
  stepIndex: number

  draw(canvasWidth: number, canvasHeight: number, ctx: CanvasRenderingContext2D, cameraTrans: cameraTrans): void

  resize(on: boolean): void

  step(pause: Function): void
}
