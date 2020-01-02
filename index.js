/**
 * @author Austin Rognes
 * @date 12/27/2019
 */

//#region initialize environment

// modulus method that works with negative numbers, retrieved from: https://web.archive.org/web/20090717035140if_/javascript.about.com/od/problemsolving/a/modulobug.htm
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};

// check if viewing on mobile device
var isMobile = false;

// device detection retrieved from: https://stackoverflow.com/questions/3514784/what-is-the-best-way-to-detect-a-mobile-device/3540295#3540295
if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
    
    // adapt the css stylesheet to mobile view
    document.querySelector("link[href='style.css']").href = "mobileStyle.css";
    isMobile = true;
}

// get context and add input listeners
var canvas = document.getElementById('canvas'), ctx = canvas.getContext('2d');

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);

// canvas is always full window
function resizeCanvas() {
    cameraTrans.offsetX -= (canvas.width - window.innerWidth) / 2;
    cameraTrans.offsetY -= (canvas.height - window.innerHeight) / 2;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    requestAnimationFrame(draw); // redraw canvas
}

//#endregion

/**
 *  draw function is essentially an efficiently called update function, 
 *  i.e. it only updates when the user has changed something.
 */
function draw() {

    const time = (Date.now() - TIMER_START) / 10;

    // clamp camera position so at least 1 tile is always on screen
    const gridPixelWidth = (TILE_SIZE) * cameraTrans.scale;
    const gridPixelHeight = (TILE_SIZE) * cameraTrans.scale;
    cameraTrans.offsetX = Math.min(Math.max(cameraTrans.offsetX, gridPixelWidth * (1 - Grid.width)), (canvas.width - gridPixelWidth));
    cameraTrans.offsetY = Math.min(Math.max(cameraTrans.offsetY, gridPixelWidth * (1 - Grid.height)), (canvas.height - gridPixelHeight));

    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(cameraTrans.offsetX, cameraTrans.offsetY);
    ctx.scale(cameraTrans.scale, cameraTrans.scale);

    Grid.draw();
}

class Grid {
    constructor(width, height) {
        this.repeat = false;
        if(height === 0) this.setSize(width, width);
        else this.setSize(width, height);
    }

    draw() {
        const GRID_LINE_WIDTH = 6;
        if(!this.repeat) {  // draw grid normally

            // find beginX, beginY, endX, and endY. if grid not in view, return
            let beginX = Math.max(Math.floor((-cameraTrans.offsetX) / cameraTrans.scale / TILE_SIZE), 0);
            if(beginX >= this.width) return;
            let beginY = Math.max(Math.floor(-cameraTrans.offsetY / cameraTrans.scale / TILE_SIZE), 0);
            if(beginY >= this.height) return;
            let endX = Math.min(Math.ceil((-cameraTrans.offsetX + canvas.width) / cameraTrans.scale / TILE_SIZE), this.width);
            if(endX < 0) return;
            let endY = Math.min(Math.ceil((-cameraTrans.offsetY + canvas.height) / cameraTrans.scale / TILE_SIZE), this.height);
            if(endY < 0) return;

            // draw grid background
            ctx.fillStyle = "#fcc";
            ctx.fillRect(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE);

            // draw grid background lines
            ctx.strokeStyle = "#a99";
            ctx.lineWidth = GRID_LINE_WIDTH;
            for(var i = beginX; i <= endX; i++) {
                ctx.beginPath();
                ctx.moveTo(i * TILE_SIZE, 0);
                ctx.lineTo(i * TILE_SIZE, endY * TILE_SIZE);
                ctx.stroke();
            }
            for(var i = beginY; i <= endY; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i * TILE_SIZE);
                ctx.lineTo(endX * TILE_SIZE, i * TILE_SIZE);
                ctx.stroke();
            }

            // iterate through tiles shown on screen
            for(var i = beginX; i < endX; i++) {
                for(var j = beginY; j < endY; j++) {

                    // convert tile cartesian coordinates to tile array coordinates
                    let k = i + j * this.width;

                    // set drawing context to tile style
                    ctx.lineWidth = 3;
                    if(!this.tiles[k]) continue;                  // default 
                    else if(this.tiles[k] === 1) {                // barrier
                        ctx.fillStyle = "#020";
                        ctx.strokeStyle = "#030";
                        ctx.lineWidth = 9;
                    } 
                    else if(this.tiles[k] === 2) {                // target
                        ctx.fillStyle = "#4d4";
                        ctx.strokeStyle = "#4f4";
                    } 
                    else if(this.tiles[k] === 3) {                //unit
                        ctx.fillStyle = "#4f4";
                        ctx.strokeStyle = "#4d4";
                    }
                    ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    ctx.strokeRect(i * TILE_SIZE + ctx.lineWidth/2, j * TILE_SIZE + ctx.lineWidth/2, TILE_SIZE - ctx.lineWidth, TILE_SIZE - ctx.lineWidth);
                }
            }
        } else {    //draw grid repeatedly

            // find beginX and beginY, and view size
            let beginX = Math.floor((-cameraTrans.offsetX)/cameraTrans.scale / TILE_SIZE);
            let beginY = Math.floor(-cameraTrans.offsetY/cameraTrans.scale / TILE_SIZE);
            let viewWidth = Math.ceil(canvas.width/cameraTrans.scale / TILE_SIZE) + 1;
            let viewHeight = Math.ceil(canvas.height/cameraTrans.scale / TILE_SIZE)+ 1;
            let endX = beginX + viewWidth;
            let endY = beginY + viewHeight;


            // draw grid background
            ctx.fillStyle = "#daa";
            ctx.fillRect(beginX * TILE_SIZE, beginY * TILE_SIZE, viewWidth * TILE_SIZE, viewHeight * TILE_SIZE);
            ctx.fillStyle = "#fcc";
            ctx.fillRect(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE);

            // draw grid background lines
            ctx.strokeStyle = "#a99";
            ctx.lineWidth = GRID_LINE_WIDTH;
            for(var i = beginX; i <= endX; i++) {
                ctx.beginPath();
                ctx.moveTo(i * TILE_SIZE, beginY * TILE_SIZE);
                ctx.lineTo(i * TILE_SIZE, endY * TILE_SIZE);
                ctx.stroke();
            }
            for(var i = beginY; i <= viewHeight + beginY; i++) {
                ctx.beginPath();
                ctx.moveTo(beginX * TILE_SIZE, i * TILE_SIZE);
                ctx.lineTo(endX * TILE_SIZE, i * TILE_SIZE);
                ctx.stroke();
            }

            // iterate through tiles shown on screen
            for(var i = beginX; i < viewWidth + beginX; i++) {
                for(var j = beginY; j < endY; j++) {

                    // convert tile cartesian coordinates to tile array coordinates
                    let k = i.mod(this.width) + j.mod(this.height) * this.width;

                    // set drawing context to tile style
                    ctx.lineWidth = 3;
                    if(this.tiles[k] === 0) continue;             // default
                    else if(this.tiles[k] === 1) {                // barrier
                        ctx.fillStyle = "#020";
                        ctx.strokeStyle = "#030";
                        ctx.lineWidth = 9;
                    } 
                    else if(this.tiles[k] === 2) {                // target
                        ctx.fillStyle = "#4d4";
                        ctx.strokeStyle = "#4f4";
                    } 
                    else if(this.tiles[k] === 3) {                //unit
                        ctx.fillStyle = "#4f4";
                        ctx.strokeStyle = "#4d4";
                    }
                    ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    ctx.strokeRect(i * TILE_SIZE + ctx.lineWidth/2, j * TILE_SIZE + ctx.lineWidth/2, TILE_SIZE - ctx.lineWidth, TILE_SIZE - ctx.lineWidth);
                }
            }
        }
    }

    // set size expects sizes out of bounds to be caught by the html/css, but clamps the values just in case something goes wrong
    setSize(width, height) {
        width = Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH);
        height = Math.min(Math.max(height, MIN_WIDTH), MAX_WIDTH);
        this.width = width;
        this.height = height;
        this.tiles = new Array(width * height);
        for(var i=0; i<width * height; i++) this.tiles[i] = 0; // tiles hold state
        requestAnimationFrame(draw);
    }
}

//#region global variable initialization

// input variables
let pointerPos = {x: 0, y: 0};
let deltaPointer = {x: 0, y: 0};
let pointerActions = {primary: false, scroll: false};
let pointerSpread = 0;

// time
const TIMER_START = Date.now();

// grid construction
const TILE_SIZE = 32;
const MIN_WIDTH = 2;
const MAX_WIDTH = 128;
Grid = new Grid((window.innerWidth < window.innerHeight) ? Math.floor(window.innerWidth / TILE_SIZE) : Math.floor(window.innerHeight / TILE_SIZE), 0); // create grid to fill exactly or more than screen size;

// menu variables
let tileMode = 1;
let viewOnly = false;
let eraser = true;
let erasing = false;

// undo redo steps
const UNDO_STEPS = 40;
let steps = [];
let futureSteps = [];

// play mode
let playing = false;
let playSpeed = 1;

// camera view
let cameraTrans = {scale: 1, offsetX: 0, offsetY: 0};
const ZOOM_AMOUNT = 0.1;
const ZOOM_MIN = 0.2 * Math.max(window.innerWidth, window.innerHeight) / 1200;    // this allows smaller screens to zoom similar to larger screens
const ZOOM_MAX = 8 * Math.max(window.innerWidth, window.innerHeight) / 1200;

//resize canvas on load, then center camera based off canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
cameraTrans.offsetX = canvas.width/2 - Grid.width * TILE_SIZE / 2;
cameraTrans.offsetY = canvas.height/2 - Grid.height * TILE_SIZE / 2;
requestAnimationFrame(draw); // redraw canvas

//#endregion
//#region input

if(isMobile) {
    canvas.addEventListener('touchstart', (event) => {
        if(event.touches.length > 2) return;    // don't bother with 3 finger gestures
        if(!viewOnly) {
            steps.push(null); //add empty step to mark where step started
            futureSteps = [];
        }
    
        // set deltaPointer to (0, 0) as this is the reference point, then set pointerPos as first touch position
        deltaPointer = {x : 0, y : 0}; 
        pointerPos = {x : event.changedTouches[0].clientX, y : event.changedTouches[0].clientY};
    
        if(event.touches.length === 2) {    // if second finger is pressed on mobile, scrolling begins and anything done by the first finger is undone
            pointerSpread = 0;  // set pointerSpread to 0 as this is the reference point
    
            if(!viewOnly) { // if viewOnly = true then the tiles and steps were never changed in the first place
                if(steps[steps.length-3] === null) {                                        // if first touch only affected one tile
                    steps.pop();                                                            // remove null step pushed from second touch
                    Grid.tiles[steps[steps.length-1].pos] = steps[steps.length-1].revert;   // undo tile affected by first touch
                    steps.pop();                                                            // remove first touch step
                    steps.pop();                                                            // remove null step pushed from first touch
                } else {                    // if first touch moved and affected more than one tile
                    steps.pop();            // remove null step pushed from second touch
                    condenseArray(steps);   // count the first touch movement as a step
                }
                document.getElementById("debug").innerHTML = logSteps();
            }
        }
    
        if(event.touches.length === 2) pointerActions.scroll = true;
        else if(!viewOnly) {
            pointerActions.primary = true;
            styleTiles(tileMode);
            requestAnimationFrame(draw);
        }
    }, false);
    document.addEventListener('touchend',  touchEnd, false);
    document.addEventListener('touchcancel', touchEnd, false);
    function touchEnd(event) {
        if(event.touches.length > 2) return;    // don't bother with 3 finger gestures
        if(!pointerActions.primary && !pointerActions.scroll) return;   // html buttons pressed over canvas
        if(!viewOnly && !pointerActions.scroll) condenseArray(steps);
        pointerActions.primary = false;
        pointerActions.scroll = false;
        erasing = false;
    }

	canvas.addEventListener('touchmove', (event) => {

        // only update deltaPointer if not used for scrolling
        if(!pointerActions.scroll) deltaPointer = {x: event.changedTouches[0].clientX - pointerPos.x, y: event.changedTouches[0].clientY - pointerPos.y};
        pointerPos = {x : event.changedTouches[0].clientX, y : event.changedTouches[0].clientY};
        
        if(pointerActions.scroll) {
            // get vector from touch 0 to 1, then get distance
            const xDist = (event.touches[1].clientX - event.touches[0].clientX);
            const yDist = (event.touches[1].clientY - event.touches[0].clientY);
            const spread = Math.sqrt(xDist * xDist + yDist * yDist);

            // pointerSpread was set to 0 when 2nd finger pointerDown, so make sure deltaSpread will be 0
            if(pointerSpread === 0) pointerSpread = spread;
            const deltaSpread = (pointerSpread - spread) / 16;
            pointerSpread = spread;

            // current pointer center
            const pointerCenter = {x: (event.changedTouches[1].clientX + pointerPos.x)/2, y: (event.changedTouches[1].clientY + pointerPos.y)/2};

            // deltaPointer was set to (0, 0) when any touch pointerDown and hasn't changed if scrolling, so make sure deltaPointerCenter will be (0, 0)
            if(!deltaPointer.x && !deltaPointer.y) deltaPointer = pointerCenter;
            const deltaPointerCenter = {x: (pointerCenter.x - deltaPointer.x), y: (pointerCenter.y - deltaPointer.y)};
            deltaPointer = pointerCenter;

            zoom(deltaSpread, pointerCenter);
            cameraTrans.offsetX += deltaPointerCenter.x;
            cameraTrans.offsetY += deltaPointerCenter.y;
        } else if((erasing || (pointerActions.primary && (tileMode === 0 || tileMode === 1)) && !viewOnly)) styleTiles(tileMode);
        requestAnimationFrame(draw);

    }, false);
} else {

    canvas.addEventListener("mousedown", (event) => {
        if(event.button === 1) {
            pointerActions.scroll = true;
            if(pointerActions.primary) {
                pointerActions.primary = false;
                condenseArray(steps);
                erasing = false;
            }
        }
        if(event.button > 0) return;
        if(!viewOnly) {
            steps.push(null); //add empty step to mark where step started
            futureSteps = [];
        }

        deltaPointer = {x : 0, y : 0}; 
        pointerPos = {x : event.x, y : event.y};
        if(!viewOnly) {
            pointerActions.primary = true;
            styleTiles(tileMode);
            requestAnimationFrame(draw);
        }
    }, false);

    document.addEventListener("mouseup", (event) => {
        if(!pointerActions.primary && !pointerActions.scroll) return;   // html buttons pressed over canvas
        if(!viewOnly && !pointerActions.scroll) condenseArray(steps);
        pointerActions.primary = false;
        pointerActions.scroll = false;
        erasing = false;
    }, false);
    
    document.addEventListener("mousemove", (event) => {
        if(event.button === 2) return;
        deltaPointer = {x: event.x - pointerPos.x, y: event.y - pointerPos.y};
        pointerPos = {x : event.x, y : event.y};
        
        if(pointerActions.scroll) {
            cameraTrans.offsetX += deltaPointer.x;
            cameraTrans.offsetY += deltaPointer.y;
        } else if((erasing || (pointerActions.primary && (tileMode === 0 || tileMode === 1)) && !viewOnly)) styleTiles(tileMode);
        requestAnimationFrame(draw);
    }, false);

    canvas.addEventListener("wheel", (event) => {
        zoom(Math.sign(event.deltaY), pointerPos); 
        requestAnimationFrame(draw);
    }, false);

    /**
     *  key input
     */

    document.addEventListener("keydown", (event) => {
        var key = event.which;

        // undo and redo shortcut keys
        if(event.ctrlKey) {
            if(key === 90) undo();
            else if(key === 89) redo();
        }
    });

    canvas.addEventListener("keyup",(event) => {
        
    });
}

//#endregion
//#region input helper functions

/** 
 *  given an array of sub-arrays, this collects sub-arrays until it reaches a null element,
 *  combines the sub-arrays into a large sub-array, 
 *  and places them back into the main array where the null element was.
*/
function condenseArray(ar) {
    let step = [];
    var i = ar.length-1;
    while(ar[i] != null) {
        step.push(ar.pop());
        i--;
    }
    ar.pop();
    if(step.length > 0) ar.push(step);
    if(ar.length > UNDO_STEPS) ar.shift();  // remove first element if array is 'full'
    document.getElementById("debug").innerHTML = logSteps();
}

// find and change the styles of the tiles the mouse is and has hovered over using deltaPointer movement
function styleTiles(style) {
    
    // translate cursor screen coordinates into grid coordinates
    let gx = Math.floor(((pointerPos.x - cameraTrans.offsetX)/cameraTrans.scale)/TILE_SIZE);
    let gy = Math.floor(((pointerPos.y - cameraTrans.offsetY)/cameraTrans.scale)/TILE_SIZE);
    checkTile(gx, gy, style);

    if(!deltaPointer.x && !deltaPointer.y) return;

    // translate last cursor coordinates into grid coordinates
    let hx = Math.floor(((pointerPos.x - deltaPointer.x - cameraTrans.offsetX)/cameraTrans.scale)/TILE_SIZE);
    let hy = Math.floor(((pointerPos.y - deltaPointer.y - cameraTrans.offsetY)/cameraTrans.scale)/TILE_SIZE);

    // edit tiles in-between cursor movement to ensure closed line is drawn
    while((hx != gx || hy != gy)) {
        gx -= Math.sign(gx - hx);
        gy -= Math.sign(gy - hy);
        checkTile(gx, gy, style);
    }
}

// check that the tile style is different from the current style, erase if first tile pressed is equal to current style
function checkTile(gx, gy, style) {
    if(!Grid.repeat && (gx < 0 || gx >= Grid.width || gy < 0 || gy >= Grid.height)) return;
    let mgx = gx.mod(Grid.width);
    let mgy = gy.mod(Grid.height);
    if(eraser && !deltaPointer.x && !deltaPointer.y && Grid.tiles[mgx + mgy * Grid.width] === style) erasing = true;
    if(erasing) style = 0;

    if(Grid.tiles[mgx + mgy * Grid.width] !== style) {
        steps.push({pos: mgx  + mgy * Grid.width, revert: Grid.tiles[mgx  + mgy * Grid.width]});
        Grid.tiles[mgx + mgy * Grid.width] = style; // edit tile if coordinates are on grid
    }
    document.getElementById("debug").innerHTML = logSteps();
}

// zoom i0 or out from the reference point
function zoom(amount, referencePoint) {
    const oldScale = cameraTrans.scale;
    cameraTrans.scale -= ZOOM_AMOUNT * amount * Math.abs(cameraTrans.scale); // scale slower when further away and vice versa
    cameraTrans.scale = Math.min(Math.max(cameraTrans.scale, ZOOM_MIN), ZOOM_MAX); // clamp scale to final variables
    if(Math.abs(cameraTrans.scale-1) < ZOOM_AMOUNT * 0.2) cameraTrans.scale = 1; // ensure default scale 1 can always be reached

    // offset the position by the difference in mouse position from before to after scale
    cameraTrans.offsetX = (referencePoint.x - (referencePoint.x - cameraTrans.offsetX) * (cameraTrans.scale / oldScale));
    cameraTrans.offsetY = (referencePoint.y - (referencePoint.y - cameraTrans.offsetY) * (cameraTrans.scale / oldScale));
}

//#endregion
//#region html function calls

function setTileMode(newTileMode) {
    if(newTileMode === -1) {
        eraser = document.getElementById('eraser').checked;  // if eraser button is pressed, toggle eraser
        viewOnly = !eraser;
        if(tileMode !== 0) viewOnly = false;
    } else {
        viewOnly = false;
        if(tileMode === newTileMode) {
            tileMode = 0;
            viewOnly = !eraser;
            let tools = document.getElementById("toolbar").children;
            for(var i=2; i<tools.length; i += 2) tools[i].checked = false;  // uncheck all radio type tools
        } else tileMode = newTileMode;
    }
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
        futureStep.push({pos: step[i].pos, revert: Grid.tiles[step[i].pos]});
        Grid.tiles[step[i].pos] = step[i].revert;
    }
    futureSteps.push(futureStep);
    requestAnimationFrame(draw);
    document.getElementById("debug").innerHTML = logSteps();
}

function redo() {
    if(futureSteps.length <= 0) return;
    let futureStep = futureSteps.pop();
    let step = [];

    if(!futureStep) return;
    console.log('redo');
    for(var i=0; i < futureStep.length; i++) {
        step.push({pos: futureStep[i].pos, revert: Grid.tiles[futureStep[i].pos]});
        Grid.tiles[futureStep[i].pos] = futureStep[i].revert;
    }
    steps.push(step);
    requestAnimationFrame(draw);
    document.getElementById("debug").innerHTML = logSteps();
}

// call fullscreen methods compatible for all browsers, retrieved from: https://developers.google.com/web/fundamentals/native-hardware/fullscreen/
function toggleFullscreen() {
    var doc = window.document;
    var docEl = doc.documentElement;

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) requestFullScreen.call(docEl);
    else cancelFullScreen.call(doc);
}

// toggle grid repeat
function toggleGridRepeat() {
    Grid.repeat = !Grid.repeat;
    requestAnimationFrame(draw);
}

var frameInterval;

// update tiles by rules
function incFrame(inc) {
    //if(!inc && !playing) return;

    // empty undo and redo steps
    steps = [];
    futureSteps = [];

    // neighbor tile location in array is stores here
    var neighbors = [null, null, null, null, null, null, null, null];
    var modifiedTiles = [...Grid.tiles];

    if(!Grid.repeat) {
        for(var i=0; i<Grid.tiles.length; i++) {
            const k = i.mod(Grid.width);

            // find if neighbor Grid.tiles right, left, up, and down exist, if so, get their address
            if((k+1).mod(Grid.width) > k) neighbors[7] = i+1;
            if((k-1).mod(Grid.width) < k) neighbors[3] = i-1;
            if((i-Grid.width) >= 0) neighbors[1] = i-Grid.width;
            if((i+Grid.width) < Grid.tiles.length) neighbors[5] = i+Grid.width;

            // find if corner neighbor Grid.tiles upright, upleft, downright, and downleft exist, if so, get their address
            if(neighbors[1] !== null) {
                if(neighbors[7] !== null) neighbors[0] = neighbors[1] + 1;
                if(neighbors[3] !== null) neighbors[2] = neighbors[1] - 1;
            } 
            if(neighbors[5] !== null) {
                if(neighbors[7] !== null) neighbors[6] = neighbors[5] + 1;
                if(neighbors[3] !== null) neighbors[4] = neighbors[5] - 1;
            }

            // filter out null or non-existant elements
            neighbors = neighbors.filter((n) => {if(Grid.tiles[n]) return n});
            
            // Conway's Game of Life rules
            if(Grid.tiles[i] > 0) {
                if(neighbors.length < 2 || neighbors.length > 3) modifiedTiles[i] = 0;
            } else if(neighbors.length === 3) modifiedTiles[i] = 1;
            
            neighbors = [null, null, null, null, null, null, null, null];
        }
    } else {
        const gridLength = Grid.tiles.length;
        for(var i=0; i<gridLength; i++) {
            const k = i.mod(Grid.width);

            // get all neighbors tile addresses
            neighbors[7] = (i+1).mod(gridLength);
            neighbors[3] = (i-1).mod(gridLength);
            neighbors[1] = (i-Grid.width).mod(gridLength);
            neighbors[5] = (i+Grid.width).mod(gridLength);
            neighbors[0] = (neighbors[1] + 1).mod(gridLength);
            neighbors[2] = (neighbors[1] - 1).mod(gridLength);
            neighbors[6] = (neighbors[5] + 1).mod(gridLength);
            neighbors[4] = (neighbors[5] - 1).mod(gridLength);
            

            // filter out null or non-existant elements
            neighbors = neighbors.filter((n) => {if(Grid.tiles[n]) return n});
            
            // Conway's Game of Life rules
            if(Grid.tiles[i] > 0) {
                if(neighbors.length < 2 || neighbors.length > 3) modifiedTiles[i] = 0;
            } else if(neighbors.length === 3) modifiedTiles[i] = 1;
            
            neighbors = [null, null, null, null, null, null, null, null];
        }
    }

    Grid.tiles = modifiedTiles;
    requestAnimationFrame(draw);

    if(!inc && playing) frameInterval = setTimeout(() => incFrame(0), 1000 / playSpeed);
}

function playFrame() {
    playing = !playing;
    console.log(playing ? "Play" : "Pause");
    const element = document.getElementById('playFrame');
    if(playing) {
        incFrame(0);
        element.style.backgroundColor = "#888";
        element.style.transform = "translateY(2px)";
        element.style.boxShadow = "0 4px #666";
        element.innerHTML = "II";
    } else {
        element.style.backgroundColor = "#222";
        element.style.transform = "translateY(-4px)";
        element.style.boxShadow = "0 10px #666";
        element.innerHTML = "Play";
    }
}

function setFrameSpeed() {
    playSpeed = Math.ceil(Math.pow(document.getElementById("frameSpeed").value/10, 2)/100);
    document.getElementById("frameSpeedText").innerHTML = "x" + (playSpeed/10).toFixed(1);
    clearInterval(frameInterval);
    if(playing) incFrame(0);
}

//#endregion

// return a string displaying undo/redo steps. (#, #) are complete steps, (#, 6) shows number of changed tiles in current step
function logSteps() {
    var str = "(";
    var i=0;
    while(steps[i]) {
        str += "#, ";
        i++;
    }
    if(steps.length > i) str += (steps.length-1 - i) + ")";
    else str = str.substr(0, str.length - 2) + ")";
    if(str.length === 1) str = "()";
    //console.log(str); good lord don't use this
    return str;
}