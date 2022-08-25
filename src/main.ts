import { bound, fitCanvas, mod } from 'setup'
import { TILE_SIZE } from './constants'
import { grid, Grid } from './Models/Grid'
import { Position } from './Models/Position'
import { Tile } from './Models/Tile'

//#region initialize global variables and rendering functions

// camera view
export let canvas = document.getElementById('canvas') as HTMLCanvasElement
export let ctx = canvas.getContext('2d') as Context2D
export let cameraTrans: cameraTrans = { scale: 1, offset: new Position(0, 0) }

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', () => {
  cameraTrans.offset.x -= (canvas.width - window.innerWidth) / 2
  cameraTrans.offset.y -= (canvas.height - window.innerHeight) / 2
  ;({ isMobile, canvasRatio } = fitCanvas(canvas, ctx))
  requestAnimationFrame(draw) // redraw canvas
}, false)

// called reactively
function draw() {

  // clamp camera position so at least 1 tile is always on screen
  const gridPixelWidth = TILE_SIZE * cameraTrans.scale
  const gridPixelHeight = TILE_SIZE * cameraTrans.scale

  cameraTrans.offset.x = bound(cameraTrans.offset.x, 
                               gridPixelWidth * (1 - grid.width), // Min: 1 tile from left edge
                               canvas.width - gridPixelWidth) // Max: 1 tile from right edge
  cameraTrans.offset.y = bound(cameraTrans.offset.y, 
                               gridPixelHeight * (1 - grid.height), // Min: 1 tile from top edge
                               canvas.height - gridPixelHeight) // Max: 1 tile from bottom edge

  // transform the camera
  ctx.setTransform(1,0,0,1,0,0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.translate(cameraTrans.offset.x, cameraTrans.offset.y)
  ctx.scale(cameraTrans.scale, cameraTrans.scale)

  grid.draw(canvas.width, canvas.height, ctx, cameraTrans)
}

let { isMobile, canvasRatio } = fitCanvas(canvas, ctx)


// input variables, mobile uses a few more in the mobile seciton of input region
let pointerPos: Position = new Position(0, 0)
let deltaPointer: Position = new Position(0, 0)
let pointerActions: pointerActions = { primary: false, scroll: false }
let pointerSpread = 0

// tile drawing variables
let tileMode = 1
let viewOnly = false
let eraser = true
let erasing = false

// undo redo steps
const UNDO_STEPS = 80  // arbitrary constraint
let steps: step[] = []
let futureSteps: step[] = []

// playing frames
let playSpeed = 2
let frameInterval: number | null

const ZOOM_AMOUNT = 0.1
const ZOOM_MIN = 0.2 * Math.max(window.innerWidth, window.innerHeight) / 1200  // this allows smaller screens to zoom almost the same amount as larger screens
const ZOOM_MAX = 80 * ZOOM_MIN

// center camera based off grid
cameraTrans.offset.x = canvas.width / 2 - grid.width * TILE_SIZE / 2
cameraTrans.offset.y = canvas.height / 2 - grid.height * TILE_SIZE / 2

requestAnimationFrame(draw) // redraw canvas

//#endregion

//#region input
if (isMobile) {
  canvas.addEventListener('touchstart', (event: TouchEvent) => {
    if (event.touches.length > 2) return  // don't bother with 3 finger gestures
    if (!viewOnly) {
      steps.push(null) // add empty step to mark where step started
      futureSteps = []
    }
  
    // set deltaPointer to (0, 0) as this is the reference point, then set pointerPos as first touch position
    deltaPointer.x = 0
    deltaPointer.y = 0
    pointerPos.x = event.touches[0].clientX * canvasRatio
    pointerPos.y = event.touches[0].clientY * canvasRatio
  
    grid.setCursorGridPos(cursorToGrid(pointerPos))

    // touchStart on last tile, resize grid
    if (grid.cursorGridPos.x === grid.width && grid.cursorGridPos.y === grid.height) {
      if (frameInterval) playPause()
      let step: step = []

      for (let i = 0; i < grid.tiles.length; i++) 
        step.push(<gridSubStep> { pos: i, revert: grid.tiles[i] })

      step.push(<resizeSubStep> { width: grid.width, height: grid.height })
      steps.push(step)
      grid.resize(true)
      console.log('Resize')
    }
  
    // if second finger is pressed on mobile, scrolling begins and anything done by the first finger is undone
    if (event.touches.length === 2) {  
      pointerActions.scroll = true
      pointerSpread = 0  // set pointerSpread to 0 as this is the reference value for scrolling
  
      if (!viewOnly) { // if viewOnly = true then the tiles and steps were never changed in the first place
        if (steps[steps.length-3] === null) {                    // if first touch only affected one tile
          steps.pop()                              // remove null step pushed from second touch
          grid.tiles[steps[steps.length-1].pos] = steps[steps.length-1].revert   // undo tile affected by first touch
          steps.pop()                              // remove first touch step
          steps.pop()                              // remove null step pushed from first touch
        } else {          // if first touch moved and affected more than one tile
          steps.pop()      // remove null step pushed from second touch
          condenseArray(steps)   // count the first touch movement as a step
        }
      }
    } else if (!viewOnly && !grid.tilesCopy) {
      pointerActions.primary = true
      styleTiles(tileMode)
      requestAnimationFrame(draw)
    }
  }, false)
  document.addEventListener('touchend',  touchEnd, false)
  document.addEventListener('touchcancel', touchEnd, false)
  function touchEnd(event: TouchEvent) {
    grid.resize(false)
    if (event.touches.length > 2) return  // don't bother with 3 finger gestures
    if (!pointerActions.primary && !pointerActions.scroll) return   // html buttons shouldn't be pressed over canvas
    if (!viewOnly && !pointerActions.scroll) condenseArray(steps)
    pointerActions.primary = false
    pointerActions.scroll = false
    erasing = false
  }
  
  canvas.addEventListener('touchmove', (event: TouchEvent) => {
  
    const _pointerPos = new Position(event.touches[0].clientX * canvasRatio,
                                     event.touches[0].clientY * canvasRatio)
    grid.setCursorGridPos(cursorToGrid(_pointerPos))
  
    // only update deltaPointer if not used for scrolling
    if (!pointerActions.scroll) 
      deltaPointer = new Position(_pointerPos.x - pointerPos.x, 
                                  _pointerPos.y - pointerPos.y)
    
    // pointerPos = _pointerPos;
    pointerPos.x = _pointerPos.x
    pointerPos.y = _pointerPos.y
  
    if (pointerActions.scroll) {
      const touchEnd = new Position(event.touches[1].clientX * canvasRatio,
                                    event.touches[1].clientY * canvasRatio)
  
      // get vector from touch 0 to 1, then get distance
      const xDist = touchEnd.x - _pointerPos.x
      const yDist = touchEnd.y - _pointerPos.y
      const spread = Math.sqrt(xDist * xDist + yDist * yDist)
  
      // pointerSpread was set to 0 when 2nd finger pointerDown, so make sure deltaSpread will be 0
      if (pointerSpread === 0) pointerSpread = spread
      const deltaSpread = (pointerSpread - spread) * 0.0625
      pointerSpread = spread
  
      // current spread center
      const spreadCenter = new Position((touchEnd.x + pointerPos.x) * 0.5, (touchEnd.y + pointerPos.y) * 0.5)
  
      // deltaPointer was set to (0, 0) when any touch pointerDown and hasn't changed if scrolling, so make sure deltaPointerCenter will be (0, 0)
      if (!deltaPointer.x && !deltaPointer.y) deltaPointer = spreadCenter
      const deltaSpreadCenter = new Position(spreadCenter.x - deltaPointer.x, spreadCenter.y - deltaPointer.y)
      deltaPointer = spreadCenter
  
      zoom(deltaSpread, spreadCenter)
      cameraTrans.offset.x += deltaSpreadCenter.x
      cameraTrans.offset.y += deltaSpreadCenter.y
    } else if (
      erasing 
      || (!grid.tilesCopy 
        && !viewOnly 
        && pointerActions.primary 
        && (tileMode === 0 || tileMode === 1)))
          styleTiles(tileMode)
    
    requestAnimationFrame(draw)
  
  }, false)
}

canvas.addEventListener('mousedown', (event: MouseEvent) => {
  console.log(event.button)
  if (event.button === 1) { // scroll
    pointerActions.scroll = true
    if (pointerActions.primary) {
      pointerActions.primary = false
      condenseArray(steps)
      erasing = false
    }
  }
  if (event.button > 0) return
  deltaPointer = new Position(0, 0)
  pointerPos = new Position(event.x, event.y)

  grid.setCursorGridPos(cursorToGrid(pointerPos))
  if (grid.cursorGridPos.x === grid.width && grid.cursorGridPos.y === grid.height) {
    if (frameInterval) playPause()
    let step = []
    for (let i = 0; i < grid.tiles.length; i++)
      step.push({ pos: i, revert: grid.tiles[i] })

    step.push({ width: grid.width, height: grid.height })
    steps.push(step)
    grid.resize(true)
    console.log('Resize')
  }

  if (viewOnly || grid.tilesCopy) return

  steps.push(null) // add empty step to mark where step started
  futureSteps = []
  pointerActions.primary = true
  styleTiles(tileMode)
  requestAnimationFrame(draw)
}, false)

document.addEventListener('mouseup', (event: MouseEvent) => {
  grid.resize(false)
  if (!pointerActions.primary && !pointerActions.scroll) return   // html buttons pressed over canvas
  if (!viewOnly && !pointerActions.scroll) condenseArray(steps)
  pointerActions.primary = false
  pointerActions.scroll = false
  erasing = false
}, false)

document.addEventListener('mousemove', (event: MouseEvent) => {
  if (event.button === 2) return
  deltaPointer = new Position(event.x - pointerPos.x, 
                              event.y - pointerPos.y)
  pointerPos = new Position(event.x, event.y)
  grid.setCursorGridPos(cursorToGrid(pointerPos))

  if (pointerActions.scroll) {
    cameraTrans.offsetX += deltaPointer.x
    cameraTrans.offsetY += deltaPointer.y
  } else if (
    erasing 
    || (!grid.tilesCopy 
      && !viewOnly 
      && pointerActions.primary 
      && (tileMode === 0 || tileMode === 1)))
        styleTiles(tileMode)
  
  requestAnimationFrame(draw)
}, false)

canvas.addEventListener('wheel', (event: WheelEvent) => {
  console.log('wheel', event)
  zoom(Math.sign(event.deltaY), pointerPos)
  requestAnimationFrame(draw)
}, false)

/**
 *  pc key input
 */
document.addEventListener('keydown', (event: KeyboardEvent) => {
  let key = event.keyCode

  // undo and redo shortcut keys
  if (event.ctrlKey) {
    if (key === 90) undo()
    else if (key === 89) redo()
    return
  }

  if (key === 32) playPause()
  else if (key === 65) stepAlgo(false)
  else if (key === 82) setTileMode(1)
  else if (key === 83) setTileMode(2)
  else if (key === 84) setTileMode(3)
})


let menuMoving = 100
const barMenuDiv = document.getElementById('barMenu') as HTMLDivElement
const frameBarDiv = document.getElementById('framebar') as HTMLDivElement
const toolBarDiv = document.getElementById('toolbar') as HTMLDivElement
const eraserBtn = document.getElementById('eraser') as HTMLButtonElement

barMenuDiv.style.bottom = '-120px'
frameBarDiv.style.bottom = '0px'

/**
 * Bar menu dip animation. Calls itself every step until animation is finished.
 * Menu dips down, changes out of view, then pops back up.
 * 
 * @param {*} dir   direction, true: down then false: up, used in animation
 * @param {*} newMode grid.mode changing to
 */
function dipAnimation(dir: boolean, newMode: GridMode) {
  if (dir) {
    if (grid.mode === newMode) return
    menuMoving += (100 - menuMoving) * 0.05
    if (menuMoving > 99) {
      if (frameInterval) playPause()
      dir = false
      grid.setMode(newMode)
      console.log('Mode:', newMode)
      if (grid.mode === GridMode.Life) {
        ;(toolBarDiv.children[0] as HTMLInputElement).checked = true
        ;(toolBarDiv.children[2] as HTMLInputElement).checked = true
        
        eraser = true
        tileMode = 1
        viewOnly = false
      }
      requestAnimationFrame(draw)
    }
  } else {
    menuMoving *= 0.95
    if (menuMoving < 1) menuMoving = 0
  }

  // Animate
  if (grid.mode === GridMode.Life) {
    barMenuDiv.style.bottom = '-120px'
    frameBarDiv.style.bottom = (134 - menuMoving) + 'px'
  }
  else if (grid.mode === GridMode.Pathfinding) {
    if (menuMoving > 20) 
      barMenuDiv.style.bottom = 20 - menuMoving + 'px'

    frameBarDiv.style.bottom = (67 - menuMoving) + 'px'
  }

  if (menuMoving) setTimeout(() => dipAnimation(dir, newMode), 1)
}
//dipAnimation(true, 'life');

//#endregion

//#region input helper functions

/**
 *  given an array of sub-arrays, this collects sub-arrays until it reaches a null element,
 *  combines the sub-arrays into a large sub-array,
 *  and places them back into the main array where the null element was.
*/
function condenseArray(ar: any[]) {
  let step = []
  let i = ar.length-1
  while (ar[i] != null) {
    step.push(ar.pop())
    i--
  }
  ar.pop()
  if (step.length > 0) ar.push(step)
  if (ar.length > UNDO_STEPS) ar.shift()  // remove first (oldest) element if array is 'full'
}

// find and change the styles of the tiles the mouse is and has hovered over using deltaPointer movement
function styleTiles(style: TileEnum) {

  // translate cursor screen coordinates into grid coordinates
  let { x: gx, y: gy } = cursorToGrid(pointerPos)
  checkTile(gx, gy, style)

  if (!deltaPointer.x && !deltaPointer.y) return

  // translate last step cursor screen coordinates into grid coordinates
  const lastCursorPos = new Position(pointerPos.x - deltaPointer.x, 
                                     pointerPos.y - deltaPointer.y)
  const { x: hx, y: hy } = cursorToGrid(lastCursorPos)

  // edit tiles in-between cursor movement to ensure closed line is drawn
  while ((hx != gx || hy != gy)) {
    gx -= Math.sign(gx - hx)
    gy -= Math.sign(gy - hy)
    checkTile(gx, gy, style)
  }
}

// Scale/Translate by cameraTrans
function cursorToGrid(pos: Position): Position {
  return new Position(Math.floor(((pos.x - cameraTrans.offset.x) / cameraTrans.scale) / TILE_SIZE), 
                      Math.floor(((pos.y - cameraTrans.offset.y) / cameraTrans.scale) / TILE_SIZE))
}

// check that the tile tileType is different from the current tileType, erase if first tile pressed is equal to current tileType
function checkTile(gx: number, gy: number, tileType: TileEnum) {
  if ((!grid.simple || grid.mode === GridMode.Pathfinding) // No wrap in Pathfinding or non-simple mode
      && !Grid.within(grid, gx, gy)) 
        return

  let mgx = mod(gx, grid.width)
  let mgy = mod(gy, grid.height)
  const pos = mgx + mgy * grid.width
  if (eraser && !deltaPointer.x && !deltaPointer.y && grid.tiles[pos] === tileType) erasing = true
  if (erasing) tileType = TileEnum.None

  const ignoreTileTypes = [TileEnum.Path, TileEnum.Closed]
  const erasingPathTile = (grid.tiles[pos] in ignoreTileTypes && tileType === TileEnum.None)
  const newSameAsOld = grid.tiles[pos] === tileType

  if (newSameAsOld || erasingPathTile) return

  const pathTiles = [TileEnum.Path, TileEnum.Closed, TileEnum.Open, TileEnum.Target, TileEnum.Unit]
  const removingPathTile = grid.tiles[pos] in pathTiles
  const newIsTarget = tileType === TileEnum.Target

  if (newIsTarget || removingPathTile) {
    grid.clearPathfinding()
    if (frameInterval) playPause()
  }

  const gridSubStep = new GridSubStep(pos, grid.tiles[pos])

  if (grid.tiles[pos] === TileEnum.Target) grid.target = null
  else if (grid.tiles[pos] === TileEnum.Unit) {
    let removeUnit = 0

    grid.units.forEach((unit: Tile, i: number) => {
      if (unit.x + unit.y * grid.height === pos) removeUnit = i
    })
    gridSubStep.unit = removeUnit

    grid.units.splice(removeUnit, 1)             // remove this removeUnit from grid.units
    if (grid.unitTurn === removeUnit) grid.clearPathfinding()
  }

  const subStep = [gridSubStep]
  steps.push(subStep)

  if (tileType === 2) {
    grid.tiles[grid.target] = 0
    grid.target = pos
  }
  else if (tileType === 3) grid.units.push(new Tile(mgx, mgy, TileEnum.None)) //grid.units.push({done: false, x: mgx, y: mgy});
  grid.tiles[pos] = tileType                // set tile
}

// zoom in or out from the reference point
function zoom(amount, referencePoint) {
  const oldScale = cameraTrans.scale
  cameraTrans.scale -= ZOOM_AMOUNT * amount * Math.abs(cameraTrans.scale) // scale slower when further away and vice versa
  cameraTrans.scale = Math.min(Math.max(cameraTrans.scale, ZOOM_MIN), ZOOM_MAX) // clamp scale to final variables
  if (Math.abs(cameraTrans.scale-1) < ZOOM_AMOUNT * 0.2) cameraTrans.scale = 1 // ensure default scale 1 can always be reached

  // offset the position by the difference in mouse position from before to after scale
  cameraTrans.offsetX = (referencePoint.x - (referencePoint.x - cameraTrans.offsetX) * (cameraTrans.scale / oldScale))
  cameraTrans.offsetY = (referencePoint.y - (referencePoint.y - cameraTrans.offsetY) * (cameraTrans.scale / oldScale))
}

//#endregion

//#region html function calls

function setTileMode(newTileMode) {
  if (newTileMode === -1) {
    eraser = eraserBtn.checked  // if eraser button is pressed, toggle eraser
    viewOnly = !eraser
    if (tileMode !== 0) viewOnly = false
  } else {
    viewOnly = false
    if (tileMode === newTileMode) {
      tileMode = 0
      viewOnly = !eraser
      let tools = toolBarDiv.children
      for (let i=2; i < tools.length; i += 2) tools[i].checked = false  // uncheck all radio type tools
    } else tileMode = newTileMode
  }
}

/**
 * Undo and redo use Arrays to hold steps.
 * Array steps and futureSteps hold Arrays of individual tile changes called step and futureStep.
 * On undo, a step from steps is undone and passed to futureSteps.
 * There is an arbitrary constant UNDO_STEPS to decide how many steps are saved.
 * There are no undo branches, user input erases futureSteps
 *
 * grid targets are a whole other miserable ball game.
 */
function undo() {
  if (steps.length <= 0 || frameInterval) return
  const futureStep: step = []
  const step = steps.pop()
  if (!step) return
  
  console.log('undo')
  step.forEach(subStep => {
    if (subStep === null) return

    if (subStep instanceof gridSubStep) {
      const subStepType = grid.tiles[subStep.pos]
      futureStep.push(new gridSubStep(subStep.pos, subStepType))  // add tile to futureStep
    
      grid.tiles[subStep.pos] = subStep.type                  // set tile
      
      if (subStepType === TileEnum.Target) grid.target = null
      else if (subStepType === TileEnum.Unit) {
        futureStep[futureStep.length - 1].unit = subStep.unit // add unit index to last future subStep
        grid.units.splice(subStep.unit, 1)                  // remove unit index from grid.units
      }

      if (subStep.revert === 2) grid.target = subStep.pos
      else if (subStep.revert === 3) {                        // if tile is now a unit
        grid.units.splice(subStep.unit, 0, subStep.pos)          // add tile position to grid.units on index unit
        futureStep[futureStep.length-1].unit = subStep.unit  // add unit information to futureStep
      }
    } else if (subStep.width && subStep.height) {                   // add gridSize to futureStep
      futureStep.push({width: grid.width, height: grid.height})   
      grid.resize(true)
      const saveCursorPos = grid.cursorGridPos
      grid.setCursorGridPos(new Position(subStep.width, subStep.height))
      grid.resize(false)
      grid.setCursorGridPos(saveCursorPos)
    }
  })
  futureSteps.push(futureStep)
  requestAnimationFrame(draw)
}


// inverse function of undo
function redo() {
  if (futureSteps.length <= 0 || frameInterval) return
  const step: step = []
  const futureStep = futureSteps.pop()
  if (!futureStep) return

  console.log('redo')
  futureStep.forEach(subStep => {
    
    if (subStep instanceof gridSubStep) {
      let subStepTile = grid.tiles[subStep.pos]
      grid.tiles[subStep.pos] = subStep.revert // edit tile if coordinates are on grid
      
      // save current tile to undo steps
      step.push({ pos: subStep.pos, revert: subStepTile })
      if (subStepTile === 2) grid.target = null
      else if (subStepTile === 3) {
        step[step.length-1].unit = subStep.unit
        grid.units.splice(subStep.unit, 1)
      }
      
      // redo this tile to its revert
      if (subStep.revert === 2) grid.target = subStep.pos
      else if (subStep.revert === 3) {
        grid.units.splice(subStep.unit, 0, { x: subStep.pos % grid.width, y: Math.floor(subStep.pos / grid.width) })
        step[step.length-1].unit = subStep.unit
      }
    } else if (subStep.width && subStep.height) {                   // add gridSize to futureStep
      step.push({ width: grid.width, height: grid.height })  
      grid.resize(true)
      const saveCursorPos = grid.cursorGridPos
      grid.setCursorGridPos({ x: subStep.width, y: subStep.height })
      grid.resize(false)
      grid.setCursorGridPos(saveCursorPos)
    }
  })
  steps.push(step)
  requestAnimationFrame(draw)
}


// call fullscreen methods compatible for all browsers, retrieved from: https://developers.google.com/web/fundamentals/native-hardware/fullscreen/
function toggleFullscreen() {
  let doc = window.document
  let docEl = doc.documentElement

  let requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen
  let cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen

  if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) requestFullScreen.call(docEl)
  else cancelFullScreen.call(doc)
}

// set frame speed from html slider, [1 - 100]
function setFrameSpeed() {
  playSpeed = document.getElementById("frameSpeed").value
  if (playSpeed > 9) playSpeed = (playSpeed-9) * 10
  document.getElementById("frameSpeedText").innerHTML = "x" + playSpeed
  clearInterval(frameInterval)
  if (frameInterval) frameInterval = setTimeout(stepAlgo, 1000 / playSpeed)
}

function setSimpleViewMode() {
  grid.simple = !grid.simple;
  const simpleViewModeDiv = <HTMLDivElement> document.getElementById('simpleViewMode')
  if (grid.simple) {
    canvas.style.backgroundColor = '#000'
    simpleViewModeDiv.style.backgroundColor = '#888'
    simpleViewModeDiv.style.transform = 'translateY(2px)'
    simpleViewModeDiv.style.boxShadow = '0 4px #666'
  } else {
    canvas.style.backgroundColor = '#a99'
    simpleViewModeDiv.style.backgroundColor = '#222'
    simpleViewModeDiv.style.transform = 'translateY(-4px)'
    simpleViewModeDiv.style.boxShadow = '0 10px #666'
  }
  requestAnimationFrame(draw);
}

/**
 * 
 * @param {*} keepPlaying keeps pathfinding running at play speed
 */
function stepAlgo(keepPlaying = true) {

  if (!keepPlaying && frameInterval) playPause()  // step pressed while playing, now pause
  futureSteps = [] // empty undo and redo steps
  let paused = false // Don't keep playing if stepPathfinding calls pause
  let pause = () => {
    if (!frameInterval) return
    playPause()
    paused = true
  }
  grid.step(pause)

  // grid.mode === GridMode.Pathfinding ? stepPathfinding(grid, pause) : stepLife(grid)  // step selected algorithm
  requestAnimationFrame(draw)
  if (keepPlaying && !paused) frameInterval = setTimeout(stepAlgo, 1000 / playSpeed) // keep playing at playSpeed
  // UNDOING Algos must be rethought out
}

/**
 * 
 * Toggles whether frameInterval is set or not, along with button ux
 */

function playPause() {
  if (grid.mode !== GridMode.Life && !frameInterval && (grid.target === null || grid.units.length === 0)) return toast('Must place unit and target!') // Don't play pathfinding without target/units
  console.log((frameInterval ? 'Pause' : 'Play'), grid.mode)

  const playBtn = <HTMLButtonElement> document.getElementById('playBtn') // Flip button
  if (!frameInterval) {
    futureSteps = [] // Don't allow redo, new timeline
    let step = []
    grid.tiles.forEach((tile, i) => step.push({ pos: i, revert: tile }))
    steps.push(step)
    stepAlgo(true) // Begin playing
    playBtn.style.backgroundColor = '#888'
    playBtn.style.transform = 'translateY(2px)'
    playBtn.style.boxShadow = '0 4px #666'
    playBtn.innerHTML = 'II'
  } else {
    clearInterval(frameInterval) // Stop playing
    frameInterval = null
    playBtn.style.backgroundColor = '#222'
    playBtn.style.transform = 'translateY(-4px)'
    playBtn.style.boxShadow = '0 10px #666'
    playBtn.innerHTML = 'Play'
  }
}

//#endregion

//#region debug

// return a string displaying undo/redo steps. (#, #) are complete steps, (#, 6) shows number of changed tiles in current step
function logSteps() {
  let str = '('
  let i = 0
  while (steps[i]) {
    str += '#, '
    i++
  }
  if (steps.length > i) str += (steps.length-1 - i) + ')'
  else str = str.substr(0, str.length - 2) + '')'
  if (str.length === 1) str = '()'
  return str
}

//#endregion

//#region DOM

// debug system
let debug = document.getElementById('debug') as HTMLDivElement
let debugBox = document.getElementById('debug-box') as HTMLDivElement
let toastTimer: number

function toast(str: string) {
  clearInterval(toastTimer)
  debug.style.display = 'block'
  debug.style.opacity = String(1)
  debug.style.filter = 'alpha(opacity=100)'
  debugBox.innerHTML = str

  let op = 16
  toastTimer = setInterval(() => {
    op -= op * 0.1
    if (op > 1) return
    if (op <= 0.01) {
      clearInterval(toastTimer)
      debug.style.display = 'none'
    }
    debug.style.opacity = String(op)
    debug.style.filter = 'alpha(opacity=' + op * 100 + ')'
  }, 50)
}

// menu system
let menus = Array.from(document.getElementsByClassName('menu') as HTMLCollectionOf<HTMLDivElement>)
;(document.getElementById('start-btn') as HTMLButtonElement).onclick = () => {
	menus[1].style.display = 'none'
	menus[0].style.display = 'block'
}

const canvasMask = document.getElementById('canvas-mask') as HTMLDivElement
const optionsMenu = document.getElementById('options-menu') as HTMLDivElement

const btnLife = document.getElementById('btn-Life') as HTMLButtonElement
btnLife.onclick = () => menuButton(GridMode.Life)

const btnPathfinding = document.getElementById('btn-Pathfinding') as HTMLButtonElement
btnPathfinding.onclick = () => menuButton(GridMode.Pathfinding)

function menuButton(gridMode: GridMode) {
  canvasMask.style.display = 'none'
  menus[0].style.display = 'none'
  menuMoving = 100
  dipAnimation(true, gridMode)
  optionsMenu.style.display = 'block'
}


;(document.getElementById('simpleViewMode') as HTMLButtonElement).onclick = () => setSimpleViewMode()
;(document.getElementById('fullscreen') as HTMLButtonElement).onclick = () => toggleFullscreen()
;(document.getElementById('stepBtn') as HTMLButtonElement).onclick = () => stepAlgo(false)
;(document.getElementById('playBtn') as HTMLButtonElement).onclick = () => playPause()
;(document.getElementById('frameSpeed') as HTMLButtonElement).oninput = () => setFrameSpeed()
;(document.getElementById('eraser') as HTMLButtonElement).onclick = () => setTileMode(-1)
;(document.getElementById('barrier') as HTMLButtonElement).onclick = () => setTileMode(1)
;(document.getElementById('target') as HTMLButtonElement).onclick = () => setTileMode(2)
;(document.getElementById('unit') as HTMLButtonElement).onclick = () => setTileMode(3)
;(document.getElementById('undo') as HTMLButtonElement).onclick = () => undo()
;(document.getElementById('redo') as HTMLButtonElement).onclick = () => redo()
;(document.getElementById('settings') as HTMLButtonElement).onclick = () => {
  if (menuMoving) return
  if (grid.mode === GridMode.None) {
    canvasMask.style.display = 'none'
    menus[0].style.display = 'none'
    menuMoving = 100
    dipAnimation(true, grid.lastMode)
    return;
  }
  if (grid.simple) setSimpleViewMode()
  dipAnimation(true, GridMode.None)
  menus[0].style.display = 'block'
  canvasMask.style.display = 'block'
  grid.clearPathfinding()
  requestAnimationFrame(draw)
}
//#endregion
