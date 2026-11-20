import {IMAGE_DIR} from './config.js';
const names=['lilyPad','entrance','reedBed','leapingFish','splash',...Array.from({length:6},(_,i)=>`frog${String(i+1).padStart(2,'0')}`),...Array.from({length:6},(_,i)=>`frogLeaping${String(i+1).padStart(2,'0')}`)];
const images=new Map();
export function loadImages(){return Promise.all(names.map(name=>new Promise(resolve=>{const img=new Image();img.onload=()=>{images.set(name,img);resolve()};img.onerror=resolve;img.src=IMAGE_DIR+name+'.png'})));}
export function sprite(name,x,y,width,height,opts={}){const img=images.get(name);if(!img)return null;return new Konva.Image({image:img,x:x-width/2,y:y-height/2,width,height,listening:false,...opts});}
export function frogSprite(angle,leaping=false){const index=Math.min(5,Math.round(Math.abs(angle)/22.5))+1;return {name:`frog${leaping?'Leaping':''}${String(index).padStart(2,'0')}`,flip:angle<0};}

export function reedBedSegment(x,y,width,height,cropX,cropWidth){
 const img=images.get('reedBed');if(!img||width<=0)return null;
 return new Konva.Image({image:img,x,y,width,height,crop:{x:cropX,y:0,width:cropWidth,height:img.naturalHeight},listening:false});
}
export function imageDimensions(name){const img=images.get(name);return img?{width:img.naturalWidth,height:img.naturalHeight}:null;}
