'use strict';function stepLife(grid){let neighbors=[null,null,null,null,null,null,null,null];let modifiedTiles=[...grid.tiles];if(!grid.simple){for(let i=0;i<grid.tiles.length;i++){const k=i.mod(grid.width);if((k+1).mod(grid.width)>k)neighbors[7]=i+1;if((k-1).mod(grid.width)<k)neighbors[3]=i-1;if((i-grid.width)>=0)neighbors[1]=i-grid.width;if((i+grid.width)<grid.tiles.length)neighbors[5]=i+grid.width;if(neighbors[1]!==null){if(neighbors[7]!==null)neighbors[0]=neighbors[1]+1;if(neighbors[3]!==null)neighbors[2]=neighbors[1]-1;}
if(neighbors[5]!==null){if(neighbors[7]!==null)neighbors[6]=neighbors[5]+1;if(neighbors[3]!==null)neighbors[4]=neighbors[5]-1;}
let totalNeighbors=0;for(let j=0;j<8;j++){if(grid.tiles[neighbors[j]])totalNeighbors++;}
if(grid.tiles[i]>0){if(totalNeighbors<2||totalNeighbors>3)modifiedTiles[i]=0;}else if(totalNeighbors===3)modifiedTiles[i]=1;neighbors=[null,null,null,null,null,null,null,null];}}else{const gridLength=grid.tiles.length;for(let i=0;i<gridLength;i++){const k=i-i.mod(grid.width);neighbors[7]=(i+1).mod(grid.width)+k;neighbors[3]=(i-1).mod(grid.width)+k;neighbors[1]=(i-grid.width).mod(gridLength);neighbors[5]=(i+grid.width).mod(gridLength);neighbors[0]=(neighbors[1]+1).mod(grid.width)+neighbors[1]-neighbors[1].mod(grid.width);neighbors[2]=(neighbors[1]-1).mod(grid.width)+neighbors[1]-neighbors[1].mod(grid.width);neighbors[6]=(neighbors[5]+1).mod(grid.width)+neighbors[5]-neighbors[5].mod(grid.width);neighbors[4]=(neighbors[5]-1).mod(grid.width)+neighbors[5]-neighbors[5].mod(grid.width);let totalNeighbors=0;for(let j=0;j<8;j++){if(grid.tiles[neighbors[j]])totalNeighbors++;}
if(grid.tiles[i]>0){if(totalNeighbors<2||totalNeighbors>3)modifiedTiles[i]=0;}else if(totalNeighbors===3)modifiedTiles[i]=1;neighbors=[null,null,null,null,null,null,null,null];}}
grid.tiles=modifiedTiles;}
const GRID_LINE_WIDTH=6,MIN_WIDTH=2,MAX_WIDTH=256,SHOW_LABEL_DIST=6;const TILE_SIZE=32;let canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d'),cameraTrans={scale:1,offsetX:0,offsetY:0};canvas.width=window.innerWidth;canvas.height=window.innerHeight;class Grid{constructor(width,height){this.pointerPos=null;this.simple=false;this.mode=null;this.lastMode=null;this.drawTiles=()=>{};this.units=[];this.target=null;this.openTiles=[];this.closedTiles=[];this.pathTile=null;this.unitTurn=0;this.stepIndex=null;this.setSize(width,height===0?width:height);}
cartesianToIndex(i,j){return this.simple?i.mod(this.width)+j.mod(this.height)*this.width:i+j*this.width;}
draw(){let tileScaled=cameraTrans.scale*TILE_SIZE;let beginX=Math.floor(-cameraTrans.offsetX/tileScaled);let beginY=Math.floor(-cameraTrans.offsetY/tileScaled);let endX,endY,viewWidth,viewHeight;if(this.simple&&this.mode!=='pathfinding'){viewWidth=Math.ceil(canvas.width/tileScaled)+1;viewHeight=Math.ceil(canvas.height/tileScaled)+1;endX=beginX+viewWidth;endY=beginY+viewHeight;}else{beginX=Math.max(beginX,0);beginY=Math.max(beginY,0);endX=Math.min(Math.ceil((canvas.width-cameraTrans.offsetX)/tileScaled),this.width);endY=Math.min(Math.ceil((canvas.height-cameraTrans.offsetY)/tileScaled),this.height);}
if(this.simple){ctx.lineWidth=3;if(this.mode==='pathfinding'){ctx.fillStyle="#444";ctx.fillRect(0,0,this.width*TILE_SIZE,this.height*TILE_SIZE);for(let i=beginX;i<endX;i++){for(let j=beginY;j<endY;j++){let tile=this.tiles[this.cartesianToIndex(i,j)];if(!tile)continue;switch(tile){case 1:ctx.fillStyle='#000';break;case 2:ctx.fillStyle='#f33';break;case 3:ctx.fillStyle='#3f3';break;case-1:ctx.fillStyle='#666';break;case-2:ctx.fillStyle='#777';break;case-3:ctx.fillStyle='#999';break;}
ctx.fillRect(i*TILE_SIZE+2,j*TILE_SIZE+2,TILE_SIZE-4,TILE_SIZE-4);}}
if(this.pointerPos){ctx.fillStyle='#000';this.labelSearch(this.openTiles,true);this.labelSearch(this.closedTiles,true);}
return;}
ctx.fillStyle="#222";ctx.fillRect(0,0,this.width*TILE_SIZE,this.height*TILE_SIZE);ctx.fillStyle="#fff";ctx.lineWidth=3;for(let i=beginX;i<endX;i++){for(let j=beginY;j<endY;j++){if(!this.tiles[this.cartesianToIndex(i,j)])continue;ctx.fillRect(i*TILE_SIZE+2,j*TILE_SIZE+2,TILE_SIZE-4,TILE_SIZE-4);}}
return;}
ctx.fillStyle="#fcc";ctx.fillRect(0,0,this.width*TILE_SIZE,this.height*TILE_SIZE);ctx.strokeStyle="#a99";ctx.lineWidth=GRID_LINE_WIDTH;for(let i=beginX;i<=endX;i++){ctx.beginPath();ctx.moveTo(i*TILE_SIZE,beginY*TILE_SIZE);ctx.lineTo(i*TILE_SIZE,endY*TILE_SIZE);ctx.stroke();}
for(let i=beginY;i<=endY;i++){ctx.beginPath();ctx.moveTo(beginX*TILE_SIZE,i*TILE_SIZE);ctx.lineTo(endX*TILE_SIZE,i*TILE_SIZE);ctx.stroke();}
this.drawTiles(beginX,endX,beginY,endY);}
setSize(width,height){width=Math.min(Math.max(width,MIN_WIDTH),MAX_WIDTH);height=Math.min(Math.max(height,MIN_WIDTH),MAX_WIDTH);this.width=width;this.height=height;this.tiles=new Array(width*height).fill(0);this.clearPathfinding();}
setMode(mode){this.lastMode=this.mode;this.mode=mode;switch(mode){case'life':this.drawTiles=(beginX,endX,beginY,endY)=>this.drawLife(beginX,endX,beginY,endY);break;case'pathfinding':this.drawTiles=(beginX,endX,beginY,endY)=>this.drawPathfinding(beginX,endX,beginY,endY);if(this.target)this.tiles[this.target]=2;this.units.forEach(unit=>this.tiles[unit.x+unit.y*this.width]=3);break;}
this.clearPathfinding();}
drawLife(beginX,endX,beginY,endY){ctx.fillStyle="#020";ctx.strokeStyle="#030";ctx.lineWidth=9;for(let i=beginX;i<endX;i++){for(let j=beginY;j<endY;j++){let k=this.cartesianToIndex(i,j);if(this.tiles[k]<1)continue;ctx.fillRect(i*TILE_SIZE,j*TILE_SIZE,TILE_SIZE,TILE_SIZE);ctx.strokeRect(i*TILE_SIZE+ctx.lineWidth/2,j*TILE_SIZE+ctx.lineWidth/2,TILE_SIZE-ctx.lineWidth,TILE_SIZE-ctx.lineWidth);}}}
labelSearch(searched,usePointer){ctx.textAlign="center";searched.forEach(tile=>{if(tile.reference===null)return;if(usePointer&&Math.pow(tile.x-this.pointerPos.x,2)+Math.pow(tile.y-this.pointerPos.y,2)>SHOW_LABEL_DIST)return;const g=Math.round(tile.g*10);const h=Math.round(tile.h*10);const x=tile.x;const y=tile.y;ctx.font="8px Nunito";ctx.fillText(g,(x+0.5)*TILE_SIZE,(y+1)*TILE_SIZE-24);ctx.fillText(h,(x+0.5)*TILE_SIZE,(y+1)*TILE_SIZE-16);ctx.font=Math.max(19-3*(g+h).toFixed().length,8)+"px Nunito";ctx.fillText((g+h),(x+0.5)*TILE_SIZE,(y+1)*TILE_SIZE-6);});}
drawPathfinding(beginX,endX,beginY,endY){for(let i=beginX;i<endX;i++){for(let j=beginY;j<endY;j++){let k=this.cartesianToIndex(i,j);if(!this.tiles[k])continue;const TILE_COLORS=[['#ff0','#dd0',3],['#f66','#f33',3],['#f99','#f66',3],null,['#020','#030',9],['#f44','#d44',3],['#4f4','#4d4',3]];ctx.fillStyle=TILE_COLORS[this.tiles[k]+3][0];ctx.strokeStyle=TILE_COLORS[this.tiles[k]+3][1];ctx.lineWidth=TILE_COLORS[this.tiles[k]+3][2];ctx.fillRect(i*TILE_SIZE,j*TILE_SIZE,TILE_SIZE,TILE_SIZE);ctx.strokeRect(i*TILE_SIZE+ctx.lineWidth/2,j*TILE_SIZE+ctx.lineWidth/2,TILE_SIZE-ctx.lineWidth,TILE_SIZE-ctx.lineWidth);}}
ctx.fillStyle="#222";this.labelSearch(this.openTiles);this.labelSearch(this.closedTiles);ctx.font="16px Nunito";ctx.textAlign="center";ctx.textBaseline="middle";if(this.target!==null)ctx.fillText("X",(this.target%this.width+0.47)*TILE_SIZE+1,(Math.floor(this.target/this.width)+0.56)*TILE_SIZE);this.units.forEach((unit,i)=>ctx.fillText(i+1,(unit.x+0.47)*TILE_SIZE+1,(unit.y+0.5)*TILE_SIZE));}
clearPathfinding(){this.tiles=this.tiles.map(tile=>Math.max(tile,0));this.closedTiles=[];this.openTiles=[];this.unitTurn%=Math.max(this.units.length,1);this.stepIndex=null;this.pathTile=null;}}
let grid=new Grid((window.innerWidth<window.innerHeight)?Math.floor(window.innerWidth/TILE_SIZE):Math.floor(window.innerHeight/TILE_SIZE),0,cameraTrans,canvas);const SQRT_2=Math.sqrt(2);function stepPathfinding(grid,pause){if(!grid.pathTile){let targetX=grid.target%grid.width,targetY=Math.floor(grid.target/grid.width);if(grid.openTiles.length)calculateAdjacentNodes(grid,grid.openTiles[0].x,grid.openTiles[0].y,targetX,targetY,grid.openTiles[0].g);else calculateAdjacentNodes(grid,grid.units[grid.unitTurn].x,grid.units[grid.unitTurn].y,targetX,targetY,0);if(grid.openTiles.length)return;console.log("No path possible");let optimalIndex=null;if(!grid.closedTiles.length){grid.unitTurn++;grid.clearPathfinding();pause();return;}
grid.closedTiles.forEach((tile,i)=>{let unitTile=grid.units[grid.unitTurn];if(Math.abs(tile.x-unitTile.x)>1||Math.abs(tile.y-unitTile.y)>1)return;if(optimalIndex===null||tile.g+tile.h<grid.closedTiles[optimalIndex].g+grid.closedTiles[optimalIndex].h)optimalIndex=i;});if(optimalIndex!==null){let optimalTile=grid.closedTiles[optimalIndex];grid.tiles[optimalTile.reference]=-3;grid.pathTile={x:optimalTile.x,y:optimalTile.y};grid.stepIndex=optimalIndex;pause();}}else{if(grid.stepIndex!==null){grid.tiles[grid.units[grid.unitTurn].x+grid.units[grid.unitTurn].y*grid.width]=0;grid.units[grid.unitTurn].x=grid.closedTiles[grid.stepIndex].x;grid.units[grid.unitTurn].y=grid.closedTiles[grid.stepIndex].y;grid.tiles[grid.units[grid.unitTurn].x+grid.units[grid.unitTurn].y*grid.width]=3;grid.unitTurn++;grid.clearPathfinding();}else{let targetX=grid.target%grid.width,targetY=Math.floor(grid.target/grid.width);if(Math.abs(grid.units[grid.unitTurn].x-targetX)<2&&Math.abs(grid.units[grid.unitTurn].y-targetY)<2){grid.tiles[grid.units[grid.unitTurn].x+grid.units[grid.unitTurn].y*grid.width]=0;grid.units.splice(grid.unitTurn,1);grid.clearPathfinding();pause();return;}
let optimalIndex=null;grid.closedTiles.forEach((tile,i)=>{if(Math.abs(grid.pathTile.x-tile.x)>1||Math.abs(grid.pathTile.y-tile.y)>1)return;if(optimalIndex===null||tile.g<grid.closedTiles[optimalIndex].g)optimalIndex=i;});if(optimalIndex!==null){let optimalTile=grid.closedTiles[optimalIndex];grid.tiles[optimalTile.reference]=-3;if(optimalTile.g<1.5){grid.stepIndex=optimalIndex;pause();}else{grid.pathTile.x=optimalTile.x;grid.pathTile.y=optimalTile.y;}}}}}
function calculateAdjacentNodes(grid,x,y,targetX,targetY,addG){let neighborTiles=[null,null,null,null,null,null,null,null];if(x<grid.width-1)neighborTiles[7]=grid.tiles[x+1+y*grid.width];if(x>0)neighborTiles[3]=grid.tiles[x-1+y*grid.width];if(y>0)neighborTiles[1]=grid.tiles[x+(y-1)*grid.width];if(y<grid.height-1)neighborTiles[5]=grid.tiles[x+(y+1)*grid.width];if(neighborTiles[1]!==null){if(neighborTiles[7]!==null )neighborTiles[0]=grid.tiles[x+1+(y-1)*grid.width];if(neighborTiles[3]!==null )neighborTiles[2]=grid.tiles[x-1+(y-1)*grid.width];}
if(neighborTiles[5]!==null){if(neighborTiles[7]!==null )neighborTiles[6]=grid.tiles[x+1+(y+1)*grid.width];if(neighborTiles[3]!==null )neighborTiles[4]=grid.tiles[x-1+(y+1)*grid.width];}
if(grid.openTiles.length>0){grid.tiles[grid.openTiles[0].x+grid.openTiles[0].y*grid.width]=-2;grid.closedTiles.push(grid.openTiles.shift());}
for(let j=0;j<8;j++){let xPos=x;let yPos=y;if(j<3)yPos--;else if(j!==3&&j!==7)yPos++;if(j>1&&j<5)xPos--;else if(j!=1&&j!=5)xPos++;const distX=Math.abs(targetX-xPos);const distY=Math.abs(targetY-yPos);const g=((xPos!=x&&yPos!=y)?SQRT_2+addG:1+addG);const h=Math.sqrt(distX*distX+distY*distY);if(neighborTiles[j]===0){const reference=xPos+yPos*grid.width;grid.tiles[reference]=-1;if(grid.openTiles.length>0){grid.openTiles.push({reference:reference,g:g,h:h,x:xPos,y:yPos});grid.openTiles.sort((a,b)=>{const dif=a.g+a.h-b.g-b.h;if(!dif)return a.g+a.h;return dif;});}else grid.openTiles.push({reference:reference,g:g,h:h,x:xPos,y:yPos});}else if(neighborTiles[j]===-1){for(let k=0;k<grid.openTiles.length;k++){if(grid.openTiles[k].x===xPos&&grid.openTiles[k].y===yPos&&g<grid.openTiles[k].g){grid.openTiles[k].g=g;grid.openTiles.sort((a,b)=>{return a.g+a.h-b.g-b.h;});break;}}}}
if(Math.abs(targetX-x)<2&&Math.abs(targetY-y)<2)grid.pathTile={x:targetX,y:targetY};}
function scaleCanvas(canvas,context,width,height){const devicePixelRatio=window.devicePixelRatio||1;const backingStoreRatio=(context.webkitBackingStorePixelRatio||context.mozBackingStorePixelRatio||context.msBackingStorePixelRatio||context.oBackingStorePixelRatio||context.backingStorePixelRatio||1);const ratio=devicePixelRatio/backingStoreRatio;if(devicePixelRatio!==backingStoreRatio){canvas.width=width*ratio;canvas.height=height*ratio;canvas.style.width=width+'px';canvas.style.height=height+'px';}
else{canvas.width=width;canvas.height=height;canvas.style.width='';canvas.style.height='';}
context.scale(ratio,ratio);}
Number.prototype.mod=function(n){return((this%n)+n)%n;};function fitCanvas(canvas,ctx){canvas.width=window.innerWidth;canvas.height=window.innerHeight;canvas.style.width=window.innerWidth+"px";canvas.style.height=window.innerHeight+"px";scaleCanvas(canvas,ctx,canvas.width,canvas.height);if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))){document.querySelector("link[name='css']").href="mobileStyle.css";return true;}
document.querySelector("link[name='css']").href="style.css";return false;}
window.addEventListener('resize',()=>{cameraTrans.offsetX-=(canvas.width-window.innerWidth)/2;cameraTrans.offsetY-=(canvas.height-window.innerHeight)/2;isMobile=fitCanvas(canvas,ctx);requestAnimationFrame(draw);},false);function draw(){const gridPixelWidth=TILE_SIZE*cameraTrans.scale;const gridPixelHeight=TILE_SIZE*cameraTrans.scale;cameraTrans.offsetX=Math.min(Math.max(cameraTrans.offsetX,gridPixelWidth*(1-grid.width)),(canvas.width-gridPixelWidth));cameraTrans.offsetY=Math.min(Math.max(cameraTrans.offsetY,gridPixelHeight*(1-grid.height)),(canvas.height-gridPixelHeight));ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height)
ctx.translate(cameraTrans.offsetX,cameraTrans.offsetY);ctx.scale(cameraTrans.scale,cameraTrans.scale);grid.draw();}
let isMobile=fitCanvas(canvas,ctx);let pointerPos={x:0,y:0};let deltaPointer={x:0,y:0};let pointerActions={primary:false,scroll:false};let pointerSpread=0;let tileMode=1;let viewOnly=false;let eraser=true;let erasing=false;const UNDO_STEPS=80;let steps=[];let futureSteps=[];let playSpeed=2,frameInterval;const ZOOM_AMOUNT=0.1;const ZOOM_MIN=0.2*Math.max(window.innerWidth,window.innerHeight)/1200;const ZOOM_MAX=8*Math.max(window.innerWidth,window.innerHeight)/1200;cameraTrans.offsetX=canvas.width/2-grid.width*TILE_SIZE/2;cameraTrans.offsetY=canvas.height/2-grid.height*TILE_SIZE/2;requestAnimationFrame(draw);canvas.addEventListener('touchstart',(event)=>{if(event.touches.length>2)return;if(!viewOnly){steps.push(null);futureSteps=[];}
deltaPointer={x:0,y:0};pointerPos={x:event.changedTouches[0].clientX,y:event.changedTouches[0].clientY};if(event.touches.length===2){pointerSpread=0;if(!viewOnly){if(steps[steps.length-3]===null){steps.pop();grid.tiles[steps[steps.length-1].pos]=steps[steps.length-1].revert;steps.pop();steps.pop();}else{steps.pop();condenseArray(steps);}}}
if(event.touches.length===2)pointerActions.scroll=true;else if(!viewOnly){pointerActions.primary=true;styleTiles(tileMode);requestAnimationFrame(draw);}},false);document.addEventListener('touchend',touchEnd,false);document.addEventListener('touchcancel',touchEnd,false);function touchEnd(event){if(event.touches.length>2)return;if(!pointerActions.primary&&!pointerActions.scroll)return;if(!viewOnly&&!pointerActions.scroll)condenseArray(steps);pointerActions.primary=false;pointerActions.scroll=false;erasing=false;}
canvas.addEventListener('touchmove',(event)=>{if(!pointerActions.scroll)deltaPointer={x:event.changedTouches[0].clientX-pointerPos.x,y:event.changedTouches[0].clientY-pointerPos.y};pointerPos={x:event.changedTouches[0].clientX,y:event.changedTouches[0].clientY};if(pointerActions.scroll){const xDist=(event.touches[1].clientX-event.touches[0].clientX);const yDist=(event.touches[1].clientY-event.touches[0].clientY);const spread=Math.sqrt(xDist*xDist+yDist*yDist);if(pointerSpread===0)pointerSpread=spread;const deltaSpread=(pointerSpread-spread)/16;pointerSpread=spread;const pointerCenter={x:(event.changedTouches[1].clientX+pointerPos.x)/2,y:(event.changedTouches[1].clientY+pointerPos.y)/2};if(!deltaPointer.x&&!deltaPointer.y)deltaPointer=pointerCenter;const deltaPointerCenter={x:(pointerCenter.x-deltaPointer.x),y:(pointerCenter.y-deltaPointer.y)};deltaPointer=pointerCenter;zoom(deltaSpread,pointerCenter);cameraTrans.offsetX+=deltaPointerCenter.x;cameraTrans.offsetY+=deltaPointerCenter.y;}else if((erasing||(pointerActions.primary&&(tileMode===0||tileMode===1))&&!viewOnly))styleTiles(tileMode);requestAnimationFrame(draw);},false);let touchStartX=0;let timeTouchStart=0;let rangeStartValue=2;canvas.addEventListener("mousedown",(event)=>{if(event.button===1){pointerActions.scroll=true;if(pointerActions.primary){pointerActions.primary=false;condenseArray(steps);erasing=false;}}
if(event.button>0)return;if(!viewOnly){steps.push(null);futureSteps=[];}
deltaPointer={x:0,y:0};pointerPos={x:event.x,y:event.y};if(!viewOnly){pointerActions.primary=true;styleTiles(tileMode);requestAnimationFrame(draw);}},false);document.addEventListener("mouseup",(event)=>{if(!pointerActions.primary&&!pointerActions.scroll)return;if(!viewOnly&&!pointerActions.scroll)condenseArray(steps);pointerActions.primary=false;pointerActions.scroll=false;erasing=false;},false);document.addEventListener("mousemove",(event)=>{if(event.button===2)return;deltaPointer={x:event.x-pointerPos.x,y:event.y-pointerPos.y};pointerPos={x:event.x,y:event.y};grid.pointerPos={x:Math.floor(((pointerPos.x-cameraTrans.offsetX)/cameraTrans.scale)/TILE_SIZE),y:Math.floor(((pointerPos.y-cameraTrans.offsetY)/cameraTrans.scale)/TILE_SIZE)};if(pointerActions.scroll){cameraTrans.offsetX+=deltaPointer.x;cameraTrans.offsetY+=deltaPointer.y;}else if((erasing||(pointerActions.primary&&(tileMode===0||tileMode===1))&&!viewOnly))styleTiles(tileMode);requestAnimationFrame(draw);},false);canvas.addEventListener("wheel",(event)=>{zoom(Math.sign(event.deltaY),pointerPos);requestAnimationFrame(draw);},false);document.addEventListener("keydown",(event)=>{let key=event.keyCode;if(event.ctrlKey){if(key===90)undo();else if(key===89)redo();return;}
if(key===32)playPause();else if(key===65)stepAlgo(false);else if(key===82)setTileMode(1);else if(key===83)setTileMode(2);else if(key===84)setTileMode(3);});canvas.addEventListener("keyup",(event)=>{});let menuMoving=100;document.getElementById("barmenu").style.bottom="-120px";document.getElementById("framebar").style.bottom="0px";function dipAnimation(dir,newMode){if(dir){if(grid.mode===newMode)return;menuMoving+=(100-menuMoving)*0.05;if(menuMoving>99){if(frameInterval)playPause();dir=false;grid.setMode(newMode);console.log('Mode:',newMode);if(grid.mode==='life'){document.getElementById("toolbar").children[0].checked=true;document.getElementById("toolbar").children[2].checked=true;eraser=true;tileMode=1;viewOnly=false;}
requestAnimationFrame(draw);}}else{menuMoving-=menuMoving*0.05;if(menuMoving<1)menuMoving=0;}
switch(grid.mode){case'life':document.getElementById("barmenu").style.bottom="-120px";document.getElementById("framebar").style.bottom=(134-menuMoving)+"px";break;case'pathfinding':if(menuMoving>20)document.getElementById("barmenu").style.bottom=20-menuMoving+"px";document.getElementById("framebar").style.bottom=(67-menuMoving)+"px";break;}
if(menuMoving)setTimeout(()=>dipAnimation(dir,newMode),1);}
function condenseArray(ar){let step=[];let i=ar.length-1;while(ar[i]!=null){step.push(ar.pop());i--;}
ar.pop();if(step.length>0)ar.push(step);if(ar.length>UNDO_STEPS)ar.shift();}
function styleTiles(style){let gx=Math.floor(((pointerPos.x-cameraTrans.offsetX)/cameraTrans.scale)/TILE_SIZE);let gy=Math.floor(((pointerPos.y-cameraTrans.offsetY)/cameraTrans.scale)/TILE_SIZE);checkTile(gx,gy,style);if(!deltaPointer.x&&!deltaPointer.y)return;let hx=Math.floor(((pointerPos.x-deltaPointer.x-cameraTrans.offsetX)/cameraTrans.scale)/TILE_SIZE);let hy=Math.floor(((pointerPos.y-deltaPointer.y-cameraTrans.offsetY)/cameraTrans.scale)/TILE_SIZE);while((hx!=gx||hy!=gy)){gx-=Math.sign(gx-hx);gy-=Math.sign(gy-hy);checkTile(gx,gy,style);}}
function checkTile(gx,gy,style){if((!grid.simple||grid.mode===2)&&(gx<0||gx>=grid.width||gy<0||gy>=grid.height))return;let mgx=gx.mod(grid.width);let mgy=gy.mod(grid.height);const pos=mgx+mgy*grid.width;if(eraser&&!deltaPointer.x&&!deltaPointer.y&&grid.tiles[pos]===style)erasing=true;if(erasing)style=0;if(grid.tiles[pos]===style||(grid.tiles[pos]<0&&style===0))return;if(grid.tiles[pos]<0||grid.tiles[pos]===2||style===2){grid.clearPathfinding();if(frameInterval)playPause();}
steps.push({pos:pos,revert:grid.tiles[pos]});if(grid.tiles[pos]===2)grid.target=null;else if(grid.tiles[pos]===3){let removeUnit=0;grid.units.forEach((unit,i)=>{if(unit.x+unit.y*grid.height===pos)removeUnit=i;});steps[steps.length-1].unit=removeUnit;grid.units.splice(removeUnit,1);if(grid.unitTurn===removeUnit)grid.clearPathfinding();}
if(style===2){grid.tiles[grid.target]=0;grid.target=pos;}
else if(style===3)grid.units.push({x:mgx,y:mgy});grid.tiles[pos]=style;}
function zoom(amount,referencePoint){const oldScale=cameraTrans.scale;cameraTrans.scale-=ZOOM_AMOUNT*amount*Math.abs(cameraTrans.scale);cameraTrans.scale=Math.min(Math.max(cameraTrans.scale,ZOOM_MIN),ZOOM_MAX);if(Math.abs(cameraTrans.scale-1)<ZOOM_AMOUNT*0.2)cameraTrans.scale=1;cameraTrans.offsetX=(referencePoint.x-(referencePoint.x-cameraTrans.offsetX)*(cameraTrans.scale/oldScale));cameraTrans.offsetY=(referencePoint.y-(referencePoint.y-cameraTrans.offsetY)*(cameraTrans.scale/oldScale));}
function setTileMode(newTileMode){if(newTileMode===-1){eraser=document.getElementById('eraser').checked;viewOnly=!eraser;if(tileMode!==0)viewOnly=false;}else{viewOnly=false;if(tileMode===newTileMode){tileMode=0;viewOnly=!eraser;let tools=document.getElementById("toolbar").children;for(let i=2;i<tools.length;i+=2)tools[i].checked=false;}else tileMode=newTileMode;}}
function undo(){if(steps.length<=0||frameInterval)return;let step=steps.pop();let futureStep=[];if(!step)return;console.log('undo');for(let i=0;i<step.length;i++){futureStep.push({pos:step[i].pos,revert:grid.tiles[step[i].pos]});if(grid.tiles[step[i].pos]===2)grid.target=null;else if(grid.tiles[step[i].pos]===3){const index=grid.units.indexOf(step[i].pos);futureStep[futureStep.length-1].unit=index;grid.units.splice(index,1);}
grid.tiles[step[i].pos]=step[i].revert;if(step[i].revert===2)grid.target=step[i].pos;else if(step[i].revert===3){grid.units.splice(step[i].unit,0,step[i].pos);futureStep[futureStep.length-1].unit=step[i].unit;}}
futureSteps.push(futureStep);requestAnimationFrame(draw);}
function redo(){if(futureSteps.length<=0||frameInterval)return;let futureStep=futureSteps.pop();let step=[];if(!futureStep)return;console.log('redo');for(let i=0;i<futureStep.length;i++){step.push({pos:futureStep[i].pos,revert:grid.tiles[futureStep[i].pos]});if(grid.tiles[futureStep[i].pos]===2)grid.target=null;else if(grid.tiles[futureStep[i].pos]===3){const index=grid.units.indexOf(futureStep[i].pos);step[step.length-1].target=index;grid.units.splice(index,1);}
grid.tiles[futureStep[i].pos]=futureStep[i].revert;if(futureStep[i].revert===2)grid.target=futureStep[i].pos;else if(futureStep[i].revert===3){grid.units.splice(futureStep[i].unit,0,futureStep[i].pos);step[step.length-1].unit=futureStep[i].unit;}}
steps.push(step);requestAnimationFrame(draw);}
function toggleFullscreen(){let doc=window.document;let docEl=doc.documentElement;let requestFullScreen=docEl.requestFullscreen||docEl.mozRequestFullScreen||docEl.webkitRequestFullScreen||docEl.msRequestFullscreen;let cancelFullScreen=doc.exitFullscreen||doc.mozCancelFullScreen||doc.webkitExitFullscreen||doc.msExitFullscreen;if(!doc.fullscreenElement&&!doc.mozFullScreenElement&&!doc.webkitFullscreenElement&&!doc.msFullscreenElement)requestFullScreen.call(docEl);else cancelFullScreen.call(doc);}
function setFrameSpeed(){playSpeed=document.getElementById("frameSpeed").value;if(playSpeed>9)playSpeed=(playSpeed-9)*10;document.getElementById("frameSpeedText").innerHTML="x"+playSpeed;clearInterval(frameInterval);if(frameInterval)frameInterval=setTimeout(stepAlgo,1000/playSpeed);}
function setSimpleViewMode(){grid.simple=!grid.simple;const element=document.getElementById('simpleViewMode');if(grid.simple){canvas.style.backgroundColor="#000";element.style.backgroundColor="#888";element.style.transform="translateY(2px)";element.style.boxShadow="0 4px #666";}else{canvas.style.backgroundColor="#a99";element.style.backgroundColor="#222";element.style.transform="translateY(-4px)";element.style.boxShadow="0 10px #666";}
requestAnimationFrame(draw);}
function stepAlgo(keepPlaying=true){if(!keepPlaying&&frameInterval)playPause();futureSteps=[];let paused=false;let pause=()=>{if(!frameInterval)return;playPause();paused=true;}
grid.mode==='pathfinding'?stepPathfinding(grid,pause):stepLife(grid);requestAnimationFrame(draw);if(keepPlaying&&!paused)frameInterval=setTimeout(stepAlgo,1000/playSpeed);}
function playPause(){if(grid.mode!=='life'&&!frameInterval&&(grid.target===null||grid.units.length===0))return toast('Must place unit and target!');console.log((frameInterval?'Pause':'Play'),grid.mode);const element=document.getElementById('playBtn');if(!frameInterval){futureSteps=[];let step=[];grid.tiles.forEach((tile,i)=>step.push({pos:i,revert:tile}));steps.push(step);stepAlgo(true);element.style.backgroundColor="#888";element.style.transform="translateY(2px)";element.style.boxShadow="0 4px #666";element.innerHTML="II";}else{clearInterval(frameInterval);frameInterval=null;element.style.backgroundColor="#222";element.style.transform="translateY(-4px)";element.style.boxShadow="0 10px #666";element.innerHTML="Play";}}
function logSteps(){let str="(";let i=0;while(steps[i]){str+="#, ";i++;}
if(steps.length>i)str+=(steps.length-1-i)+")";else str=str.substr(0,str.length-2)+")";if(str.length===1)str="()";return str;}
let debug=document.getElementById('debug');let debugBox=document.getElementById('debug-box');let toastTimer;function toast(str){clearInterval(toastTimer);debug.style.display='block';debug.style.opacity=1;debug.style.filter='alpha(opacity=100)';debugBox.innerHTML=str;let op=16;toastTimer=setInterval(()=>{op-=op*0.1;if(op>1)return;if(op<=0.01){clearInterval(toastTimer);debug.style.display='none';}
debug.style.opacity=op;debug.style.filter='alpha(opacity='+op*100+')';},50);}
let menus=Array.from(document.getElementsByClassName('menu'));document.getElementById('start-btn').onclick=()=>{menus[1].style.display='none';menus[0].style.display='block';}
let canvasMask=document.getElementById('canvas-mask');const GRID_MODES=['life','pathfinding'];let optionsMenu=document.getElementById("options-menu");Array.from(document.getElementById('menu-grid').children).forEach((btn,i)=>{btn.onclick=()=>{canvasMask.style.display='none';menus[0].style.display='none';menuMoving=100;dipAnimation(true,GRID_MODES[i]);optionsMenu.style.display='block';}});document.getElementById('simpleViewMode').onclick=()=>setSimpleViewMode();document.getElementById('fullscreen').onclick=()=>toggleFullscreen();document.getElementById('stepBtn').onclick=()=>stepAlgo(false);document.getElementById('playBtn').onclick=()=>playPause();document.getElementById('frameSpeed').oninput=()=>setFrameSpeed();document.getElementById('eraser').onclick=()=>setTileMode(-1);document.getElementById('barrier').onclick=()=>setTileMode(1);document.getElementById('target').onclick=()=>setTileMode(2);document.getElementById('unit').onclick=()=>setTileMode(3);document.getElementById('undo').onclick=()=>undo();document.getElementById('redo').onclick=()=>redo();document.getElementById('settings').onclick=()=>{if(grid.mode===null){canvasMask.style.display='none';menus[0].style.display='none';menuMoving=100;dipAnimation(true,grid.lastMode);return;}
if(menuMoving)return;if(grid.simple)setSimpleViewMode();dipAnimation(true,null);menus[0].style.display='block';canvasMask.style.display='block';grid.clearPathfinding();requestAnimationFrame(draw);}