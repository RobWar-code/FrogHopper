import {HEIGHT,PAD_RADIUS} from './config.js';
export const MAX_HOP=140;
const rand=(a,b)=>a+Math.random()*(b-a);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function generatePads(width,entrance){
 const rows=[],maxCount=width===360?3:5;
 for(let row=0;row<5;row++){
  const yBase=HEIGHT-90+PAD_RADIUS-row*80;
  const count=1+Math.floor(Math.random()*maxCount);
  const pads=[];
  const anchors=row?rows[row-1]:[];
  // One neighbouring pair per row is reachable, without guaranteeing a full route.
  if(row){
   const anchor=anchors[Math.floor(Math.random()*anchors.length)];
   const y=yBase+rand(-10,10);
   const dx=Math.sqrt(Math.max(0,MAX_HOP**2-(y-anchor.y)**2));
   const x=Math.max(35,Math.min(width-35,anchor.x+rand(-dx,dx)));
   pads.push({x,y,row,rotation:rand(0,360)});
  }
  let tries=0;
  while(pads.length<count&&tries++<500){
   const y=yBase+rand(-10,10);
   const anchor=row?anchors[Math.floor(Math.random()*anchors.length)]:null;
   const reach=anchor?Math.sqrt(Math.max(0,MAX_HOP**2-(y-anchor.y)**2)):0;
   const x=anchor?Math.max(35,Math.min(width-35,anchor.x+rand(-reach,reach))):rand(35,width-165);
   if(pads.some(p=>Math.hypot(p.x-x,p.y-y)<61))continue;
   pads.push({x,y,row,rotation:rand(0,360)});
  }
  rows.push(pads);
 }
 // Ensure at least one pad in the top row is reachable from the entrance.
 const top=rows[4];
 if(!top.some(p=>distance(p,entrance)<=MAX_HOP)){
  const y=top[0].y;
  const dx=Math.sqrt(Math.max(0,MAX_HOP**2-(y-entrance.y)**2));
  const x=Math.max(35,Math.min(width-35,entrance.x+rand(-dx,dx)));
  const target={x,y,row:4,rotation:rand(0,360)};
  // Keep the connection to row 3 by selecting a feasible point when possible.
  const candidates=rows[3].map(p=>({p,limit:Math.sqrt(Math.max(0,MAX_HOP**2-(y-p.y)**2))}));
  const possible=candidates.filter(({p,limit})=>Math.max(35,entrance.x-dx,p.x-limit)<=Math.min(width-35,entrance.x+dx,p.x+limit));
  if(possible.length){const {p,limit}=possible[0];target.x=rand(Math.max(35,entrance.x-dx,p.x-limit),Math.min(width-35,entrance.x+dx,p.x+limit));}
  // Replace top-row pads that overlap the new connected pad.
  for(let j=top.length-1;j>=0;j--)if(distance(top[j],target)<61)top.splice(j,1);
  top.push(target);
 }
 return rows;
}
export function nearestPad(rows,x,y,fromRow){return rows.flat().filter(p=>p.row===fromRow||p.row===fromRow+1).filter(p=>Math.hypot(p.x-x,p.y-y)<=PAD_RADIUS).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]||null;}
