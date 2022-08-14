'use-strict';

// update tiles by rules
export function stepLife(grid) {
  
  // neighbor tile location in array is stores here
  let neighbors = [null, null, null, null, null, null, null, null];
  let modifiedTiles = [...grid.tiles];

  if (!grid.simple) {
    for (let i=0; i<grid.tiles.length; i++) {
      const k = i.mod(grid.width);

      // find if neighbor grid.tiles right, left, up, and down exist, if so, get their address
      if ((k+1).mod(grid.width) > k) neighbors[7] = i+1;
      if ((k-1).mod(grid.width) < k) neighbors[3] = i-1;
      if ((i-grid.width) >= 0) neighbors[1] = i-grid.width;
      if ((i+grid.width) < grid.tiles.length) neighbors[5] = i+grid.width;

      // find if corner neighbor grid.tiles upright, upleft, downright, and downleft exist, if so, get their address
      if (neighbors[1] !== null) {
        if (neighbors[7] !== null) neighbors[0] = neighbors[1] + 1;
        if (neighbors[3] !== null) neighbors[2] = neighbors[1] - 1;
      }
      if (neighbors[5] !== null) {
        if (neighbors[7] !== null) neighbors[6] = neighbors[5] + 1;
        if (neighbors[3] !== null) neighbors[4] = neighbors[5] - 1;
      }

      // filter out null or non-existant elements
      let totalNeighbors = 0;
      for (let j=0; j<8; j++) {
        if (grid.tiles[neighbors[j]]) totalNeighbors++;
      }

      // Conway's Game of Life rules
      if (grid.tiles[i] > 0) {
        if (totalNeighbors < 2 || totalNeighbors > 3) modifiedTiles[i] = 0;
      } else if (totalNeighbors === 3) modifiedTiles[i] = 1;

      neighbors = [null, null, null, null, null, null, null, null];
    }
  } else {
    const gridLength = grid.tiles.length;
    for (let i=0; i<gridLength; i++) {
      const k = i - i.mod(grid.width);

      // get all neighbor tiles references
      neighbors[7] = (i+1).mod(grid.width) + k;
      neighbors[3] = (i-1).mod(grid.width) + k;
      neighbors[1] = (i-grid.width).mod(gridLength);
      neighbors[5] = (i+grid.width).mod(gridLength);
      neighbors[0] = (neighbors[1] + 1).mod(grid.width) + neighbors[1] - neighbors[1].mod(grid.width);
      neighbors[2] = (neighbors[1] - 1).mod(grid.width) + neighbors[1] - neighbors[1].mod(grid.width);
      neighbors[6] = (neighbors[5] + 1).mod(grid.width) + neighbors[5] - neighbors[5].mod(grid.width);
      neighbors[4] = (neighbors[5] - 1).mod(grid.width) + neighbors[5] - neighbors[5].mod(grid.width);

      // filter out null or non-existant elements
      let totalNeighbors = 0;
      for (let j=0; j<8; j++) {
        if (grid.tiles[neighbors[j]]) totalNeighbors++;
      }

      // Conway's Game of Life rules
      if (grid.tiles[i] > 0) {
        if (totalNeighbors < 2 || totalNeighbors > 3) modifiedTiles[i] = 0;
      } else if (totalNeighbors === 3) modifiedTiles[i] = 1;

      neighbors = [null, null, null, null, null, null, null, null];
    }
  }

  grid.tiles = modifiedTiles;
}