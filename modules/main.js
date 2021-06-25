'use-strict';

import { fitCanvas } from '/modules/setup.js';
import { TILE_SIZE, canvas, ctx, cameraTrans, grid } from '/modules/grid.js';
import { stepPathfinding } from '/modules/pathfinding.js';
import { stepLife } from '/modules/game-of-life.js';

//#region initialize global variables and rendering functions

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', () => {
  cameraTrans.offsetX -= (canvas.width - window.innerWidth) / 2;
  cameraTrans.offsetY -= (canvas.height - window.innerHeight) / 2;
  ({ isMobile, canvasRatio } = fitCanvas(canvas, ctx));
  requestAnimationFrame(draw); // redraw canvas
}, false);

// called reactively
function draw() {

  // clamp camera position so at least 1 tile is always on screen
  const gridPixelWidth = TILE_SIZE * cameraTrans.scale;
  const gridPixelHeight = TILE_SIZE * cameraTrans.scale;
  cameraTrans.offsetX = Math.min(Math.max(cameraTrans.offsetX, gridPixelWidth * (1 - grid.width)), (canvas.width - gridPixelWidth));
  cameraTrans.offsetY = Math.min(Math.max(cameraTrans.offsetY, gridPixelHeight * (1 - grid.height)), (canvas.height - gridPixelHeight));

  // transform the camera
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.translate(cameraTrans.offsetX, cameraTrans.offsetY);
  ctx.scale(cameraTrans.scale, cameraTrans.scale);

  grid.draw();
}

let { isMobile, canvasRatio } = fitCanvas(canvas, ctx);


// input variables, mobile uses a few more in the mobile seciton of input region
let pointerPos = {x: 0, y: 0};
let deltaPointer = {x: 0, y: 0};
let pointerActions = {primary: false, scroll: false};
let pointerSpread = 0;

// tile drawing variables
let tileMode = 1;
let viewOnly = false;
let eraser = true;
let erasing = false;

// undo redo steps
const UNDO_STEPS = 80;  // arbitrary constraint
let steps = [];
let futureSteps = [];

// playing frames
let playSpeed = 2;
let frameInterval;

const ZOOM_AMOUNT = 0.1;
const ZOOM_MIN = 0.1 * Math.max(window.innerWidth, window.innerHeight) / 1200;  // this allows smaller screens to zoom almost the same amount as larger screens
const ZOOM_MAX = 16 * Math.max(window.innerWidth, window.innerHeight) / 1200;

// center camera based off grid
cameraTrans.offsetX = canvas.width / 2 - grid.width * TILE_SIZE / 2;
cameraTrans.offsetY = canvas.height / 2 - grid.height * TILE_SIZE / 2;

requestAnimationFrame(draw); // redraw canvas

//#endregion

//#region input
canvas.addEventListener('touchstart', (event) => {
  if (event.touches.length > 2) return;  // don't bother with 3 finger gestures
  if (!viewOnly) {
    steps.push(null); // add empty step to mark where step started
    futureSteps = [];
  }

  // set deltaPointer to (0, 0) as this is the reference point, then set pointerPos as first touch position
  deltaPointer = {x : 0, y : 0};
  pointerPos = {x : event.changedTouches[0].clientX * canvasRatio,
                y : event.changedTouches[0].clientY * canvasRatio};

  grid.setCursorGridPos(cursorToGrid(pointerPos.x, pointerPos.y));
  if (grid.cursorGridPos.x === grid.width && grid.cursorGridPos.y === grid.height) {
    if (frameInterval) playPause();
    let step = [];
    grid.tiles.forEach((tile, i) => step.push({pos: i, revert: tile}));
    step.push({width: grid.width, height: grid.height});
    steps.push(step);
    grid.resize(true);
    console.log('Resize');
  }

  if (event.touches.length === 2) {  // if second finger is pressed on mobile, scrolling begins and anything done by the first finger is undone
    pointerSpread = 0;  // set pointerSpread to 0 as this is the reference point

    if (!viewOnly) { // if viewOnly = true then the tiles and steps were never changed in the first place
      if (steps[steps.length-3] === null) {                    // if first touch only affected one tile
        steps.pop();                              // remove null step pushed from second touch
        grid.tiles[steps[steps.length-1].pos] = steps[steps.length-1].revert;   // undo tile affected by first touch
        steps.pop();                              // remove first touch step
        steps.pop();                              // remove null step pushed from first touch
      } else {          // if first touch moved and affected more than one tile
        steps.pop();      // remove null step pushed from second touch
        condenseArray(steps);   // count the first touch movement as a step
      }
      //document.getElementById("debug").innerHTML = logSteps();
    }
  }

  if (event.touches.length === 2) pointerActions.scroll = true;
  else if (!viewOnly && !grid.tilesCopy) {
    pointerActions.primary = true;
    styleTiles(tileMode);
    requestAnimationFrame(draw);
  }
}, false);
document.addEventListener('touchend',  touchEnd, false);
document.addEventListener('touchcancel', touchEnd, false);
function touchEnd(event) {
  /*if (touchStartX && event.changedTouches.length === 1 && !menuMoving && Math.abs(touchStartX - event.changedTouches[0].clientX) > 20 && Date.now() - timeTouchStart < 300 && rangeStartValue === playSpeed) {
    clearInterval(frameInterval);
    if (grid.simple) setSimpleViewMode();
    dipAnimation(true, (grid.mode + Math.sign(touchStartX - event.changedTouches[0].clientX)).mod(3));
  }*/
  grid.resize(false);
  if (event.touches.length > 2) return;  // don't bother with 3 finger gestures
  if (!pointerActions.primary && !pointerActions.scroll) return;   // html buttons shouldn't be pressed over canvas
  if (!viewOnly && !pointerActions.scroll) condenseArray(steps);
  pointerActions.primary = false;
  pointerActions.scroll = false;
  erasing = false;
}

canvas.addEventListener('touchmove', (event) => {

  // only update deltaPointer if not used for scrolling
  if (!pointerActions.scroll) deltaPointer = {x: event.changedTouches[0].clientX - pointerPos.x, y: event.changedTouches[0].clientY - pointerPos.y};
  pointerPos = {x : event.changedTouches[0].clientX * canvasRatio,
    y : event.changedTouches[0].clientY * canvasRatio};

  if (pointerActions.scroll) {
    // get vector from touch 0 to 1, then get distance
    const xDist = (event.touches[1].clientX - event.touches[0].clientX);
    const yDist = (event.touches[1].clientY - event.touches[0].clientY);
    const spread = Math.sqrt(xDist * xDist + yDist * yDist);

    // pointerSpread was set to 0 when 2nd finger pointerDown, so make sure deltaSpread will be 0
    if (pointerSpread === 0) pointerSpread = spread;
    const deltaSpread = (pointerSpread - spread) / 16;
    pointerSpread = spread;

    // current pointer center
    const pointerCenter = {x: (event.changedTouches[1].clientX + pointerPos.x)/2, y: (event.changedTouches[1].clientY + pointerPos.y)/2};

    // deltaPointer was set to (0, 0) when any touch pointerDown and hasn't changed if scrolling, so make sure deltaPointerCenter will be (0, 0)
    if (!deltaPointer.x && !deltaPointer.y) deltaPointer = pointerCenter;
    const deltaPointerCenter = {x: (pointerCenter.x - deltaPointer.x), y: (pointerCenter.y - deltaPointer.y)};
    deltaPointer = pointerCenter;

    zoom(deltaSpread, pointerCenter);
    cameraTrans.offsetX += deltaPointerCenter.x;
    cameraTrans.offsetY += deltaPointerCenter.y;
  } else if ((erasing || (pointerActions.primary && (tileMode === 0 || tileMode === 1)) && !viewOnly) && !grid.tilesCopy) styleTiles(tileMode);
  requestAnimationFrame(draw);

}, false);

//#region menuBarSwipe
let touchStartX = 0;
let timeTouchStart = 0;
let rangeStartValue = 2;
/*
document.getElementById("barmenu").addEventListener('touchstart', (event) => {
  if (event.touches.length === 1) {
    touchStartX = event.changedTouches[0].clientX;
    timeTouchStart = Date.now();
    rangeStartValue = playSpeed;
  }
}, false);

document.getElementById("barmenu").addEventListener('touchmove', (event) => {
  if (touchStartX && event.touches.length === 1) {
    touchEndX = event.touches[0].clientX - touchStartX;

    // if menu isn't already moving and swipe is within standard 0.3 seconds and at least 20 pixels big, or has reached the bottom of the screen
    if (!menuMoving && ((event.touches[0].clientX >= canvas.height - 20) || (touchEndX > 20 && Date.now() - timeTouchStart < 300))) {
      if (frameInterval) playLife();
      if (grid.simple) setSimpleViewMode();
      dipAnimation(true);
    }
  }
}, false);*/
//#endregion

canvas.addEventListener("mousedown", (event) => {
  if (event.button === 1) { // scroll
    pointerActions.scroll = true;
    if (pointerActions.primary) {
      pointerActions.primary = false;
      condenseArray(steps);
      erasing = false;
    }
  }
  if (event.button > 0) return;
  deltaPointer = {x : 0, y : 0};
  pointerPos = {x : event.x, y : event.y};

  grid.setCursorGridPos(cursorToGrid(event.x, event.y));
  if (grid.cursorGridPos.x === grid.width && grid.cursorGridPos.y === grid.height) {
    if (frameInterval) playPause();
    let step = [];
    grid.tiles.forEach((tile, i) => step.push({pos: i, revert: tile}));
    step.push({width: grid.width, height: grid.height});
    steps.push(step);
    grid.resize(true);
    console.log('Resize');
  }

  if (viewOnly || grid.tilesCopy) return;

  steps.push(null); // add empty step to mark where step started
  futureSteps = [];
  pointerActions.primary = true;
  styleTiles(tileMode);
  requestAnimationFrame(draw);
}, false);

document.addEventListener("mouseup", (event) => {
  grid.resize(false);
  if (!pointerActions.primary && !pointerActions.scroll) return;   // html buttons pressed over canvas
  if (!viewOnly && !pointerActions.scroll) condenseArray(steps);
  pointerActions.primary = false;
  pointerActions.scroll = false;
  erasing = false;
}, false);

document.addEventListener("mousemove", (event) => {
  if (event.button === 2) return;
  deltaPointer = {x: event.x - pointerPos.x, y: event.y - pointerPos.y};
  pointerPos = {x: event.x, y: event.y};
  grid.setCursorGridPos(cursorToGrid(event.x, event.y));
  if (pointerActions.scroll) {
    cameraTrans.offsetX += deltaPointer.x;
    cameraTrans.offsetY += deltaPointer.y;
  } else if ((erasing || (pointerActions.primary && (tileMode === 0 || tileMode === 1)) && !viewOnly) && !grid.tilesCopy) styleTiles(tileMode);
  requestAnimationFrame(draw);
}, false);

canvas.addEventListener("wheel", (event) => {
  zoom(Math.sign(event.deltaY), pointerPos);
  requestAnimationFrame(draw);
}, false);

/**
 *  pc key input
 */
document.addEventListener("keydown", (event) => {
  let key = event.keyCode;

  // undo and redo shortcut keys
  if (event.ctrlKey) {
    if (key === 90) undo();
    else if (key === 89) redo();
    return;
  }

  if (key === 32) playPause();
  else if (key === 65) stepAlgo(false);
  else if (key === 82) setTileMode(1);
  else if (key === 83) setTileMode(2);
  else if (key === 84) setTileMode(3);
});

canvas.addEventListener("keyup", (event) => {

});


let menuMoving = 100;
document.getElementById("barmenu").style.bottom = "-120px";
document.getElementById("framebar").style.bottom = "0px";

/**
 * Bar menu dip animation. Calls itself every step until animation is finished.
 * Menu dips down, changes out of view, then pops back up.
 * 
 * @param {*} dir   direction, true: down then false: up, used in animation
 * @param {*} newMode grid.mode changing to
 */
function dipAnimation(dir, newMode) {
  if (dir) {
    if (grid.mode === newMode) return;
    menuMoving += (100 - menuMoving) * 0.05;
    if (menuMoving > 99) {
      if (frameInterval) playPause();
      dir = false;
      grid.setMode(newMode);
      console.log('Mode:', newMode);
      if (grid.mode === 'life') {
        document.getElementById("toolbar").children[0].checked = true;
        document.getElementById("toolbar").children[2].checked = true;
        
        eraser = true;
        tileMode = 1;
        viewOnly = false;
      }
      requestAnimationFrame(draw);
    }
  } else {
    menuMoving -= menuMoving * 0.05;
    if (menuMoving < 1) menuMoving = 0;
  }

  // Animate
  switch (grid.mode) {
    case 'life':
      document.getElementById("barmenu").style.bottom = "-120px";
      document.getElementById("framebar").style.bottom = (134 - menuMoving) + "px";
      break;
    case 'pathfinding':
      if (menuMoving > 20) document.getElementById("barmenu").style.bottom = 20-menuMoving + "px";
      document.getElementById("framebar").style.bottom = (67 - menuMoving) + "px";
      break;
  }

  if (menuMoving) setTimeout(() => dipAnimation(dir, newMode), 1);
}
//dipAnimation(true, 'life');

//#endregion

//#region input helper functions

/**
 *  given an array of sub-arrays, this collects sub-arrays until it reaches a null element,
 *  combines the sub-arrays into a large sub-array,
 *  and places them back into the main array where the null element was.
*/
function condenseArray(ar) {
  let step = [];
  let i = ar.length-1;
  while (ar[i] != null) {
    step.push(ar.pop());
    i--;
  }
  ar.pop();
  if (step.length > 0) ar.push(step);
  if (ar.length > UNDO_STEPS) ar.shift();  // remove first (oldest) element if array is 'full'
}

// find and change the styles of the tiles the mouse is and has hovered over using deltaPointer movement
function styleTiles(style) {

  // translate cursor screen coordinates into grid coordinates
  let { x: gx, y: gy } = cursorToGrid(pointerPos.x, pointerPos.y);
  checkTile(gx, gy, style);

  if (!deltaPointer.x && !deltaPointer.y) return;

  // translate last step cursor screen coordinates into grid coordinates
  let { x: hx, y: hy } = cursorToGrid((pointerPos.x - deltaPointer.x), (pointerPos.y - deltaPointer.y));

  // edit tiles in-between cursor movement to ensure closed line is drawn
  while ((hx != gx || hy != gy)) {
    gx -= Math.sign(gx - hx);
    gy -= Math.sign(gy - hy);
    checkTile(gx, gy, style);
  }
}

function cursorToGrid(cx, cy) {
  return {x: Math.floor(((cx - cameraTrans.offsetX) / cameraTrans.scale) / TILE_SIZE), 
          y: Math.floor(((cy - cameraTrans.offsetY) / cameraTrans.scale) / TILE_SIZE)};
}

// check that the tile style is different from the current style, erase if first tile pressed is equal to current style
function checkTile(gx, gy, style) {
  if ((!grid.simple || grid.mode === 2) && (gx < 0 || gx >= grid.width || gy < 0 || gy >= grid.height)) return;
  let mgx = gx.mod(grid.width);
  let mgy = gy.mod(grid.height);
  const pos = mgx + mgy * grid.width;
  if (eraser && !deltaPointer.x && !deltaPointer.y && grid.tiles[pos] === style) erasing = true;
  if (erasing) style = 0;

  if (grid.tiles[pos] === style || (grid.tiles[pos] < 0 && style === 0)) return;   // if tile isn't same as new tile
  if (grid.tiles[pos] < 0 || grid.tiles[pos] === 2 || style === 2) {
    grid.clearPathfinding();
    if (frameInterval) playPause();
  }

  steps.push({pos: pos, revert: grid.tiles[pos]});  // push undo step

  if (grid.tiles[pos] === 2) grid.target = null;     // if tile was a target
  else if (grid.tiles[pos] === 3) {          // if tile was a unit
    let removeUnit = 0;
    grid.units.forEach((unit, i) => {
      if (unit.x + unit.y * grid.height === pos) removeUnit = i;
    });

    steps[steps.length-1].unit = removeUnit;      // add unit removeUnit index to last step
    grid.units.splice(removeUnit, 1);             // remove this removeUnit from grid.units
    if (grid.unitTurn === removeUnit) grid.clearPathfinding();
  }

  if (style === 2) {
    grid.tiles[grid.target] = 0;
    grid.target = pos;
  }
  else if (style === 3) grid.units.push({x: mgx, y: mgy}); //grid.units.push({done: false, x: mgx, y: mgy});
  grid.tiles[pos] = style;                // set tile

}

// zoom in or out from the reference point
function zoom(amount, referencePoint) {
  const oldScale = cameraTrans.scale;
  cameraTrans.scale -= ZOOM_AMOUNT * amount * Math.abs(cameraTrans.scale); // scale slower when further away and vice versa
  cameraTrans.scale = Math.min(Math.max(cameraTrans.scale, ZOOM_MIN), ZOOM_MAX); // clamp scale to final variables
  if (Math.abs(cameraTrans.scale-1) < ZOOM_AMOUNT * 0.2) cameraTrans.scale = 1; // ensure default scale 1 can always be reached

  // offset the position by the difference in mouse position from before to after scale
  cameraTrans.offsetX = (referencePoint.x - (referencePoint.x - cameraTrans.offsetX) * (cameraTrans.scale / oldScale));
  cameraTrans.offsetY = (referencePoint.y - (referencePoint.y - cameraTrans.offsetY) * (cameraTrans.scale / oldScale));
}

//#endregion

//#region html function calls

function setTileMode(newTileMode) {
  if (newTileMode === -1) {
    eraser = document.getElementById('eraser').checked;  // if eraser button is pressed, toggle eraser
    viewOnly = !eraser;
    if (tileMode !== 0) viewOnly = false;
  } else {
    viewOnly = false;
    if (tileMode === newTileMode) {
      tileMode = 0;
      viewOnly = !eraser;
      let tools = document.getElementById("toolbar").children;
      for (let i=2; i<tools.length; i += 2) tools[i].checked = false;  // uncheck all radio type tools
    } else tileMode = newTileMode;
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
  if (steps.length <= 0 || frameInterval) return;
  const step = steps.pop();
  let futureStep = [];
  if (!step) return;
  
  console.log('undo');
  step.forEach(stp => {
    if (stp.pos) {
      const stpTile = grid.tiles[stp.pos];
      futureStep.push({pos: stp.pos, revert: stpTile});  // add tile to futureStep
    
      grid.tiles[stp.pos] = stp.revert;                  // set tile
      
      if (stpTile === 2) grid.target = null;             // if tile is the target
      else if (stpTile === 3) {                          // if tile is a unit
        futureStep[futureStep.length-1].unit = stp.unit; // add unit index to last future stp
        grid.units.splice(stp.unit, 1);                  // remove unit index from grid.units
      }

      if (stp.revert === 2) grid.target = stp.pos;
      else if (stp.revert === 3) {                        // if tile is now a unit
        grid.units.splice(stp.unit, 0, stp.pos);          // add tile position to grid.units on index unit
        futureStep[futureStep.length-1].unit = stp.unit;  // add unit information to futureStep
      }
    } else if (stp.width && stp.height) {                   // add gridSize to futureStep
      futureStep.push({width: grid.width, height: grid.height});   
      grid.resize(true);
      const saveCursorPos = grid.cursorGridPos;
      grid.setCursorGridPos({x: stp.width, y: stp.height});
      grid.resize(false);
      grid.setCursorGridPos(saveCursorPos);
    }
  });
  futureSteps.push(futureStep);
  requestAnimationFrame(draw);
}

// inverse function of undo
function redo() {
  if (futureSteps.length <= 0 || frameInterval) return;
  let futureStep = futureSteps.pop();
  let step = [];
  if (!futureStep) return;

  console.log('redo');
  futureStep.forEach(stp => {
    if (stp.pos) {
      let stpTile = grid.tiles[stp.pos];
      grid.tiles[stp.pos] = stp.revert; // edit tile if coordinates are on grid
      
      // save current tile to undo steps
      step.push({pos: stp.pos, revert: stpTile});
      if (stpTile === 2) grid.target = null;
      else if (stpTile === 3) {
        step[step.length-1].unit = stp.unit;
        grid.units.splice(stp.unit, 1);
      }
      
      // redo this tile to its revert
      if (stp.revert === 2) grid.target = stp.pos;
      else if (stp.revert === 3) {
        grid.units.splice(stp.unit, 0, {x: stp.pos % grid.width, y: Math.floor(stp.pos / grid.width)});
        step[step.length-1].unit = stp.unit;
      }
    } else if (stp.width && stp.height) {                   // add gridSize to futureStep
      step.push({width: grid.width, height: grid.height});   
      grid.resize(true);
      const saveCursorPos = grid.cursorGridPos;
      grid.setCursorGridPos({x: stp.width, y: stp.height});
      grid.resize(false);
      grid.setCursorGridPos(saveCursorPos);

    }
  });
  steps.push(step);
  requestAnimationFrame(draw);
}

// call fullscreen methods compatible for all browsers, retrieved from: https://developers.google.com/web/fundamentals/native-hardware/fullscreen/
function toggleFullscreen() {
  let doc = window.document;
  let docEl = doc.documentElement;

  let requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  let cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) requestFullScreen.call(docEl);
  else cancelFullScreen.call(doc);
}

// set frame speed from html slider, [1 - 100]
function setFrameSpeed() {
  playSpeed = document.getElementById("frameSpeed").value;
  if (playSpeed > 9) playSpeed = (playSpeed-9) * 10;
  document.getElementById("frameSpeedText").innerHTML = "x" + playSpeed;
  clearInterval(frameInterval);
  if (frameInterval) frameInterval = setTimeout(stepAlgo, 1000 / playSpeed);
}

function setSimpleViewMode() {
  grid.simple = !grid.simple;
  const element = document.getElementById('simpleViewMode');
  if (grid.simple) {
    canvas.style.backgroundColor = "#000";
    element.style.backgroundColor = "#888";
    element.style.transform = "translateY(2px)";
    element.style.boxShadow = "0 4px #666";
  } else {
    canvas.style.backgroundColor = "#a99";
    element.style.backgroundColor = "#222";
    element.style.transform = "translateY(-4px)";
    element.style.boxShadow = "0 10px #666";
  }
  requestAnimationFrame(draw);
}

/**
 * 
 * @param {*} keepPlaying keeps pathfinding running at play speed
 */
function stepAlgo(keepPlaying = true) {

  if (!keepPlaying && frameInterval) playPause();  // step pressed while playing, now pause
  futureSteps = []; // empty undo and redo steps
  let paused = false; // Don't keep playing if stepPathfinding calls pause
  let pause = () => {
    if (!frameInterval) return;
    playPause();
    paused = true;
  }
  grid.mode === 'pathfinding' ? stepPathfinding(grid, pause) : stepLife(grid);  // step selected algorithm
  requestAnimationFrame(draw);
  if (keepPlaying && !paused) frameInterval = setTimeout(stepAlgo, 1000 / playSpeed); // keep playing at playSpeed
  // UNDOING Algos must be rethought out
}

/**
 * 
 * Toggles whether frameInterval is set or not, along with button ux
 */

function playPause() {
  if (grid.mode !== 'life' && !frameInterval && (grid.target === null || grid.units.length === 0)) return toast('Must place unit and target!'); // Don't play pathfinding without target/units
  console.log((frameInterval ? 'Pause' : 'Play'), grid.mode);
  const element = document.getElementById('playBtn'); // Flip button
  if (!frameInterval) {
    futureSteps = []; // Don't allow redo, new timeline
    let step = [];
    grid.tiles.forEach((tile, i) => step.push({pos: i, revert: tile}));
    steps.push(step); 
    stepAlgo(true); // Begin playing
    element.style.backgroundColor = "#888";
    element.style.transform = "translateY(2px)";
    element.style.boxShadow = "0 4px #666";
    element.innerHTML = "II";
  } else {
    clearInterval(frameInterval); // Stop playing
    frameInterval = null;
    element.style.backgroundColor = "#222";
    element.style.transform = "translateY(-4px)";
    element.style.boxShadow = "0 10px #666";
    element.innerHTML = "Play";
  }
}

//#endregion

//#region debug

// return a string displaying undo/redo steps. (#, #) are complete steps, (#, 6) shows number of changed tiles in current step
function logSteps() {
  let str = "(";
  let i=0;
  while (steps[i]) {
    str += "#, ";
    i++;
  }
  if (steps.length > i) str += (steps.length-1 - i) + ")";
  else str = str.substr(0, str.length - 2) + ")";
  if (str.length === 1) str = "()";
  return str;
}

//#endregion

//#region DOM

// debug system
let debug = document.getElementById('debug');
let debugBox = document.getElementById('debug-box');
let toastTimer;

function toast(str) {
  clearInterval(toastTimer);
  debug.style.display = 'block';
  debug.style.opacity = 1;
  debug.style.filter = 'alpha(opacity=100)';
  debugBox.innerHTML = str;

  let op = 16;
  toastTimer = setInterval(() => {
    op -= op * 0.1;
    if (op > 1) return;
    if (op <= 0.01){
      clearInterval(toastTimer);
      debug.style.display = 'none';
    }
    debug.style.opacity = op;
    debug.style.filter = 'alpha(opacity=' + op * 100 + ')';
  }, 50);
}

// menu system
let menus = Array.from(document.getElementsByClassName('menu'));
document.getElementById('start-btn').onclick = () => {
	menus[1].style.display = 'none';
	menus[0].style.display = 'block';
}

let canvasMask = document.getElementById('canvas-mask');
const GRID_MODES = ['life', 'pathfinding'];
let optionsMenu = document.getElementById("options-menu");
Array.from(document.getElementById('menu-grid').children).forEach((btn, i) => {
  btn.onclick = () => {
    canvasMask.style.display = 'none';
    menus[0].style.display = 'none';
    menuMoving = 100;
    dipAnimation(true, GRID_MODES[i]);
    optionsMenu.style.display = 'block';
  }
});
document.getElementById('simpleViewMode').onclick = () => setSimpleViewMode(); 
document.getElementById('fullscreen').onclick = () => toggleFullscreen(); 
document.getElementById('stepBtn').onclick = () => stepAlgo(false);
document.getElementById('playBtn').onclick = () => playPause(); 
document.getElementById('frameSpeed').oninput = () => setFrameSpeed(); 
document.getElementById('eraser').onclick = () => setTileMode(-1);
document.getElementById('barrier').onclick = () => setTileMode(1);
document.getElementById('target').onclick = () => setTileMode(2);
document.getElementById('unit').onclick = () => setTileMode(3);
document.getElementById('undo').onclick = () => undo();
document.getElementById('redo').onclick = () => redo();
document.getElementById('settings').onclick = () => {
  if (grid.mode === null) {
    canvasMask.style.display = 'none';
    menus[0].style.display = 'none';
    menuMoving = 100;
    dipAnimation(true, grid.lastMode);
    return;
  }
  if (menuMoving) return;
  if (grid.simple) setSimpleViewMode();
  dipAnimation(true, null);
  menus[0].style.display = 'block';
  canvasMask.style.display = 'block';
  grid.clearPathfinding();
  requestAnimationFrame(draw);
}
//#endregion
