type deviceInfo = {
  isMobile: boolean
  canvasRatio: number
}

enum TileEnum { 
  None,
  Path,
  Closed,
  Open,
  Barrier,
  Target,
  Unit
}

enum GridMode {
  None,
  Life,
  Pathfinding
}

type pointerActions = {
  primary: boolean
  scroll: boolean
}

type cameraTrans = {
  scale: number
  offset: coordinate
}

class GridSubStep {
  pos: number
  type: TileEnum
  unit: number = -1

  constructor(pos: number, revert: TileEnum) {
    this.pos = pos
    this.revert = revert
  }
}

class ResizeSubStep {
  width: number
  height: number
}

type subStep = GridSubStep | ResizeSubStep

type step = subStep[] | null

type style = {
  fill: string
  stroke: string
  lineWidth: number
}
