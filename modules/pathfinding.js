
'use-strict';

const SQRT_2 = Math.sqrt(2);

/**
 * 
 * @param {*} grid Grid object
 * @param {*} pause callback pauses algorithm animation
 */
 export function stepPathfinding(grid, pause) {

  // TODO add heuristic changes to steps (undo)

  // no optimal path made yet, still searching
  if (!grid.pathTile) {
    
    let targetX = grid.target % grid.width, 
        targetY = Math.floor(grid.target / grid.width);

    // if next to target, step unit
    /*if (Math.abs(grid.units[grid.unitTurn].x - targetX) < 2 && Math.abs(grid.units[grid.unitTurn].y - targetY) < 2) {
      grid.tiles[grid.units[grid.unitTurn].x + grid.units[grid.unitTurn].y * grid.width] = 0;
      grid.units.splice(grid.unitTurn, 1);
      grid.clearPathfinding(); // clear all heuristics
      pause();
      return;
    }*/

    // initially close tile unit is on, then close openTiles. Calc will find pathTile
    if (grid.openTiles.length) calculateAdjacentNodes(grid, grid.openTiles[0].x, grid.openTiles[0].y, targetX, targetY, grid.openTiles[0].g);
    else calculateAdjacentNodes(grid, grid.units[grid.unitTurn].x, grid.units[grid.unitTurn].y, targetX, targetY, 0);

    if (grid.openTiles.length) return;  // there are still tiles to search

    console.log("No path possible");
    let optimalIndex = null;

    if (!grid.closedTiles.length) {  // completely boxed in
      grid.unitTurn++;
      grid.clearPathfinding();
      pause();
      return;
    }

    // find optimalIndex to move towards target with minimal g + h
    grid.closedTiles.forEach((tile, i) => {
      let unitTile = grid.units[grid.unitTurn];
      if (Math.abs(tile.x - unitTile.x) > 1 || Math.abs(tile.y - unitTile.y) > 1) return; // find neighboring closed tiles
      if (optimalIndex === null || tile.g + tile.h < grid.closedTiles[optimalIndex].g + grid.closedTiles[optimalIndex].h) optimalIndex = i;  // find optimal direction to move
    });

    if (optimalIndex !== null) {
      let optimalTile = grid.closedTiles[optimalIndex];
      grid.tiles[optimalTile.reference] = -3;
      grid.pathTile = {x: optimalTile.x, y: optimalTile.y};
      grid.stepIndex = optimalIndex;
      pause();
    }
    //requestAnimationFrame(draw);
      
  } else {  // find optimal path back from target

    // stepIndex where this unit will step next
    if (grid.stepIndex !== null) {

      // step unit
      grid.tiles[grid.units[grid.unitTurn].x + grid.units[grid.unitTurn].y * grid.width] = 0;
      grid.units[grid.unitTurn].x = grid.closedTiles[grid.stepIndex].x;
      grid.units[grid.unitTurn].y = grid.closedTiles[grid.stepIndex].y;
      grid.tiles[grid.units[grid.unitTurn].x + grid.units[grid.unitTurn].y * grid.width] = 3;

      // next unit loop
      grid.unitTurn++;
      grid.clearPathfinding();
    } else {

      let targetX = grid.target % grid.width, 
        targetY = Math.floor(grid.target / grid.width);
      if (Math.abs(grid.units[grid.unitTurn].x - targetX) < 2 && Math.abs(grid.units[grid.unitTurn].y - targetY) < 2) {
        grid.tiles[grid.units[grid.unitTurn].x + grid.units[grid.unitTurn].y * grid.width] = 0;
        grid.units.splice(grid.unitTurn, 1);
        grid.clearPathfinding(); // clear all heuristics
        pause();
        return;
      }

      // go through all closed tiles to find lowest optimal g cost
      let optimalIndex = null;
      grid.closedTiles.forEach((tile, i) => {
        //if (Math.abs(grid.pathTile.x - tile.x) > 1 ||  Math.abs(grid.pathTile.y - tile.y) > 1 || (grid.pathTile.x === tile.x && grid.pathTile.y === tile.y)) return;
        if (Math.abs(grid.pathTile.x - tile.x) > 1 ||  Math.abs(grid.pathTile.y - tile.y) > 1) return;
        if (optimalIndex === null || tile.g < grid.closedTiles[optimalIndex].g) optimalIndex = i;
      });

      if (optimalIndex !== null) {
        let optimalTile = grid.closedTiles[optimalIndex];
        grid.tiles[optimalTile.reference] = -3;
        if (optimalTile.g < 1.5) {  // found next move for this unit
          grid.stepIndex = optimalIndex;
          pause();
        } else {
          grid.pathTile.x = optimalTile.x;
          grid.pathTile.y = optimalTile.y;
        }
      }
    }
  }
}

/**
 * Given an openTile and a target, calculate the F, G, and H cost of each adjacent node.
 * 
 * @param {*} x     current node grid x
 * @param {*} y     current node grid y
 * @param {*} targetX   target node grid x
 * @param {*} targetY   target node grid y
 * @param {*} addG    current node G cost
 */
 function calculateAdjacentNodes(grid, x, y, targetX, targetY, addG) {
  let neighborTiles = [null, null, null, null, null, null, null, null];

  // if they exist, get right, left, up, down tile's style
  if (x < grid.width - 1) neighborTiles[7] = grid.tiles[x + 1 + y * grid.width];
  if (x > 0) neighborTiles[3] = grid.tiles[x - 1 + y * grid.width];
  if (y > 0) neighborTiles[1] = grid.tiles[x + (y - 1) * grid.width];
  if (y < grid.height - 1) neighborTiles[5] = grid.tiles[x + (y + 1) * grid.width];

  // find if corner neighbor tiles upright, upleft, downright, and downleft exist, if so, get their tile's style
  if (neighborTiles[1] !== null) {
    if (neighborTiles[7] !== null/* && (neighborTiles[1] <= 0 || neighborTiles[7] <= 0) USE THIS TO DISABLE CORNER TILE CROSSING*/) neighborTiles[0] = grid.tiles[x + 1 + (y - 1) * grid.width];
    if (neighborTiles[3] !== null/* && (neighborTiles[1] <= 0 || neighborTiles[3] <= 0)*/) neighborTiles[2] = grid.tiles[x - 1 + (y - 1) * grid.width];
  }
  if (neighborTiles[5] !== null) {
    if (neighborTiles[7] !== null/* && (neighborTiles[5] <= 0 || neighborTiles[7] <= 0)*/) neighborTiles[6] = grid.tiles[x + 1 + (y + 1) * grid.width];
    if (neighborTiles[3] !== null/* && (neighborTiles[5] <= 0 || neighborTiles[3] <= 0)*/) neighborTiles[4] = grid.tiles[x - 1 + (y + 1) * grid.width];
  }

  if (grid.openTiles.length > 0) {
    grid.tiles[grid.openTiles[0].x + grid.openTiles[0].y * grid.width] = -2;   // lowest f cost openTile looks like a closed tile
    grid.closedTiles.push(grid.openTiles.shift());                  // remove lowest f cost openTile and add it to closedTiles
  }

  // go through all neighbor tiles
  for (let j = 0; j < 8; j++) {
    let xPos = x;
    let yPos = y;
    if (j < 3) yPos--;
    else if (j !== 3 && j !== 7) yPos++;
    if (j > 1 && j < 5) xPos--;
    else if (j != 1 && j != 5) xPos++;   // get neighbor tile's position

    const distX = Math.abs(targetX - xPos);
    const distY = Math.abs(targetY - yPos);
    const g = ((xPos != x && yPos != y) ? SQRT_2 + addG : 1 + addG);  // real distance from unit
    const h = Math.sqrt(distX * distX + distY * distY);  // line distance to target
    //const h = distX + distY;  // easy calculation to target

    if (neighborTiles[j] === 0) {   // for each open neighbor tile
      const reference = xPos + yPos * grid.width;
      grid.tiles[reference] = -1;

      // insert in sorted openTiles position
      if (grid.openTiles.length > 0) {
        grid.openTiles.push({reference: reference, g: g, h: h, x: xPos, y: yPos});
        grid.openTiles.sort((a, b) => {
          const dif = a.g + a.h - b.g - b.h;
          if (!dif) return a.g + a.h;
          return dif;
        });
      } else grid.openTiles.push({reference: reference, g: g, h: h, x: xPos, y: yPos});

    } else if (neighborTiles[j] === -1) {  // refactor self to other open tile
      for (let k=0; k<grid.openTiles.length; k++) {
        if (grid.openTiles[k].x === xPos && grid.openTiles[k].y === yPos && g < grid.openTiles[k].g) {
          grid.openTiles[k].g = g;

          grid.openTiles.sort((a, b) => {
            return a.g + a.h - b.g - b.h;
          });
          break;
        }
      }
    }
  }

  // unit is next to target
  if (Math.abs(targetX - x) < 2 && Math.abs(targetY - y) < 2) grid.pathTile = {x: targetX, y: targetY};
}
