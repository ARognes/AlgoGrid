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
let dpx = window.devicePixelRatio || 1;
ctx.scale(dpx, dpx);

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', () => {
    cameraTrans.offsetX -= (canvas.width - window.innerWidth) / 2;
    cameraTrans.offsetY -= (canvas.height - window.innerHeight) / 2;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    requestAnimationFrame(draw); // redraw canvas
}, false);

//#endregion

/**
 *  essentially an efficiently called update function,
 *  i.e. it only updates on user input
 */
function draw() {

    // clamp camera position so at least 1 tile is always on screen
    const gridPixelWidth = TILE_SIZE * cameraTrans.scale;
    const gridPixelHeight = TILE_SIZE * cameraTrans.scale;
    cameraTrans.offsetX = Math.min(Math.max(cameraTrans.offsetX, gridPixelWidth * (1 - Grid.width)), (canvas.width - gridPixelWidth));
    cameraTrans.offsetY = Math.min(Math.max(cameraTrans.offsetY, gridPixelHeight * (1 - Grid.height)), (canvas.height - gridPixelHeight));

    // transform the camera
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(cameraTrans.offsetX, cameraTrans.offsetY);
    ctx.scale(cameraTrans.scale, cameraTrans.scale);

    Grid.draw();
}

class Grid {
    constructor(width, height) {
        this.repeat = false;
        this.simple = false;

        // pathfinding arrays
        this.units = [];
        this.targets = [];
        this.openTiles = [];
        this.closedTiles = [];

        if(height === 0) this.setSize(width, width);
        else this.setSize(width, height);
    }

     // convert tile cartesian coordinates to tile array coordinates
    cartesianToIndex(i, j) {
        return this.repeat ? i.mod(this.width) + j.mod(this.height) * this.width : i + j * this.width;
    }

    draw() {

        let beginX, beginY, endX, endY, viewWidth, viewHeight;
        if(!this.repeat) {  // if grid not in view, return, else find first and last tiles in view
            beginX = Math.max(Math.floor((-cameraTrans.offsetX) / cameraTrans.scale / TILE_SIZE), 0);
            if(beginX >= this.width) return;
            beginY = Math.max(Math.floor(-cameraTrans.offsetY / cameraTrans.scale / TILE_SIZE), 0);
            if(beginY >= this.height) return;
            endX = Math.min(Math.ceil((-cameraTrans.offsetX + canvas.width) / cameraTrans.scale / TILE_SIZE), this.width);
            if(endX < 0) return;
            endY = Math.min(Math.ceil((-cameraTrans.offsetY + canvas.height) / cameraTrans.scale / TILE_SIZE), this.height);
            if(endY < 0) return;
        } else {    // find first tile in view and the view size
            beginX = Math.floor((-cameraTrans.offsetX) / cameraTrans.scale / TILE_SIZE);
            beginY = Math.floor(-cameraTrans.offsetY / cameraTrans.scale / TILE_SIZE);
            viewWidth = Math.ceil(canvas.width / cameraTrans.scale / TILE_SIZE) + 1;
            viewHeight = Math.ceil(canvas.height / cameraTrans.scale / TILE_SIZE)+ 1;
            endX = beginX + viewWidth;
            endY = beginY + viewHeight;
        }

        if(this.simple) {  // draw simple grid for better performance

            // draw grid background
            ctx.fillStyle = "#222";
            ctx.fillRect(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE);

            // draw tiles
            ctx.fillStyle = "#fff";
            ctx.lineWidth = 3;
            for(let i = beginX; i < endX; i++) {
                for(let j = beginY; j < endY; j++) {
                    if(!this.tiles[this.cartesianToIndex(i, j)]) continue;      // don't draw dead
                    ctx.fillRect(i * TILE_SIZE + 2, j * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);   // draw alive
                }
            }

        } else {    // draw normal grid with details

            if(this.repeat) { // draw canvas background
                ctx.fillStyle = "#daa";
                ctx.fillRect(beginX * TILE_SIZE, beginY * TILE_SIZE, viewWidth * TILE_SIZE, viewHeight * TILE_SIZE);
            }

            // draw grid background
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
            for(var i = beginY; i <= endY; i++) {
                ctx.beginPath();
                ctx.moveTo(beginX * TILE_SIZE, i * TILE_SIZE);
                ctx.lineTo(endX * TILE_SIZE, i * TILE_SIZE);
                ctx.stroke();
            }

            if(mode === 2) {        // pathfinding
                for(var i = beginX; i < endX; i++) {
                    for(var j = beginY; j < endY; j++) {

                        // convert tile cartesian coordinates to tile array coordinates
                        let k = this.cartesianToIndex(i, j);

                        if(!this.tiles[k]) continue;

                        // set drawing context to tile style
                        ctx.lineWidth = 3;

                        if(this.tiles[k] === 1) {                       // barrier
                            ctx.fillStyle = "#020";
                            ctx.strokeStyle = "#030";
                            ctx.lineWidth = 9;
                        } else if(this.tiles[k] === 2) {                // target
                            ctx.fillStyle = "#f44";
                            ctx.strokeStyle = "#d44";
                        } else if(this.tiles[k] === 3) {                // unit
                            ctx.fillStyle = "#4f4";
                            ctx.strokeStyle = "#4d4";
                        } else if(this.tiles[k] === -1) {                // open tile
                            ctx.fillStyle = "#f99";
                            ctx.strokeStyle = "#f66";
                        } else if(this.tiles[k] === -2) {                // closed tile
                            ctx.fillStyle = "#f66";
                            ctx.strokeStyle = "#f33";
                        } else if(this.tiles[k] === -3) {                // path
                            ctx.fillStyle = "#ff0";
                            ctx.strokeStyle = "#dd0";
                        }
                        ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        ctx.strokeRect(i * TILE_SIZE + ctx.lineWidth/2, j * TILE_SIZE + ctx.lineWidth/2, TILE_SIZE - ctx.lineWidth, TILE_SIZE - ctx.lineWidth);
                    }
                }

                // draw search tile numbers g, h, f;   f = g + h
                function labelSearch(searched) {
                    for(let i=0; i<searched.length; i++) {
                        if(searched[i].reference == null) continue;
                        const g = Math.round(searched[i].g * 10);
                        const h = Math.round(searched[i].h * 10);
                        const x = searched[i].x;
                        const y = searched[i].y;
                        ctx.font = "8px Nunito";
                        ctx.textAlign = "center";
                        ctx.fillText(g, (x + 0.5) * TILE_SIZE, (y + 1) * TILE_SIZE - 24);
                        ctx.fillText(h, (x + 0.5) * TILE_SIZE, (y + 1) * TILE_SIZE - 16);
                        ctx.font = Math.max(19 - 3 * (g + h).toFixed().length, 8) + "px Nunito";
                        ctx.fillText((g + h), (x + 0.5) * TILE_SIZE, (y + 1) * TILE_SIZE - 6);
                    }
                }

                ctx.fillStyle = "#222";
                labelSearch(this.openTiles);
                labelSearch(this.closedTiles);

                // draw target tile's number order
                ctx.font = "16px Nunito";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                for(let i=0; i<this.targets.length; i++) ctx.fillText((i + 1), (this.targets[i] % this.width + 0.5) * TILE_SIZE + 1, (Math.floor(this.targets[i] / this.width) + 0.5) * TILE_SIZE);

                // draw unit tile's acsii art
                for(let i=0; i<this.units.length; i++) ctx.fillText("◕U◕", (this.units[i].x + 0.47) * TILE_SIZE + 1, (this.units[i].y + 0.5) * TILE_SIZE);

            } else if(mode === 1) { // life CURRENTLY THE SAME BUT WILL CHANGE
                for(var i = beginX; i < endX; i++) {
                    for(var j = beginY; j < endY; j++) {

                        // convert tile cartesian coordinates to tile array coordinates
                        let k = this.cartesianToIndex(i, j);

                        if(this.tiles[k] < 1) continue;

                        // set drawing context to tile style
                        ctx.fillStyle = "#020";
                        ctx.strokeStyle = "#030";
                        ctx.lineWidth = 9;
                        ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        ctx.strokeRect(i * TILE_SIZE + ctx.lineWidth/2, j * TILE_SIZE + ctx.lineWidth/2, TILE_SIZE - ctx.lineWidth, TILE_SIZE - ctx.lineWidth);
                    }
                }
            } else if(mode === 0) { // pixel art
                for(var i = beginX; i < endX; i++) {
                    for(var j = beginY; j < endY; j++) {

                        // convert tile cartesian coordinates to tile array coordinates
                        let k = this.cartesianToIndex(i, j);

                        if(this.tiles[k] < 1) continue;

                        // set drawing context to tile style
                        ctx.fillStyle = "#020";
                        ctx.strokeStyle = "#030";
                        ctx.lineWidth = 9;
                        ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        ctx.strokeRect(i * TILE_SIZE + ctx.lineWidth/2, j * TILE_SIZE + ctx.lineWidth/2, TILE_SIZE - ctx.lineWidth, TILE_SIZE - ctx.lineWidth);
                    }
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
        this.tiles = new Array(width * height).fill(0);
        requestAnimationFrame(draw);
    }
}

//#region initialize global variables

// input variables, mobile uses a few more in the mobile section of input
let pointerPos = {x: 0, y: 0};
let deltaPointer = {x: 0, y: 0};
let pointerActions = {primary: false, scroll: false};
let pointerSpread = 0;

// time
const TIMER_START = Date.now();
let performanceTimes = [];    // array of times taken for some code snippet to run (if too intricate to test online)

//const performanceTimeStart = Date.now();
//performanceTimes.push(Date.now() - performanceTimeStart);


// grid construction
const GRID_LINE_WIDTH = 6;
const TILE_SIZE = 32;
const MIN_WIDTH = 2;
const MAX_WIDTH = 256;
Grid = new Grid((window.innerWidth < window.innerHeight) ? Math.floor(window.innerWidth / TILE_SIZE) : Math.floor(window.innerHeight / TILE_SIZE), 0); // create grid to fill exactly or more than screen size;

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
let playing = false;
let playSpeed = 2;

// mode, 0: pixel art, 1: life; 2: pathfinding
let mode = -1;

// camera view
let cameraTrans = {scale: 1, offsetX: 0, offsetY: 0};
const ZOOM_AMOUNT = 0.1;
const ZOOM_MIN = 0.2 * Math.max(window.innerWidth, window.innerHeight) / 1200;    // this allows smaller screens to zoom almost the same amount as larger screens
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
                //document.getElementById("debug").innerHTML = logSteps();
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
        if(touchStartX && event.changedTouches.length === 1 && !menuMoving && Math.abs(touchStartX - event.changedTouches[0].clientX) > 20 && Date.now() - timeTouchStart < 300 && rangeStartValue === playSpeed) {
            clearInterval(frameInterval);
            if(Grid.simple) setSimpleViewMode();
            dipAnimation(true, (mode + Math.sign(touchStartX - event.changedTouches[0].clientX)).mod(3));
        }

        if(event.touches.length > 2) return;    // don't bother with 3 finger gestures
        if(!pointerActions.primary && !pointerActions.scroll) return;   // html buttons shouldn't be pressed over canvas
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

    //#region menuBarSwipe
    let touchStartX = 0;
    let timeTouchStart = 0;
    let rangeStartValue = 2;
    
    document.getElementById("barmenu").addEventListener('touchstart', (event) => {
        if(event.touches.length === 1) {
            touchStartX = event.changedTouches[0].clientX;
            timeTouchStart = Date.now();
            rangeStartValue = playSpeed;
        }
    }, false);
/*
    document.getElementById("barmenu").addEventListener('touchmove', (event) => {
        if(touchStartX && event.touches.length === 1) {
            touchEndX = event.touches[0].clientX - touchStartX;

            // if menu isn't already moving and swipe is within standard 0.3 seconds and at least 20 pixels big, or has reached the bottom of the screen
            if(!menuMoving && ((event.touches[0].clientX >= canvas.height - 20) || (touchEndX > 20 && Date.now() - timeTouchStart < 300))) {
                clearInterval(frameInterval);
                if(playing) playLife();
                if(Grid.simple) setSimpleViewMode();
                dipAnimation(true);
            }
        }
    }, false);*/
    //#endregion
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
            steps.push(null); // add empty step to mark where step started
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
     *  pc key input
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


let menuMoving = 100;
/**
 * Bar menu dip animation. Calls itself every step until animation is finished.
 * Menu dips down, changes out of view, then pops back up.
 * 
 * @param {*} dir     direction, down then up, used in animation
 * @param {*} newMode mode changing too
 */
function dipAnimation(dir, newMode) {
    if(dir) {
        if(mode == newMode) return;
        menuMoving += (100 - menuMoving) * 0.05;
        if(menuMoving > 99) {
            if(playing) {
                if(mode == 1) playLife();
                else if(mode == 2) playPathfinding();
            }
            dir = false;
            mode = newMode;
            var indicators = document.getElementById("menuIndicator").children;
            for(var i=1; i<indicators.length; i += 2) indicators[i].style.backgroundColor = (i === mode+1) ? "#f00" : "#a99";
            if(mode === 0) {    // pixel art, unselect all tools
                document.getElementById("toolbar").children[0].checked = false;
                document.getElementById("toolbar").children[2].checked = false;
                eraser = false;
                tileMode = 0;
                viewOnly = true;
                indicators[0].innerHTML = "Pixel Art";
                document.getElementById("toolbarPlatform").style.width = "142px";
            } else if(mode === 1) { // life, set tools to barrier + eraser
                document.getElementById("toolbar").children[0].checked = true;
                document.getElementById("toolbar").children[2].checked = true;
                document.getElementById("playBtn").onclick = function() {playLife()};
                document.getElementById("stepBtn").onclick = function() {stepLife(false)};
                eraser = true;
                tileMode = 1;
                viewOnly = false;
            } else if(mode === 2) { // pathfinding
                indicators[0].innerHTML = "Pathfinding";
                document.getElementById("toolbarPlatform").style.width = "156px";
                document.getElementById("playBtn").onclick = function() {playPathfinding()};
                document.getElementById("stepBtn").onclick = function() {stepPathfinding(false)};
            }
            requestAnimationFrame(draw);
        }
    } else {
        menuMoving += (-menuMoving) * 0.05;
        if(menuMoving < 1) menuMoving = 0;
    }

    if(mode === 0) {    // pixel art
        if(menuMoving > 20) document.getElementById("barmenu").style.bottom = 20-menuMoving + "px";
        document.getElementById("framebar").style.bottom = "-120px";
    } else if(mode === 1) { // life
        document.getElementById("barmenu").style.bottom = "-120px";
        document.getElementById("framebar").style.bottom = (134 - menuMoving) + "px";
    } else if(mode === 2) { // pathfinding
        if(menuMoving > 20) document.getElementById("barmenu").style.bottom = 20-menuMoving + "px";
        document.getElementById("framebar").style.bottom = (67 - menuMoving) + "px";
    }

    if(menuMoving) setTimeout(() => dipAnimation(dir, newMode), 1);
}
dipAnimation(true, 0);

document.addEventListener("keydown", (event) => {
    var key = event.which;

    if(key === 65) stepPathfinding(false);
});

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
    //document.getElementById("debug").innerHTML = logSteps();
}

// find and change the styles of the tiles the mouse is and has hovered over using deltaPointer movement
function styleTiles(style) {

    // translate cursor screen coordinates into grid coordinates
    let gx = Math.floor(((pointerPos.x - cameraTrans.offsetX)/cameraTrans.scale)/TILE_SIZE);
    let gy = Math.floor(((pointerPos.y - cameraTrans.offsetY)/cameraTrans.scale)/TILE_SIZE);
    checkTile(gx, gy, style);

    if(!deltaPointer.x && !deltaPointer.y) return;

    // translate last step cursor screen coordinates into grid coordinates
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
    const pos = mgx + mgy * Grid.width;
    if(eraser && !deltaPointer.x && !deltaPointer.y && Grid.tiles[pos] === style) erasing = true;
    if(erasing) style = 0;

    if(Grid.tiles[pos] !== style && Grid.tiles[pos] >= 0) {                         // if tile isn't same as new tile
        if(!playing) {
            steps.push({pos: pos, revert: Grid.tiles[pos]});    // push undo step
            if(Grid.tiles[pos] === 2) {                         // if tile is a target
                const index = Grid.targets.indexOf(pos);
                steps[steps.length-1].target = index;           // add target index number to last step
                Grid.targets.splice(index, 1);                  // remove this index from Grid.targets
            }
        }

        Grid.tiles[pos] = style;                            // set tile
        if(style === 2) Grid.targets.push(pos);             // if tile is now a target, add it to Grid.targets
        else if(style === 3) Grid.units.push({done: false, x: mgx, y: mgy}); // mark unit
    }
    document.getElementById("debug").innerHTML = logArray(Grid.targets);
}

// zoom in or out from the reference point
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
 *
 * Grid targets are a whole other miserable ball game.
 */
function undo() {
    if(steps.length <= 0 || playing) return;
    let step = steps.pop();
    let futureStep = [];

    if(!step) return;
    console.log('undo');
    for(var i=0; i < step.length; i++) {

        futureStep.push({pos: step[i].pos, revert: Grid.tiles[step[i].pos]});   // add tile to futureStep
        if(Grid.tiles[step[i].pos] === 2) {                                     // if tile is a target
            const index = Grid.targets.indexOf(step[i].pos);
            futureStep[futureStep.length-1].target = index;                     // add target index to last futureStep
            Grid.targets.splice(index, 1);                                      // remove target index from Grid.targets
        }

        Grid.tiles[step[i].pos] = step[i].revert;                               // set tile

        if(step[i].revert === 2) {                                              // if tile is now a target
            Grid.targets.splice(step[i].target, 0, step[i].pos);                // add tile position to Grid.targets on index target
            futureStep[futureStep.length-1].target = step[i].target;            // add target information to futureStep
        }
    }
    futureSteps.push(futureStep);
    requestAnimationFrame(draw);
    document.getElementById("debug").innerHTML = logArray(Grid.targets);
}


// inverse function of undo
function redo() {
    if(futureSteps.length <= 0 || playing) return;
    let futureStep = futureSteps.pop();
    let step = [];

    if(!futureStep) return;
    console.log('redo');
    for(var i=0; i < futureStep.length; i++) {
        step.push({pos: futureStep[i].pos, revert: Grid.tiles[futureStep[i].pos]});
        if(Grid.tiles[futureStep[i].pos] === 2) {
            const index = Grid.targets.indexOf(futureStep[i].pos);
            step[step.length-1].target = index;
            Grid.targets.splice(index, 1);
        }

        Grid.tiles[futureStep[i].pos] = futureStep[i].revert; // edit tile if coordinates are on grid

        if(futureStep[i].revert === 2) {
            Grid.targets.splice(futureStep[i].target, 0, futureStep[i].pos);
            step[step.length-1].target = futureStep[i].target;
        }

    }
    steps.push(step);
    requestAnimationFrame(draw);
    document.getElementById("debug").innerHTML = logArray(Grid.targets);
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

// set frame speed from html slider, [1 - 100]
function setFrameSpeed() {
    playSpeed = document.getElementById("frameSpeed").value;
    if(playSpeed > 9) playSpeed = (playSpeed-9) * 10;
    document.getElementById("frameSpeedText").innerHTML = "x" + playSpeed;
    clearInterval(frameInterval);
    if(playing) frameInterval = setTimeout(() => (mode == 1 ? stepLife(true) : stepPathfinding(true)), 1000 / playSpeed);
}

function setSimpleViewMode() {
    Grid.simple = !Grid.simple;
    const element = document.getElementById('simpleViewMode');
    if(Grid.simple) {
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

var frameInterval;

// update tiles by rules
function stepLife(playThread) {

    // step pressed while playing
    if(!playThread && playing) playLife();

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
            let totalNeighbors = 0;
            for(var j=0; j<8; j++) {
                if(Grid.tiles[neighbors[j]]) totalNeighbors++;
            }

            // Conway's Game of Life rules
            if(Grid.tiles[i] > 0) {
                if(totalNeighbors < 2 || totalNeighbors > 3) modifiedTiles[i] = 0;
            } else if(totalNeighbors === 3) modifiedTiles[i] = 1;

            neighbors = [null, null, null, null, null, null, null, null];
        }
    } else {
        const gridLength = Grid.tiles.length;
        for(var i=0; i<gridLength; i++) {
            const k = i - i.mod(Grid.width);

            // get all neighbor tiles references
            neighbors[7] = (i+1).mod(Grid.width) + k;
            neighbors[3] = (i-1).mod(Grid.width) + k;
            neighbors[1] = (i-Grid.width).mod(gridLength);
            neighbors[5] = (i+Grid.width).mod(gridLength);
            neighbors[0] = (neighbors[1] + 1).mod(Grid.width) + neighbors[1] - neighbors[1].mod(Grid.width);
            neighbors[2] = (neighbors[1] - 1).mod(Grid.width) + neighbors[1] - neighbors[1].mod(Grid.width);
            neighbors[6] = (neighbors[5] + 1).mod(Grid.width) + neighbors[5] - neighbors[5].mod(Grid.width);
            neighbors[4] = (neighbors[5] - 1).mod(Grid.width) + neighbors[5] - neighbors[5].mod(Grid.width);

            // filter out null or non-existant elements
            let totalNeighbors = 0;
            for(var j=0; j<8; j++) {
                if(Grid.tiles[neighbors[j]]) totalNeighbors++;
            }

            // Conway's Game of Life rules
            if(Grid.tiles[i] > 0) {
                if(totalNeighbors < 2 || totalNeighbors > 3) modifiedTiles[i] = 0;
            } else if(totalNeighbors === 3) modifiedTiles[i] = 1;

            neighbors = [null, null, null, null, null, null, null, null];
        }
    }

    if(!playThread) {
        futureSteps = [];
        let step = [];
        for(let i=0; i<Grid.tiles.length; i++) {
            if(Grid.tiles[i] !== modifiedTiles[i]) step.push({pos: i, revert: Grid.tiles[i]});
        }
        steps.push(step);
    }

    Grid.tiles = modifiedTiles;
    requestAnimationFrame(draw);

    if(playThread && playing) frameInterval = setTimeout(() => stepLife(true), 1000 / playSpeed);
}

function playLife() {
    playing = !playing;
    console.log((playing ? "Play" : "Pause") + " life");
    const element = document.getElementById('playBtn');
    if(playing) {
        futureSteps = [];
        let step = [];
        for(let i=0; i<Grid.tiles.length; i++) step.push({pos: i, revert: Grid.tiles[i]});
        steps.push(step);
        stepLife(true);
        element.style.backgroundColor = "#888";
        element.style.transform = "translateY(2px)";
        element.style.boxShadow = "0 4px #666";
        element.innerHTML = "II";
    } else {
        clearInterval(frameInterval);
        element.style.backgroundColor = "#222";
        element.style.transform = "translateY(-4px)";
        element.style.boxShadow = "0 10px #666";
        element.innerHTML = "Play";
    }
}

function playPathfinding() {
    if(!playing && (Grid.targets.length === 0 || Grid.units.length === 0)) return;
    playing = !playing;
    console.log((playing ? "Play" : "Pause") + " pathfinding");
    const element = document.getElementById('playBtn');
    if(playing) {
        futureSteps = [];
        let step = [];
        for(let i=0; i<Grid.tiles.length; i++) step.push({pos: i, revert: Grid.tiles[i]});
        steps.push(step);
        stepPathfinding(true);
        element.style.backgroundColor = "#888";
        element.style.transform = "translateY(2px)";
        element.style.boxShadow = "0 4px #666";
        element.innerHTML = "II";
    } else {
        clearInterval(frameInterval);
        element.style.backgroundColor = "#222";
        element.style.transform = "translateY(-4px)";
        element.style.boxShadow = "0 10px #666";
        element.innerHTML = "Play";
    }
}

let pathTile = null;    // last step's path tile back
let unitTurn = 0;       // which unit is currently pathfinding
let stepIndex = null;   // tile that unit steps to

/**
 * 
 * 
 * @param {*} playThread keeps pathfinding running at play speed
 */
function stepPathfinding(playThread) {
    //mode = 2;

    // step pressed while playing
    if(!playThread && playing) playPathfinding();

    // empty undo and redo steps
    futureSteps = [];

    // TODO add heuristic changes to steps

    // no path made yet
    if(!pathTile) {

        // no path possible
        if(!Grid.openTiles.length && Grid.units[unitTurn].done) {
            console.log("No path possible");

            let optimalIndex = null;
            for(let i=0; i<Grid.closedTiles.length; i++) {
                if(Math.abs(Grid.closedTiles[i].x - Grid.units[unitTurn].x) > 1 || Math.abs(Grid.closedTiles[i].y - Grid.units[unitTurn].y) > 1) continue;
                if(Math.abs(Grid.units[unitTurn].x - (Grid.targets[0] % Grid.width)) + Math.abs(Grid.units[unitTurn].y - Math.floor(Grid.targets[0] / Grid.width)) < Grid.closedTiles[i].g + Grid.closedTiles[i].h) continue;
                if(optimalIndex == null || Grid.closedTiles[i].g + Grid.closedTiles[i].h < Grid.closedTiles[optimalIndex].g + Grid.closedTiles[optimalIndex].h) optimalIndex = i;
            }
            if(optimalIndex != null) {
                Grid.tiles[Grid.units[unitTurn].x + Grid.units[unitTurn].y * Grid.width] = 0;
                Grid.units[unitTurn].x = Grid.closedTiles[optimalIndex].x;
                Grid.units[unitTurn].y = Grid.closedTiles[optimalIndex].y;
                Grid.tiles[Grid.units[unitTurn].x + Grid.units[unitTurn].y * Grid.width] = 3;
            }

            // clear all heuristics
            for(let i=0; i<Grid.tiles.length; i++) Grid.tiles[i] = Math.max(Grid.tiles[i], 0);
            Grid.closedTiles = [];
            Grid.openTiles = [];
            Grid.units[unitTurn].done = false;

            // stop pathfinding
            if(playing) playPathfinding();
            requestAnimationFrame(draw);
            return;
        }

        // initially calculate nodes adjacent to unit, then calculate openTiles
        if(!Grid.units[unitTurn].done) calculateAdjacentNodes(Grid.units[unitTurn].x, Grid.units[unitTurn].y, Grid.targets[0] % Grid.width, Math.floor(Grid.targets[0] / Grid.width), 0);
        else calculateAdjacentNodes(Grid.openTiles[0].x, Grid.openTiles[0].y, Grid.targets[0] % Grid.width, Math.floor(Grid.targets[0] / Grid.width), Grid.openTiles[0].g);
        Grid.units[unitTurn].done = true;
        
    } else {    // find optimal path back from target

        // pathTile next to unit
        if(stepIndex != null) {

            // step unit
            Grid.tiles[Grid.units[unitTurn].x + Grid.units[unitTurn].y * Grid.width] = 0;
            Grid.units[unitTurn].x = Grid.closedTiles[stepIndex].x;
            Grid.units[unitTurn].y = Grid.closedTiles[stepIndex].y;
            Grid.tiles[Grid.units[unitTurn].x + Grid.units[unitTurn].y * Grid.width] = 3;

            // clear all heuristics
            for(let i=0; i<Grid.tiles.length; i++) Grid.tiles[i] = Math.max(Grid.tiles[i], 0);
            Grid.closedTiles = [];
            Grid.openTiles = [];

            // next unit loop
            unitTurn++;
            unitTurn %= Grid.units.length;
            Grid.units[unitTurn].done = false;
            optimalIndex = null;
            stepIndex = null;
            pathTile = null;
        } else {

            let optimalIndex = null;
            for(let i=0; i<Grid.closedTiles.length; i++) {
                if(Math.abs(pathTile.x - Grid.closedTiles[i].x) > 1 ||  Math.abs(pathTile.y - Grid.closedTiles[i].y) > 1 || (pathTile.x == Grid.closedTiles[i].x && pathTile.y == Grid.closedTiles[i].y)) continue;
                if(optimalIndex == null || Grid.closedTiles[i].g < Grid.closedTiles[optimalIndex].g) {
                    optimalIndex = i;
                }
            }

            if(optimalIndex != null) {
                Grid.tiles[Grid.closedTiles[optimalIndex].reference] = -3;
                if(Grid.closedTiles[optimalIndex].g < 1.5) {
                    stepIndex = optimalIndex;
                    if(playing) playPathfinding(); // stop pathfinding
                } else {
                    pathTile.x = Grid.closedTiles[optimalIndex].x;
                    pathTile.y = Grid.closedTiles[optimalIndex].y;
                }
            }
        }
    }

    requestAnimationFrame(draw);


    if(playThread && playing) frameInterval = setTimeout(() => stepPathfinding(true), 1000 / playSpeed);
}

/**
 * Given an openTile and a target, calculate the F, G, and H cost of each adjacent node.
 * 
 * @param {*} x         current node grid x
 * @param {*} y         current node grid y
 * @param {*} targetX   target node grid x
 * @param {*} targetY   target node grid y
 * @param {*} addG      current node G cost
 */
function calculateAdjacentNodes(x, y, targetX, targetY, addG) {
    var neighborTiles = [null, null, null, null, null, null, null, null];
    let modifiedTiles = [...Grid.tiles];

    // if they exist, get right, left, up, down tile's style
    if(x < Grid.width-1) neighborTiles[7] = modifiedTiles[x+1 + y * Grid.width];
    if(x > 0) neighborTiles[3] = modifiedTiles[x-1 + y * Grid.width];
    if(y > 0) neighborTiles[1] = modifiedTiles[x + (y-1) * Grid.width];
    if(y < Grid.height-1) neighborTiles[5] = modifiedTiles[x + (y+1) * Grid.width];

    // find if corner neighbor Grid.tiles upright, upleft, downright, and downleft exist, if so, get their tile's style
    if(neighborTiles[1] !== null) {
        if(neighborTiles[7] !== null/* && (neighborTiles[1] <= 0 || neighborTiles[7] <= 0) USE THIS TO DISABLE CORNER TILE MOVEMENT*/) neighborTiles[0] = modifiedTiles[x+1 + (y-1) * Grid.width];
        if(neighborTiles[3] !== null/* && (neighborTiles[1] <= 0 || neighborTiles[3] <= 0)*/) neighborTiles[2] = modifiedTiles[x-1 + (y-1) * Grid.width];
    }
    if(neighborTiles[5] !== null) {
        if(neighborTiles[7] !== null/* && (neighborTiles[5] <= 0 || neighborTiles[7] <= 0)*/) neighborTiles[6] = modifiedTiles[x+1 + (y+1) * Grid.width];
        if(neighborTiles[3] !== null/* && (neighborTiles[5] <= 0 || neighborTiles[3] <= 0)*/) neighborTiles[4] = modifiedTiles[x-1 + (y+1) * Grid.width];
    }

    if(Grid.openTiles.length > 0) {
        modifiedTiles[Grid.openTiles[0].x + Grid.openTiles[0].y * Grid.width] = -2;     // lowest f cost openTile looks like a closed tile
        Grid.closedTiles.push(Grid.openTiles.shift());                                  // remove lowest f cost openTile and add it to closedTiles
    }

    for(var j=0; j<8; j++) {
        let xPos = x;
        let yPos = y;
        if(j < 3) yPos--;
        else if(j !== 3 && j !== 7) yPos++;
        if(j > 1 && j < 5) xPos--;
        else if(j != 1 && j != 5) xPos++;   // get neighbor tile's position

        const distX = Math.abs(targetX - xPos);
        const distY = Math.abs(targetY - yPos);
        const g = ((xPos != x && yPos != y) ? Math.sqrt(2) + addG : 1 + addG);  // real distance from unit
        const h = distX + distY;    // line distance to target

        //const h = difference + Math.min(xDist, yDist) * Math.sqrt(2); AWUFUL h calculation!
        //const h = distX + distY + Math.min(distX, distY) * (Math.sqrt(2) - 2);    //diagonal Manhattan

        if(neighborTiles[j] === 0) {   // for each open neighbor tile
            const reference = xPos + yPos * Grid.width;
            modifiedTiles[reference] = -1;

            // insert in sorted openTiles position
            if(Grid.openTiles.length > 0) {
                Grid.openTiles.push({reference: reference, g: g, h: h, x: xPos, y: yPos});
                Grid.openTiles.sort((a, b) => {
                    const dif = a.g + a.h - b.g - b.h;
                    if(!dif) return a.g + a.h;
                    return dif;
                });
            } else Grid.openTiles.push({reference: reference, g: g, h: h, x: xPos, y: yPos});

        } else if(neighborTiles[j] === -1) {    // refactor self to other open tile
            for(let k=0; k<Grid.openTiles.length; k++) {
                if(Grid.openTiles[k].x === xPos && Grid.openTiles[k].y === yPos && g < Grid.openTiles[k].g) {
                    Grid.openTiles[k].g = g;

                    Grid.openTiles.sort((a, b) => {
                        return a.g + a.h - b.g - b.h;
                    });
                    break;
                }
            }
        }
    }
    Grid.tiles = modifiedTiles;

    // unit is next to tile
    if(Math.abs(targetX - x) < 2 && Math.abs(targetY - y) < 2) pathTile = {x: targetX, y: targetY};
}

//#endregion

//#region debug

// return a string displaying undo/redo steps. (#, #) are complete steps, (#, 6) shows number of changed tiles in current step
function logSteps() {
    let str = "(";
    let i=0;
    while(steps[i]) {
        str += "#, ";
        i++;
    }
    if(steps.length > i) str += (steps.length-1 - i) + ")";
    else str = str.substr(0, str.length - 2) + ")";
    if(str.length === 1) str = "()";
    return str;
}

// return a string displaying the contents of the given array
function logArray(a) {
    let str = "T(";
    let i=0;
    while(i < a.length) {
        str += a[i] + ", ";
        i++;
    }
    str = str.substr(0, str.length - 2) + ")";
    if(Grid.targets.length === 0) str = "()";
    return str;
}

// return a string displaying the mean, min, max and length of values in milliseconds
function logPerformanceTime() {

    let mean = performanceTimes[0];
    let min = mean;
    let max = min;
    for(let i=1; i<performanceTimes.length; i++) {
        mean += performanceTimes[i];
        if(performanceTimes[i] < min) min = performanceTimes[i];
        if(performanceTimes[i] > max) max = performanceTimes[i];
    }
    mean /= performanceTimes.length;

    return "mean: " + mean.toFixed(3) + ", min: " + min + ", max: " + max + ", len: " + performanceTimes.length;
}

//#endregion
