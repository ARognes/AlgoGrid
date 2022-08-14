type deviceInfo = {
  isMobile: boolean
  canvasRatio: number
}

// type coordinate = {
//   x: number
//   y: number
// }

class coordinate {
  x: number
  y: number
  equals(other: coordinate): boolean {
    return this.x === other.x && this.y === other.y
  }
  constrain(min: number, max: number): coordinate {
    return new coordinate(
      Math.max(min, Math.min(max, this.x)),
      Math.max(min, Math.min(max, this.y))
    )
  }
}

type pointerActions = {
  primary: boolean
  scroll: boolean
}

type cameraTrans = {
  scale: number
  offset: coordinate
}

enum TileEnum { 
  Path,
  Closed,
  Open,
  Barrier,
  Target,
  Unit
}

class gridSubStep {
  pos: number
  revert: TileEnum
}

class resizeSubStep {
  width: number
  height: number
}

type subStep = gridSubStep | resizeSubStep

type step = subStep[] | null

interface IGrid {
  tilesCopy: TileEnum[] | null = null
  cursorGridPos: coordinate
  simple: boolean
  mode: GridMode
  lastMode: GridMode
  units
  target
  openTiles: TileEnum[]
  closedTiles: TileEnum[]
  pathTile
  unitTurn
  stepIndex
  width: number
  height: number
  tiles: TileEnum[]

  cartesianToIndex(x: number, y: number): number

  indexToCartesian(index: number): coordinate

  draw(): void

  resize(on: boolean): void

  setCursorGridPos(pos: coordinate): void
}

enum GridMode {
  None,
  Life,
  Pathfinding
}

type style = {
  fill: string
  stroke: string
  lineWidth: number
}