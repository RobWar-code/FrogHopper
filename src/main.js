import {HEIGHT,HOP_MS,SPLASH_MS,NEXT_MS,MAX_ATTEMPTS} from './config.js';
import {FISH_DISPLAY_MS,isFishIntercepted} from './fish.js';
import {loadImages,sprite,frogSprite,reedBedSegment,imageDimensions} from './assets.js';
import {generatePads,nearestPad,MAX_HOP} from './layout.js';
import {timeBonus,readScores,saveScore} from './scoring.js';
import {status,showOverlay,hideOverlay,isOverlayOpen,scoresTable} from './ui.js';
const width=window.matchMedia('(max-width: 600px)').matches?360:500;
const stage=new Konva.Stage({container:'stage',width,height:HEIGHT});
const bg=new Konva.Layer(),scene=new Konva.Layer(),effects=new Konva.Layer(),control=new Konva.Layer();
stage.add(bg,scene,effects,control);
bg.add(new Konva.Rect({x:0,y:0,width,height:HEIGHT,fill:'#7d9ca9',listening:false}));
bg.add(new Konva.Rect({x:0,y:0,width,height:60,fill:'#72c8dc',listening:false}));
let pads=[],frog=null,score=0,completed=0,attempt=1,runStart=0,busy=false,ended=false,token=0,paused=false,pauseStart=0;
let entrance={x:width/2,y:45};
const CONTROL_RADIUS=75;
const ctl={x:width-80,y:HEIGHT-45};
async function sleep(ms){let remaining=ms;while(remaining>0){if(paused){await new Promise(r=>setTimeout(r,25));continue;}const slice=Math.min(remaining,25);await new Promise(r=>setTimeout(r,slice));if(!paused)remaining-=slice;}}
const alive=t=>t===token;
const setMessage=m=>status(score,attempt,m);
function addImageOrFallback(layer,name,x,y,w,h,draw,opts={}){const im=sprite(name,x,y,w,h,opts);if(im)layer.add(im);else draw();}
function render(){
 scene.destroyChildren();effects.destroyChildren();
 const reedHeight=80, entranceWidth=80;
 const leftEdge=Math.max(0,entrance.x-entranceWidth/2),rightEdge=Math.min(width,entrance.x+entranceWidth/2);
 const dims=imageDimensions('reedBed');
 if(dims){
  const pxPerStagePixel=dims.height/reedHeight;
  const leftCrop=Math.min(dims.width,leftEdge*pxPerStagePixel);
  const rightCrop=Math.min(dims.width,(width-rightEdge)*pxPerStagePixel);
  const left=reedBedSegment(0,0,leftEdge,reedHeight,Math.max(0,dims.width/2-leftCrop),leftCrop);
  const right=reedBedSegment(rightEdge,0,width-rightEdge,reedHeight,Math.min(dims.width-rightCrop,dims.width/2),rightCrop);
  if(left)scene.add(left);if(right)scene.add(right);
 }
 addImageOrFallback(scene,'entrance',entrance.x,entrance.y,80,70,()=>{
  scene.add(new Konva.Arc({x:entrance.x,y:entrance.y,innerRadius:26,outerRadius:36,angle:180,rotation:180,fill:'#286c40',stroke:'#154c30',strokeWidth:3,listening:false}));
  scene.add(new Konva.Text({x:entrance.x-35,y:entrance.y-10,width:70,text:'EXIT',align:'center',fontSize:16,fill:'#f5ffb8',listening:false}));
 });
 for(const p of pads.flat()){
  const pad=sprite('lilyPad',0,0,60,60);
  if(pad){const group=new Konva.Group({x:p.x,y:p.y,rotation:p.rotation,listening:false});group.add(pad);scene.add(group);}
  else scene.add(new Konva.Circle({x:p.x,y:p.y,radius:30,fill:'#6fb75d',stroke:'#326d42',strokeWidth:3,listening:false}));
 }
 drawFrog(false,frog?.angle ?? 0);
 scene.batchDraw();
}
function drawFrog(leaping,angle){if(!frog)return;const old=scene.find('.frog');old.forEach(n=>n.destroy());const f=frogSprite(angle,leaping);const w=leaping?40+20*Math.min(90,Math.abs(angle))/90:40;
 const im=sprite(f.name,0,0,w,40);const group=new Konva.Group({x:frog.x,y:frog.y,name:'frog',listening:false});
 if(im){if(f.flip){im.scaleX(-1);im.x(w/2);}group.add(im)}
 else {group.add(new Konva.Ellipse({x:0,y:0,radiusX:leaping?22:18,radiusY:leaping?12:17,fill:'#49a642',stroke:'#175c31',strokeWidth:2}));group.add(new Konva.Circle({x:-8,y:-8,radius:4,fill:'white'}));group.add(new Konva.Circle({x:8,y:-8,radius:4,fill:'white'}));}
 scene.add(group);scene.batchDraw();return group;
}
function splash(x,y){effects.destroyChildren();addImageOrFallback(effects,'splash',x,y,40,40,()=>effects.add(new Konva.Star({x,y,numPoints:9,innerRadius:8,outerRadius:23,fill:'#d6f8ff',stroke:'#efffff',strokeWidth:2,listening:false})));effects.batchDraw();}
function fish(x, y, fromRight) {
  effects.destroyChildren();
  // The source image is right-facing. Flip about its centre, not its edge.
  const image = sprite('leapingFish', 0, 0, 110, 74);
  const group = new Konva.Group({x, y, scaleX: fromRight ? -1 : 1, listening: false});
  if (image) {
    group.add(image);
  } else {
    group.add(new Konva.Ellipse({
      x: 0, y: 0, radiusX: 48, radiusY: 24,
      fill: '#e8a553', stroke: '#9a552c', strokeWidth: 2,
      listening: false
    }));
  }
  effects.add(group);
  effects.draw();
}
function drawControl(){
 // Wedge covers angles -120° to +120° from upward vertical.
 const shape=new Konva.Shape({sceneFunc(ctx,shape){
  const grad=ctx.createRadialGradient(ctl.x,ctl.y,2,ctl.x,ctl.y,CONTROL_RADIUS);
  grad.addColorStop(0,'#777');grad.addColorStop(1,'#fff');
  ctx.beginPath();
  ctx.moveTo(ctl.x,ctl.y);
  ctx.arc(ctl.x,ctl.y,CONTROL_RADIUS,-Math.PI/2-2*Math.PI/3,-Math.PI/2+2*Math.PI/3,false);
  ctx.closePath();
  ctx.fillStyle=grad;ctx.fill();
  ctx.strokeStyle='#526772';
  ctx.lineWidth=2;
  ctx.stroke();},listening:false});
 control.add(shape);
 control.add(new Konva.Text({x:ctl.x-34,y:ctl.y-8,width:68,text:'HOP',fontSize:13,
  fontStyle:'bold',align:'center',fill:'#163e46',listening:false}));
 control.batchDraw();
}

function reset(){
  token++;
  paused=false;
  busy=false;
  ended=false;
  score=0;
  completed=0;
  attempt=1;
  startAttempt();
}

function startAttempt(){
  entrance={x:Math.max(60,Math.min(width-140,60+Math.random()*(width-200))),y:45};
  pads=generatePads(width,entrance);
  const starts=pads[0];
  const start=starts[Math.floor(Math.random()*starts.length)];
  frog={x:start.x,y:start.y,row:0,angle:0};
  runStart=performance.now();
  busy=false;
  render();
  setMessage('Choose a direction and distance on the hop control.');
}

async function lose(reason,t){
  if(!alive(t))return;
  setMessage(reason);
  await sleep(SPLASH_MS);
  if(!alive(t))return;
  effects.destroyChildren();
  scene.find('.frog').forEach(n=>n.destroy());
  scene.batchDraw();
  await sleep(NEXT_MS);
  if(alive(t))advance();
}

function advance(){
  if(attempt>=MAX_ATTEMPTS){finish();return;}
  attempt++;
  startAttempt();
}

function finish(){
  ended=true;
  busy=true;
  saveScore(score,completed);
  status(score,12,'Game ended.');
  showOverlay('Game ended',`<p><strong>Total score:</strong> 
    ${score}</p><p><strong>Completed runs:</strong> ${completed}</p>`,
    'Restart',reset);
}

async function hop(angle,distance){
 if(busy||ended||isOverlayOpen())return;
 const radians=angle*Math.PI/180,dx=Math.sin(radians)*distance,dy=-Math.cos(radians)*distance;
 if(dy>0.001 && Math.abs(angle)<=90){
  setMessage('Backward hops are not permitted.');return;
}
 const dest={x:frog.x+dx,y:frog.y+dy};
 // Sideways jumps (including >90 degrees) are legal in the current row.
 // The entrance is a special target above the top row.
 const entranceHit=Math.abs(dest.x-entrance.x)<=30 && dest.y>=0 && dest.y<=30;
 const pad=nearestPad(pads,dest.x,dest.y,frog.row);
 const currentY=pads[frog.row][0].y;
 const nextY=frog.row<4?pads[frog.row+1][0].y:entrance.y;
 const margin=40;
 if(dest.x<0||dest.x>width||dest.y<0||dest.y>HEIGHT){
  setMessage('Hop rejected: outside the stage.');return;
 }
 if(entranceHit){
  if(frog.row!==4){setMessage('Reach the top row before entering the reeds.');return;}
 }else if(dest.y<nextY-margin){setMessage('Hop rejected: cannot skip a row.');return;}
 else if(dest.y>currentY+margin){setMessage('Backward hops are not permitted.');return;}
 if(pad&&pad.row<frog.row){setMessage('Backward hops are not permitted.');return;}
 busy=true;
 const t=token;
 const origin={x:frog.x,y:frog.y};
 const mid={x:(origin.x+dest.x)/2,y:(origin.y+dest.y)/2};
 frog.angle=angle;
 const group=drawFrog(true,angle);group.position(mid);scene.batchDraw();
 await sleep(HOP_MS/2);if(!alive(t))return;
 // Roll once for each eligible upward hop, including entrance hops.
 const intercepted = isFishIntercepted(dx, dy);
 if (intercepted) {
  fish(mid.x, mid.y, Math.random() < 0.5);
  setMessage('Watch out! A leaping fish!');
  await sleep(FISH_DISPLAY_MS);
  if (!alive(t)) return;
  splash(mid.x, mid.y);
  await lose('A fish intercepted the frog!', t);
  return;
 }
 await sleep(HOP_MS/2);if(!alive(t))return;
 frog.x=dest.x;frog.y=dest.y;
 if(entranceHit){
  completed++;
  const seconds=(performance.now()-runStart)/1000;
  const bonus=timeBonus(seconds);
  score+=20+bonus;
  render();
  setMessage(`Entrance reached! +20 points, +${bonus} time bonus.`);
  await sleep(NEXT_MS);
  if(alive(t))advance();return;
 }
 if(pad){
  frog.x=pad.x;
  frog.y=pad.y;
  frog.row=pad.row;
  frog.angle=angle;
  score+=5;
  render();
  setMessage('Successful hop! +5 points.');
  busy=false;
  return;
}
 splash(mid.x,mid.y);await lose('The frog landed in the water.',t);
}

function pointerHop(){
  if(busy||ended||isOverlayOpen())return;
  const p=stage.getPointerPosition();
  if(!p)return;
  const dx=p.x-ctl.x,dy=p.y-ctl.y,r=Math.hypot(dx,dy);
  if(r>CONTROL_RADIUS)return;
  const angle=Math.atan2(dx,-dy)*180/Math.PI;
  if(Math.abs(angle)>120)return;
  hop(angle,20+120*Math.min(1,r/CONTROL_RADIUS));
}

stage.on('pointerdown',pointerHop);
document.getElementById('restartBtn').onclick=()=>{hideOverlay();reset()};
document.getElementById('chartsBtn').onclick=()=>{
  if(ended||paused)return;
  paused=true;
  pauseStart=performance.now();
  showOverlay('Session high scores',scoresTable(readScores()),'Dismiss',
    ()=>{runStart+=performance.now()-pauseStart;paused=false;});
};
document.getElementById('homeBtn').onclick=()=>{window.location.href='../index.html'};
drawControl();
// Load all sprite images before allowing play: otherwise early encounters can
// only show fallback shapes, making the fish appear to be missing.
const playButton = document.getElementById('overlayButton');
playButton.disabled = true;
loadImages().then(() => {
  playButton.disabled = false;
  if (!ended) render();
});
showOverlay('Welcome to Frog Hopper',
  '<p>Guide the frog from lily pad to lily pad to the reed entrance. Press the circular hop control: direction sets the angle and distance from the centre sets hop length.</p><p>You have twelve frogs. Earn 5 points per successful hop, 20 for reaching the entrance, plus a time bonus. Watch out for leaping fish!</p>','Play',reset);
playButton.disabled = true;
