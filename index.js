/**
 * @author Austin Rognes
 * @date 12/27/2019
 */


// check if viewing on mobile device
var isMobile = false;

// device detection retrieved from: https://stackoverflow.com/questions/3514784/what-is-the-best-way-to-detect-a-mobile-device/3540295#3540295
if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
    
    // adapt the css stylesheet to mobile view
    document.querySelector("link[href='style.css']").href = "mobileStyle.css";

    // hides mobile browser's address bar when page is done loading
    window.addEventListener('load', function(event) {
        setTimeout(function() { window.scrollTo(0, 1); }, 1);
    }, false);
    isMobile = true;
}

// get context and add input listeners
var canvas = document.getElementById('canvas'), ctx = canvas.getContext('2d');


if(isMobile) {
    canvas.addEventListener("touchstart", (event) => {
        //console.log(event.touches[0].identifier);

        if(event.touches.length === 2) { // zoom

            document.getElementById('debug').innerHTML = "Z: (" + event.touches[0].clientX + ", " + event.touches[0].clientY + ")-(" + event.touches[1].clientX + ", " + event.touches[1].clientY + ")";
        } else {

        }
    });

    canvas.addEventListener("touchend", (event) => {
        //console.log(event.changedTouches[0].identifier);
    });

    canvas.addEventListener("touchmove", (event) => {
        event.preventDefault();

        //requestAnimationFrame(draw);
        draw();

        ctx.fillStyle = "#888";
        for(t in event.changedTouches) {
            ctx.arc(t.clientX, t.clientY, 50, 0, 2 * Math.PI);
            ctx.fill();
        };

        //console.log(event);
    });

    canvas.addEventListener("touchcancel", (event) => {
        //console.log(event);
    });
} else {

    // pc input variables
    let mousePos = {x: 0, y: 0};
    let deltaMouse = {x: 0, y: 0};
    let mouseButtonsDown = {primary: false, scroll: false, secondary: false};

    /**
     *  mouse input
     */
    
    canvas.addEventListener("mousedown", (event) => {
        steps.push(null); //add empty step to mark where step started
        futureSteps = [];
    
        if(event.button === 0) {
            mouseButtonsDown.primary = true;
            styleTile(primaryTileMode);
            requestAnimationFrame(draw);
        } 
        else if(event.button === 1) mouseButtonsDown.scroll = true;
        else if(event.button === 2) {
            mouseButtonsDown.secondary = true;
            styleTile(secondaryTileMode);
            requestAnimationFrame(draw);
        }
    });

    /** 
     *  given an array of sub-arrays, this collects sub-arrays until it reaches a null element,
     *  combines the sub-arrays into a large sub-array, 
     *  and places them back into the main array where the null element was.
    */
    function compressArray() {
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

    canvas.addEventListener("mouseup", (event) => {
        if(mouseButtonsDown.primary === false && mouseButtonsDown.scroll === false && mouseButtonsDown.secondary === false) return;
        if(event.button === 0) mouseButtonsDown.primary = false;
        else if(event.button === 1) mouseButtonsDown.scroll = false;
        else if(event.button === 2) mouseButtonsDown.secondary = false;
    
        compressArray();
    });
    
    canvas.addEventListener("mousemove", (event) => {
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
    });
    
    canvas.addEventListener("mouseleave", (event) => {
        if(mouseButtonsDown.primary === true || mouseButtonsDown.scroll === true || mouseButtonsDown.secondary === true) compressArray();
        mouseButtonsDown = {primary: false, scroll: false, secondary: false};
    });
    
    // find and change the styles of the tiles the mouse is and has hovered over using deltaMouse movement
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
    
    // find and change the style of the tile the mouse is hovering over
    function styleTile(style) {
    
        // translate cursor screen coordinates into grid coordinates
        let gx = Math.floor(((mousePos.x - cameraTrans.offsetX)/cameraTrans.scale + 4)/TILE_SIZE);
        let gy = Math.floor(((mousePos.y - cameraTrans.offsetY)/cameraTrans.scale + 4)/TILE_SIZE);
        checkTile(gx, gy, style);
    }
    
    // check that the grid coordinates given are valid and the tile style is different from the current style
    function checkTile(gx, gy, style) {
        if(gx >= 0 && gy >= 0 && gx < GRID_WIDTH && gy < GRID_WIDTH) {
            if(tiles[gx + gy * GRID_WIDTH].style !== style) {
                steps.push({pos: gx  + gy * GRID_WIDTH, revert: tiles[gx  + gy * GRID_WIDTH].style});
                tiles[gx + gy * GRID_WIDTH].style = style; // edit tile if coordinates are on grid
            }
        }
    }
    
    canvas.addEventListener("wheel", (event) => {
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
    });

    /**
     *  key input
     */

    canvas.addEventListener("keydown", (event) => {
        
    });

    canvas.addEventListener("keyup",(event) => {
        
    });
}





// time
const TIMER_START = Date.now();

// grid construction
const TILE_SIZE = 40;
const TILE_SHRINK = 8;
const GRID_WIDTH = (screen.width > screen.height) ? Math.ceil(screen.width / TILE_SIZE) : Math.ceil(screen.height / TILE_SIZE); // create grid to fill exactly or more than screen size
const GRID_SIZE = GRID_WIDTH * GRID_WIDTH;
const tiles = new Array(GRID_SIZE);
for(var i=0; i<GRID_SIZE; i++) tiles[i] = {x: (i % GRID_WIDTH) * TILE_SIZE, y: Math.floor(i / GRID_WIDTH) * TILE_SIZE, style: 0}; // tiles hold position and state

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


/**
 *  draw function is essentially an efficiently called update function, 
 *  i.e. it only updates when the user has changed something.
 */
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