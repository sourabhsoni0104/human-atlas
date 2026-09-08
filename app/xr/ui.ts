import * as T from 'three';
import type {ImmersiveXRMode} from './types';

export type XRUIAction='all'|'skeleton'|'organs'|'cardiovascular'|'respiratory'|'digestive'|'explode'|'reset'|'mr'|'vr'|'exit'|'isolate'|'clear-selection';
export interface XRUIHit {action:XRUIAction;distance:number}
export interface XRUIState {mode:ImmersiveXRMode;selectedName?:string;selectedSystem?:string;isolated:boolean}
export interface XRSpatialUI {group:T.Group;pick:(ray:T.Ray)=>XRUIHit|null;setHover:(action:XRUIAction|null)=>void;update:(state:XRUIState)=>void;dispose:()=>void}

type Region={action:XRUIAction;label:string;x:number;y:number;width:number;height:number};
const menuRegions:Region[]=[];
const menuItems:[XRUIAction,string][]=[['all','All'],['skeleton','Skeleton'],['organs','Organs'],['cardiovascular','Cardiovascular'],['respiratory','Respiratory'],['digestive','Digestive'],['explode','Explode'],['reset','Reset'],['mr','MR'],['vr','VR']];
menuItems.forEach(([action,label],index)=>menuRegions.push({action,label,x:28+(index%2)*234,y:108+Math.floor(index/2)*72,width:222,height:56}));menuRegions.push({action:'exit',label:'Exit XR',x:28,y:478,width:456,height:58});
const cardRegions:Region[]=[{action:'isolate',label:'Isolate',x:28,y:222,width:272,height:56},{action:'clear-selection',label:'Close',x:312,y:222,width:172,height:56}];

const roundedRect=(context:CanvasRenderingContext2D,x:number,y:number,width:number,height:number,radius:number)=>{context.beginPath();context.roundRect(x,y,width,height,radius);};
const wrap=(context:CanvasRenderingContext2D,text:string,maxWidth:number,maxLines:number)=>{const words=text.split(/\s+/),lines:string[]=[];let line='';for(const word of words){const next=line?`${line} ${word}`:word;if(context.measureText(next).width<=maxWidth)line=next;else{if(line)lines.push(line);line=word;if(lines.length===maxLines-1)break;}}if(line&&lines.length<maxLines)lines.push(line);return lines;};
const makeSurface=(width:number,height:number,worldWidth:number,worldHeight:number)=>{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,side:T.DoubleSide}),mesh=new T.Mesh(new T.PlaneGeometry(worldWidth,worldHeight),material);mesh.renderOrder=100;return {canvas,texture,material,mesh,context:canvas.getContext('2d')!};};

export function createXRSpatialUI(parent:T.Object3D):XRSpatialUI{
 const group=new T.Group();group.name='xr-ui';group.visible=false;parent.add(group);
 const menu=makeSurface(512,576,.72,.81);menu.mesh.position.set(-.72,1.27,-1.32);group.add(menu.mesh);
 const card=makeSurface(512,306,.72,.43);card.mesh.position.set(.72,1.44,-1.34);card.mesh.visible=false;group.add(card.mesh);
 let hovered:XRUIAction|null=null,current:XRUIState={mode:'mr',isolated:false},lastCard='';
 const drawMenu=()=>{const c=menu.context;c.clearRect(0,0,512,576);c.fillStyle='#17232eef';roundedRect(c,0,0,512,576,28);c.fill();c.fillStyle='#8ee7dc';c.font='600 18px system-ui';c.fillText('HUMAN ATLAS XR',28,44);c.fillStyle='#c8d3da';c.font='400 14px system-ui';c.fillText('Systems and view',28,76);for(const region of menuRegions){const active=region.action===hovered||region.action===current.mode;c.fillStyle=active?'#4f817d':region.action==='exit'?'#382e35':'#263744';roundedRect(c,region.x,region.y,region.width,region.height,12);c.fill();c.fillStyle='#f6fafb';c.font='500 17px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(region.label,region.x+region.width/2,region.y+region.height/2);c.textAlign='left';c.textBaseline='alphabetic';}menu.texture.needsUpdate=true;};
 const drawCard=()=>{const key=`${current.selectedName}|${current.selectedSystem}|${current.isolated}|${hovered}`;if(key===lastCard)return;lastCard=key;card.mesh.visible=!!current.selectedName;if(!current.selectedName)return;const c=card.context;c.clearRect(0,0,512,306);c.fillStyle='#17232ef2';roundedRect(c,0,0,512,306,24);c.fill();c.fillStyle='#8ee7dc';c.font='600 14px system-ui';c.fillText((current.selectedSystem??'ANATOMY').toUpperCase(),28,42);c.fillStyle='#fff';c.font='600 30px system-ui';wrap(c,current.selectedName.toUpperCase(),450,3).forEach((line,index)=>c.fillText(line,28,88+index*36));for(const region of cardRegions){c.fillStyle=region.action===hovered?'#4f817d':'#263744';roundedRect(c,region.x,region.y,region.width,region.height,12);c.fill();c.fillStyle='#f6fafb';c.font='500 17px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(region.action==='isolate'&&current.isolated?'Show surrounding':region.label,region.x+region.width/2,region.y+region.height/2);c.textAlign='left';c.textBaseline='alphabetic';}card.texture.needsUpdate=true;};
 const raycaster=new T.Raycaster(),hits:T.Intersection[]=[];
 const hitSurface=(ray:T.Ray,surface:typeof menu,regions:Region[])=>{if(!surface.mesh.visible)return null;raycaster.ray.copy(ray);hits.length=0;raycaster.intersectObject(surface.mesh,false,hits);const hit=hits[0];if(!hit?.uv)return null;const x=hit.uv.x*surface.canvas.width,y=(1-hit.uv.y)*surface.canvas.height,region=regions.find(item=>x>=item.x&&x<=item.x+item.width&&y>=item.y&&y<=item.y+item.height);return region?{action:region.action,distance:hit.distance}:null;};
 drawMenu();drawCard();
 return {group,pick:ray=>hitSurface(ray,card,cardRegions)??hitSurface(ray,menu,menuRegions),setHover:action=>{if(action===hovered)return;hovered=action;drawMenu();drawCard();},update:state=>{const modeChanged=state.mode!==current.mode;current=state;if(modeChanged)drawMenu();drawCard();},dispose:()=>{parent.remove(group);menu.mesh.geometry.dispose();menu.material.dispose();menu.texture.dispose();card.mesh.geometry.dispose();card.material.dispose();card.texture.dispose();}};
}
