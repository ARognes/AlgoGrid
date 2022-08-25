import { GRID_LINE_WIDTH, TILE_SIZE } from '../constants'
import { mod } from '../setup'
import { Grid, IGrid } from './Grid'


export class LifeGrid extends Grid implements ILifeGrid {

  constructor(width: number, height = 0) {
    super(width, height)
  }

  draw(canvasWidth: number, canvasHeight: number, ctx: Context2D, cameraTrans: cameraTrans) {

    if (this.viewMode === GridViewMode.Simple) 
      return super.draw(canvasWidth, canvasHeight, ctx, cameraTrans)
    
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

  step() {

    // neighbor tile location in array is stores here
    let neighbors: number[] = new Array(8).fill(-1)
    let modifiedTiles = [...super.tiles]
    const gridLength = super.tiles.length 

    // filter out null or non-existant elements
    const filter = (i: number) => {
      let totalNeighbors = 0

      for (let neighbor of neighbors)
        grid.tiles[neighbor] && totalNeighbors++
      
      // Conway's Game of Life rules
      if (grid.tiles[i] in [TileEnum.Barrier, TileEnum.Target, TileEnum.Unit]) { 
        if (totalNeighbors < 2 || totalNeighbors > 3) modifiedTiles[i] = 0
      } else if (totalNeighbors === 3) modifiedTiles[i] = 1
      
      neighbors = new Array(8).fill(-1)
    }

    if (super.viewMode === GridViewMode.Normal) {
      for (let i = 0; i < gridLength; i++) {
        const k = mod(i, super.width)

        // find if neighbor grid.tiles right, left, up, and down exist, if so, get their address
        if (mod(k + 1, super.width) > k) neighbors[7] = i + 1
        if (mod(k - 1, super.width) < k) neighbors[3] = i - 1
        if (i - super.width >= 0) neighbors[1] = i - super.width
        if (i + super.width < gridLength) neighbors[5] = i + super.width

        // find if corner neighbor grid.tiles upright, upleft, downright, and downleft exist, if so, get their address
        if (neighbors[1] !== -1) {
          if (neighbors[7] !== -1) neighbors[0] = neighbors[1] + 1
          if (neighbors[3] !== -1) neighbors[2] = neighbors[1] - 1
        }
        if (neighbors[5] !== -1) {
          if (neighbors[7] !== -1) neighbors[6] = neighbors[5] + 1
          if (neighbors[3] !== -1) neighbors[4] = neighbors[5] - 1
        }

        filter(i)
      }
    } else {
      for (let i = 0; i < gridLength; i++) {
        const k = i - mod(i, super.width)

        // get all neighbor tiles references
        neighbors[7] = mod(i + 1, super.width) + k
        neighbors[3] = mod(i - 1, super.width) + k
        neighbors[1] = mod(i - super.width, gridLength)
        neighbors[5] = mod(i + super.width, gridLength)
        neighbors[0] = mod(neighbors[1] + 1, super.width) + neighbors[1] - mod(neighbors[1], super.width)
        neighbors[2] = mod(neighbors[1] - 1, super.width) + neighbors[1] - mod(neighbors[1], super.width)
        neighbors[6] = mod(neighbors[5] + 1, super.width) + neighbors[5] - mod(neighbors[5], super.width)
        neighbors[4] = mod(neighbors[5] - 1, super.width) + neighbors[5] - mod(neighbors[5], super.width)
      
        filter(i)
      }
    }

    grid.tiles = modifiedTiles
  }
}

// grid construction
export let grid = 
  new LifeGrid((window.innerWidth < window.innerHeight) 
           ? Math.floor(window.innerWidth / TILE_SIZE) 
           : Math.floor(window.innerHeight / TILE_SIZE)) // create grid to fill exactly or more than screen size

interface ILifeGrid extends IGrid {
  draw(canvasWidth: number, canvasHeight: number, ctx: Context2D, cameraTrans: cameraTrans): void

  step(): void
}
