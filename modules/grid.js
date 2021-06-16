'use-strict';

const GRID_LINE_WIDTH = 6,
      MIN_WIDTH = 2,
      MAX_WIDTH = 256,
      SHOW_LABEL_DIST = 6;

export const TILE_SIZE = 32;

// camera view
export let canvas = document.getElementById('canvas'), 
           ctx = canvas.getContext('2d'),
           cameraTrans = {scale: 1, offsetX: 0, offsetY: 0};

//resize canvas on load
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

export class Grid {
  constructor(width, height) {
    this.pointerPos = null;
    this.simple = false;
    this.mode = null;
    this.lastMode = null;
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
    return this.simple ? i.mod(this.width) + j.mod(this.height) * this.width : i + j * this.width;
  }

  draw() {

    let tileScaled = cameraTrans.scale * TILE_SIZE;
    let beginX = Math.floor(-cameraTrans.offsetX / tileScaled);
    let beginY = Math.floor(-cameraTrans.offsetY / tileScaled);
    let endX, endY, viewWidth, viewHeight;
    if (this.simple && this.mode !== 'pathfinding') {    // find first tile in view and the view size
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

      ctx.lineWidth = 3;
      if (this.mode === 'pathfinding') {  // pathfinding
        
        // draw grid background
        ctx.fillStyle = "#444";
        ctx.fillRect(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE);

        for (let i = beginX; i < endX; i++) {
          for (let j = beginY; j < endY; j++) {
            let tile = this.tiles[this.cartesianToIndex(i, j)];
            if (!tile) continue;
            switch(tile) {
              case 1: ctx.fillStyle = '#000'; break;
              case 2: ctx.fillStyle = '#f33'; break;
              case 3: ctx.fillStyle = '#3f3'; break;
              case -1: ctx.fillStyle = '#666'; break;
              case -2: ctx.fillStyle = '#777'; break;
              case -3: ctx.fillStyle = '#999'; break;
            }
            ctx.fillRect(i * TILE_SIZE + 2, j * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);   // draw alive
          }
        }
        if (this.pointerPos) {
          ctx.fillStyle = '#000';
          this.labelSearch(this.openTiles, true);
          this.labelSearch(this.closedTiles, true);
        }
        return;
      }

      // draw grid background
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE);
      
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
    this.clearPathfinding();
  }

  // switch draw function on mode change instead of on draw
  setMode(mode) {
    this.lastMode = this.mode;
    this.mode = mode;
    switch(mode) {
      case 'life': this.drawTiles = (beginX, endX, beginY, endY) => this.drawLife(beginX, endX, beginY, endY); break;
      case 'pathfinding': 
        this.drawTiles = (beginX, endX, beginY, endY) => this.drawPathfinding(beginX, endX, beginY, endY);
        if (this.target) this.tiles[this.target] = 2;
        this.units.forEach(unit => this.tiles[unit.x + unit.y * this.width] = 3);
        break;
    }
    this.clearPathfinding();
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
        ctx.strokeRect(i * TILE_SIZE + ctx.lineWidth / 2, j * TILE_SIZE + ctx.lineWidth / 2, TILE_SIZE - ctx.lineWidth, TILE_SIZE - ctx.lineWidth);
      }
    }
  }

  // draw search tile numbers g, h, f;   f = g + h
  labelSearch(searched, usePointer) {
    ctx.textAlign = "center";
    searched.forEach(tile => {
      if (tile.reference === null) return;
      if (usePointer && Math.pow(tile.x - this.pointerPos.x, 2) + Math.pow(tile.y - this.pointerPos.y, 2) > SHOW_LABEL_DIST) return;
      const g = Math.round(tile.g * 10);
      const h = Math.round(tile.h * 10);
      const x = tile.x;
      const y = tile.y;
      ctx.font = "8px Nunito";
      ctx.fillText(g, (x + 0.5) * TILE_SIZE, (y + 1) * TILE_SIZE - 24);
      ctx.fillText(h, (x + 0.5) * TILE_SIZE, (y + 1) * TILE_SIZE - 16);
      ctx.font = Math.max(19 - 3 * (g + h).toFixed().length, 8) + "px Nunito";
      ctx.fillText((g + h), (x + 0.5) * TILE_SIZE, (y + 1) * TILE_SIZE - 6);
    });
  }
  
  drawPathfinding(beginX, endX, beginY, endY) {
    for (let i = beginX; i < endX; i++) {
      for (let j = beginY; j < endY; j++) {
  
        // convert tile cartesian coordinates to tile array coordinates
        let k = this.cartesianToIndex(i, j);
  
        if (!this.tiles[k]) continue;

        //                    fill, stroke, line width
        const TILE_COLORS = [['#ff0', '#dd0', 3], // path
                             ['#f66', '#f33', 3], // closed tile
                             ['#f99', '#f66', 3], // open tile
                             null, 
                             ['#020', '#030', 9], // barrier
                             ['#f44', '#d44', 3], // target
                             ['#4f4', '#4d4', 3]];// unit
        ctx.fillStyle = TILE_COLORS[this.tiles[k] + 3][0];
        ctx.strokeStyle = TILE_COLORS[this.tiles[k] + 3][1];
        ctx.lineWidth = TILE_COLORS[this.tiles[k] + 3][2];

        ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeRect(i * TILE_SIZE + ctx.lineWidth / 2, j * TILE_SIZE + ctx.lineWidth / 2, TILE_SIZE - ctx.lineWidth, TILE_SIZE - ctx.lineWidth);
      }
    }
  
    ctx.fillStyle = "#222";
    this.labelSearch(this.openTiles);
    this.labelSearch(this.closedTiles);
  
    // draw target tile's number order
    ctx.font = "16px Nunito";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // draw target tile
    if (this.target !== null) ctx.fillText("X", (this.target % this.width + 0.47) * TILE_SIZE + 1, (Math.floor(this.target / this.width) + 0.56) * TILE_SIZE);
      
    // draw unit tile's number
    this.units.forEach((unit, i) => ctx.fillText(i + 1, (unit.x + 0.47) * TILE_SIZE + 1, (unit.y + 0.5) * TILE_SIZE));
  }

  clearPathfinding() {
    this.tiles = this.tiles.map(tile => Math.max(tile, 0));
    this.closedTiles = [];
    this.openTiles = [];
    this.unitTurn %= Math.max(this.units.length, 1);
    this.stepIndex = null;
    this.pathTile = null;
  }
}

// grid construction
export let grid = new Grid((window.innerWidth < window.innerHeight) ? Math.floor(window.innerWidth / TILE_SIZE) : Math.floor(window.innerHeight / TILE_SIZE), 0, cameraTrans, canvas); // create grid to fill exactly or more than screen size;
