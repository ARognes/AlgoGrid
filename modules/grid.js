const GRID_LINE_WIDTH = 6,
      MIN_WIDTH = 2,
      MAX_WIDTH = 256;

export const TILE_SIZE = 32;

// camera view
export let canvas = document.getElementById('canvas'), 
           ctx = canvas.getContext('2d'),
           cameraTrans = {scale: 1, offsetX: 0, offsetY: 0};

//resize canvas on load
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let times = [];
let startTime = 0;

export class Grid {
  constructor(width, height) {
    this.repeat = false;
    this.simple = false;
    this.mode = -1;
    this.drawTiles = () => {};

    // pathfinding arrays
    this.units = [];
    this.target = null;
    this.openTiles = [];
    this.closedTiles = [];
    this.pathTile = null;   // used when retracing optimal path back to unit from target
    this.unitTurn = 0;      // which unit is currently pathfinding
    this.stepIndex = null;  // tile that unit steps to

    this.setSize(width, height === 0 ? width : height);
  }

  // convert tile cartesian coordinates to tile array coordinates
  cartesianToIndex(i, j) {
    return this.repeat ? i.mod(this.width) + j.mod(this.height) * this.width : i + j * this.width;
  }

  draw() {

    let tileScaled = cameraTrans.scale * TILE_SIZE;
    let beginX = Math.floor(-cameraTrans.offsetX / tileScaled);
    let beginY = Math.floor(-cameraTrans.offsetY / tileScaled);
    let endX, endY, viewWidth, viewHeight;
    if (this.repeat && this.mode !== 2) {    // find first tile in view and the view size
      viewWidth = Math.ceil(canvas.width / tileScaled) + 1;
      viewHeight = Math.ceil(canvas.height / tileScaled) + 1;
      endX = beginX + viewWidth;
      endY = beginY + viewHeight;
    } else {              // if grid not in view, return, else find first and last tiles in view
      beginX = Math.max(beginX, 0);
      beginY = Math.max(beginY, 0);
      endX = Math.min(Math.ceil((canvas.width - cameraTrans.offsetX) / tileScaled), this.width);
      endY = Math.min(Math.ceil((canvas.height - cameraTrans.offsetY) / tileScaled), this.height);
    }

    if (this.simple) {  // draw simple grid for better performance

      // draw grid background
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE);

      ctx.fillStyle = "#fff";
      ctx.lineWidth = 3;
      if (this.mode === 2) {  // pathfinding
        for (let i = beginX; i < endX; i++) {
          for (let j = beginY; j < endY; j++) {
            let tile = this.tiles[this.cartesianToIndex(i, j)];
            if (!tile) continue;      // only draw barriers
            switch(tile) {
              case 1: ctx.fillStyle = '#fff'; break;
              case 2: ctx.fillStyle = '#f33'; break;
              case 3: ctx.fillStyle = '#3f3'; break;
              case -1: ctx.fillStyle = '#333'; break;
              case -2: ctx.fillStyle = '#444'; break;
              case -3: ctx.fillStyle = '#666'; break;
            }
            ctx.fillRect(i * TILE_SIZE + 2, j * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);   // draw alive
          }
        }
        return;
      }

      // draw tiles
      ctx.fillStyle = "#fff";
      ctx.lineWidth = 3;
      for (let i = beginX; i < endX; i++) {
        for (let j = beginY; j < endY; j++) {
          if (!this.tiles[this.cartesianToIndex(i, j)]) continue;      // only draw barriers
          ctx.fillRect(i * TILE_SIZE + 2, j * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);   // draw alive
        }
      }
      return;
    }
    // draw normal grid with details

    if (this.repeat) { // draw canvas background
      ctx.fillStyle = "#daa";
      ctx.fillRect(beginX * TILE_SIZE, beginY * TILE_SIZE, viewWidth * TILE_SIZE, viewHeight * TILE_SIZE);
    }

    // draw grid background
    ctx.fillStyle = "#fcc";
    ctx.fillRect(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE);

    // draw grid background lines
    ctx.strokeStyle = "#a99";
    ctx.lineWidth = GRID_LINE_WIDTH;
    for (let i = beginX; i <= endX; i++) {
      ctx.beginPath();
      ctx.moveTo(i * TILE_SIZE, beginY * TILE_SIZE);
      ctx.lineTo(i * TILE_SIZE, endY * TILE_SIZE);
      ctx.stroke();
    }
    for (let i = beginY; i <= endY; i++) {
      ctx.beginPath();
      ctx.moveTo(beginX * TILE_SIZE, i * TILE_SIZE);
      ctx.lineTo(endX * TILE_SIZE, i * TILE_SIZE);
      ctx.stroke();
    }

    this.drawTiles(beginX, endX, beginY, endY);
  }

  // set size expects sizes out of bounds to be caught by the html/css, but clamps the values just in case something goes wrong
  setSize(width, height) {
    width = Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH);
    height = Math.min(Math.max(height, MIN_WIDTH), MAX_WIDTH);
    this.width = width;
    this.height = height;
    this.tiles = new Array(width * height).fill(0);
  }

  // switch draw function on mode change instead of on draw
  setMode(mode) {
    this.mode = mode;
    switch(mode) {
      case 1: this.drawTiles = (beginX, endX, beginY, endY) => this.drawLife(beginX, endX, beginY, endY); break;
      case 2: this.drawTiles = (beginX, endX, beginY, endY) => this.drawPathfinding(beginX, endX, beginY, endY); break;
      default: this.drawTiles = (beginX, endX, beginY, endY) => this.drawPixelArt(beginX, endX, beginY, endY); break;
    }
  }

  drawPixelArt(beginX, endX, beginY, endY) {
    for (let i = beginX; i < endX; i++) {
      for (let j = beginY; j < endY; j++) {
  
        // convert tile cartesian coordinates to tile array coordinates
        let k = this.cartesianToIndex(i, j);
  
        if (this.tiles[k] < 1) continue;
  
        // set drawing context to tile style
        ctx.fillStyle = "#020";
        ctx.strokeStyle = "#030";
        ctx.lineWidth = 9;
        ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeRect(i * TILE_SIZE + ctx.lineWidth/2, j * TILE_SIZE + ctx.lineWidth/2, TILE_SIZE - ctx.lineWidth, TILE_SIZE - ctx.lineWidth);
      }
    }
  }
  
  drawLife(beginX, endX, beginY, endY) {

    // set drawing context to tile style
    ctx.fillStyle = "#020";
    ctx.strokeStyle = "#030";
    ctx.lineWidth = 9;
    for (let i = beginX; i < endX; i++) {
      for (let j = beginY; j < endY; j++) {
  
        // convert tile cartesian coordinates to tile array coordinates
        let k = this.cartesianToIndex(i, j);
  
        if (this.tiles[k] < 1) continue;

        ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeRect(i * TILE_SIZE + ctx.lineWidth/2, j * TILE_SIZE + ctx.lineWidth/2, TILE_SIZE - ctx.lineWidth, TILE_SIZE - ctx.lineWidth);
      }
    }
  }
  
  drawPathfinding(beginX, endX, beginY, endY) {
    for (let i = beginX; i < endX; i++) {
      for (let j = beginY; j < endY; j++) {
  
        // convert tile cartesian coordinates to tile array coordinates
        let k = this.cartesianToIndex(i, j);
  
        if (!this.tiles[k]) continue;
  
        // set drawing context to tile style
        ctx.lineWidth = 3;
  
        if (this.tiles[k] === 1) {                       // barrier
          ctx.fillStyle = "#020";
          ctx.strokeStyle = "#030";
          ctx.lineWidth = 9;
        } else if (this.tiles[k] === 2) {                // target
          ctx.fillStyle = "#f44";
          ctx.strokeStyle = "#d44";
        } else if (this.tiles[k] === 3) {                // unit
          ctx.fillStyle = "#4f4";
          ctx.strokeStyle = "#4d4";
        } else if (this.tiles[k] === -1) {                // open tile
          ctx.fillStyle = "#f99";
          ctx.strokeStyle = "#f66";
        } else if (this.tiles[k] === -2) {                // closed tile
          ctx.fillStyle = "#f66";
          ctx.strokeStyle = "#f33";
        } else if (this.tiles[k] === -3) {                // path
          ctx.fillStyle = "#ff0";
          ctx.strokeStyle = "#dd0";
        }
        ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeRect(i * TILE_SIZE + ctx.lineWidth/2, j * TILE_SIZE + ctx.lineWidth/2, TILE_SIZE - ctx.lineWidth, TILE_SIZE - ctx.lineWidth);
      }
    }
  
    // draw search tile numbers g, h, f;   f = g + h
    function labelSearch(searched) {
      for (let i=0; i<searched.length; i++) {
        if (searched[i].reference == null) continue;
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
    //for (let i=0; i<this.targets.length; i++) ctx.fillText((i + 1), (this.targets[i] % this.width + 0.5) * TILE_SIZE + 1, (Math.floor(this.targets[i] / this.width) + 0.5) * TILE_SIZE);
  
    // draw target tile
    if (this.target != null) ctx.fillText("X", (this.target % this.width + 0.47) * TILE_SIZE + 1, (Math.floor(this.target / this.width) + 0.56) * TILE_SIZE);
  
    // draw unit tile's number
    for (let i=0; i<this.units.length; i++) ctx.fillText(i + 1, (this.units[i].x + 0.47) * TILE_SIZE + 1, (this.units[i].y + 0.5) * TILE_SIZE);
  }

  clearPathfinding() {
    grid.tiles = grid.tiles.map(tile => Math.max(tile, 0));
    grid.closedTiles = [];
    grid.openTiles = [];
    grid.unitTurn %= Math.max(grid.units.length, 1);
    grid.stepIndex = null;
    grid.pathTile = null;
  }
}

// grid construction
export let grid = new Grid((window.innerWidth < window.innerHeight) ? Math.floor(window.innerWidth / TILE_SIZE) : Math.floor(window.innerHeight / TILE_SIZE), 0, cameraTrans, canvas); // create grid to fill exactly or more than screen size;
