/**
 * @author Austin Rognes
 * @date 1/1/2020
 */

// get context and add input listeners
var canvas = document.getElementById('canvas'), ctx = canvas.getContext('2d');
canvas.addEventListener("mousedown", mouseDown, false);
canvas.addEventListener("mouseup", mouseUp, false);
canvas.addEventListener("mousemove", mouseMove, false);
canvas.addEventListener("mouseleave", mouseLeave, false);
canvas.addEventListener("wheel", scroll, false);
canvas.addEventListener("keydown", keyDown, false);
canvas.addEventListener("keyup", keyUp, false);

// time
const TIMER_START = Date.now();

// grid construction
const TILE_SIZE = 40;
const TILE_SHRINK = 8;
const GRID_WIDTH = (screen.width > screen.height) ? Math.ceil(screen.width / TILE_SIZE) : Math.ceil(screen.height / TILE_SIZE); // create grid to fill exactly or more than screen size
const GRID_SIZE = GRID_WIDTH * GRID_WIDTH;
const tiles = new Array(GRID_SIZE);
for(var i=0; i<GRID_SIZE; i++) tiles[i] = {x: (i % GRID_WIDTH) * TILE_SIZE, y: Math.floor(i / GRID_WIDTH) * TILE_SIZE, style: 0}; // tiles hold position and state

// input variables
let mousePos = {x: 0, y: 0};
let deltaMouse = {x: 0, y: 0};
let mouseButtonsDown = {primary: false, scroll: false, secondary: false};

//menu variables
let primaryTileMode = 1;
let secondaryTileMode = 0;
let selectCursorMode = 0;

//undo redo stages
const UNDO_STEPS = 40;
let steps = [];
let futureSteps = [];

// camera view
let cameraTrans = {scale: 1, offsetX: 0, offsetY: 0};

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);

// canvas is always full window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw(); // redraw canvas
}

//resize canvas on load
resizeCanvas();

function draw() {

    const time = (Date.now() - TIMER_START) / 10;

    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(cameraTrans.offsetX, cameraTrans.offsetY);
    ctx.scale(cameraTrans.scale, cameraTrans.scale);


    drawGrid();
}

function drawGrid() {
    //const t = Date.now();
    for(var i=0; i<GRID_SIZE; i++) {
        ctx.lineWidth = 3;
        if(tiles[i].style === 0) {                      // default
            ctx.fillStyle = tiles[i].fillStyle = "#fcc";
            ctx.strokeStyle = tiles[i].strokeStyle = "#fcc";
        } 
        else if(tiles[i].style === 1) {                // barrier
            ctx.fillStyle = tiles[i].fillStyle = "#020";
            ctx.strokeStyle = tiles[i].strokeStyle = "#030";
            ctx.lineWidth = 9;
        } 
        else if(tiles[i].style === 2) {                // target
            ctx.fillStyle = tiles[i].fillStyle = "#4d4";
            ctx.strokeStyle = tiles[i].strokeStyle = "#4f4";
        } 
        else if(tiles[i].style === 3) {                //unit
            ctx.fillStyle = tiles[i].fillStyle = "#4f4";
            ctx.strokeStyle = tiles[i].strokeStyle = "#4d4";
        }
        ctx.fillRect(tiles[i].x, tiles[i].y, TILE_SIZE-TILE_SHRINK, TILE_SIZE-TILE_SHRINK);
        ctx.strokeRect(tiles[i].x, tiles[i].y, TILE_SIZE-TILE_SHRINK, TILE_SIZE-TILE_SHRINK);
    }
    //console.log(Date.now() - t);
    //console.log(cameraTrans.offsetX + GRID_WIDTH * TILE_SIZE/2 * cameraTrans.scale - canvas.width/2);
}

/**
 *  mouse input
 */

function mouseDown(event) {
    steps.push(null); //add empty step to mark where step started
    futureSteps = [];

    if(event.button === 0) {
        mouseButtonsDown.primary = true;
        styleTile(primaryTileMode);
        requestAnimationFrame(draw);
    } 
    if(event.button === 1) mouseButtonsDown.scroll = true;
    else if(event.button === 2) {
        mouseButtonsDown.secondary = true;
        styleTile(secondaryTileMode);
        requestAnimationFrame(draw);
    }
}

function mouseUp(event) {
    if(mouseButtonsDown.primary === false && mouseButtonsDown.scroll === false && mouseButtonsDown.secondary === false) return;
    if(event.button === 0) mouseButtonsDown.primary = false;
    else if(event.button === 1) mouseButtonsDown.scroll = false;
    else if(event.button === 2) mouseButtonsDown.secondary = false;

    var i = steps.length-1;
    let step = [];
    while(steps[i] != null) {
        step.push(steps.pop());
        i--;
    }
    steps.pop();
    if(step.length > 0) steps.push(step);
    if(steps.length > UNDO_STEPS) steps.shift();
}

function mouseMove(event) {
    deltaMouse = {x: event.x - mousePos.x, y: event.y - mousePos.y};
    mousePos = {x : event.x, y : event.y};

    if(mouseButtonsDown.scroll) {
        cameraTrans.offsetX += deltaMouse.x;
        cameraTrans.offsetY += deltaMouse.y;
    } else if(mouseButtonsDown.primary) {
        if(primaryTileMode === 0 || primaryTileMode === 1) styleTiles(primaryTileMode);
    } else if(mouseButtonsDown.secondary) {
        if(secondaryTileMode === 0 || secondaryTileMode === 1) styleTiles(secondaryTileMode);
    }
    requestAnimationFrame(draw);
}

function mouseLeave(event) {
    if(mouseButtonsDown.primary === true || mouseButtonsDown.scroll === true || mouseButtonsDown.secondary === true) mouseUp(event);
    mouseButtonsDown = {primary: false, scroll: false, secondary: false};
}

// change the styles of the tiles the mouse is and has hovered over with deltaMouse movement
function styleTiles(style) {

    // translate cursor screen coordinates into grid coordinates
    let gx = Math.floor(((mousePos.x - cameraTrans.offsetX)/cameraTrans.scale + 4)/TILE_SIZE);
    let gy = Math.floor(((mousePos.y - cameraTrans.offsetY)/cameraTrans.scale + 4)/TILE_SIZE);
    checkTile(gx, gy, style);

    // translate last cursor coordinates into grid coordinates
    let hx = Math.floor(((mousePos.x - deltaMouse.x - cameraTrans.offsetX)/cameraTrans.scale + 4)/TILE_SIZE);
    let hy = Math.floor(((mousePos.y - deltaMouse.y - cameraTrans.offsetY)/cameraTrans.scale + 4)/TILE_SIZE);

    // edit tiles in-between cursor movement to ensure closed line is drawn, maximum possible loop iterations is GRID_WIDTH (a diagonal line from corner to corner)
    while((hx != gx || hy != gy)) {
        gx -= Math.sign(gx - hx);
        gy -= Math.sign(gy - hy);
        checkTile(gx, gy, style);
    }
}

// change the style of the tile the mouse is hovering over
function styleTile(style) {

    // translate cursor screen coordinates into grid coordinates
    let gx = Math.floor(((mousePos.x - cameraTrans.offsetX)/cameraTrans.scale + 4)/TILE_SIZE);
    let gy = Math.floor(((mousePos.y - cameraTrans.offsetY)/cameraTrans.scale + 4)/TILE_SIZE);
    checkTile(gx, gy, style);
}

function checkTile(gx, gy, style) {
    if(gx >= 0 && gy >= 0 && gx < GRID_WIDTH && gy < GRID_WIDTH) {
        if(tiles[gx + gy * GRID_WIDTH].style !== style) {
            steps.push({pos: gx  + gy * GRID_WIDTH, revert: tiles[gx  + gy * GRID_WIDTH].style});
            tiles[gx + gy * GRID_WIDTH].style = style; // edit tile if coordinates are on grid
        }
    }
}



function scroll(event) {
    const ZOOM_AMOUNT = 0.1;
    const ZOOM_MIN = 0.5;
    const ZOOM_MAX = 8;

    const oldScale = cameraTrans.scale;
    cameraTrans.scale -= ZOOM_AMOUNT * Math.sign(event.deltaY) * Math.abs(cameraTrans.scale); // scale slower when further away and vice versa
    cameraTrans.scale = Math.min(Math.max(cameraTrans.scale, ZOOM_MIN), ZOOM_MAX); // clamp scale to final variables
    if(Math.abs(cameraTrans.scale-1) < ZOOM_AMOUNT * 0.5) cameraTrans.scale = 1; // ensure default scale 1 can always be reached

    // offset the position by the difference in mouse position from before to after scale
    cameraTrans.offsetX = (mousePos.x - (mousePos.x - cameraTrans.offsetX) * (cameraTrans.scale / oldScale));
    cameraTrans.offsetY = (mousePos.y - (mousePos.y - cameraTrans.offsetY) * (cameraTrans.scale / oldScale));

    requestAnimationFrame(draw);
}

/**
 *  key input
 */

function keyDown(event) {
    
}

function keyUp(event) {
    
}

/**
 * html tag function calls
 */

 function setTileMode(newTileMode) {
    if(!selectCursorMode) primaryTileMode = newTileMode;
    else secondaryTileMode = newTileMode;
 }

 function setSelectCursorMode(i) {
     selectCursorMode = i;
 }

 /**
  * Undo and redo use Arrays to hold steps.
  * Array steps and futureSteps holds Arrays of individual tile changes called step and futureStep.
  * On undo, a step from steps is inverted and passed to futureSteps.
  * There is an arbitrary constant UNDO_STEPS to decide how many steps are saved.
  * If the user undoes and then changes tiles, futureSteps are wiped so that the user cannot redo. 
  */
 function undo() {
    if(steps.length <= 0) return;
    let step = steps.pop();
    let futureStep = [];

    if(!step) return;
    console.log('undo');
    for(var i=0; i < step.length; i++) {
        futureStep.push({pos: step[i].pos, revert: tiles[step[i].pos].style});
        tiles[step[i].pos].style = step[i].revert;
    }
    futureSteps.push(futureStep);
    requestAnimationFrame(draw);
 }

 function redo() {
    if(futureSteps.length <= 0) return;
    let futureStep = futureSteps.pop();
    let step = [];

    if(!futureStep) return;
    console.log('redo');
    for(var i=0; i < futureStep.length; i++) {
        step.push({pos: futureStep[i].pos, revert: tiles[futureStep[i].pos].style});
        tiles[futureStep[i].pos].style = futureStep[i].revert;
    }
    steps.push(step);
    requestAnimationFrame(draw);
 }