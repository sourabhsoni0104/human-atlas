import * as T from 'three';

export const MIN_ATLAS_SCALE=.15,MAX_ATLAS_SCALE=3;

export interface ManipulationSource {index:number;targetRay:T.Object3D}
export interface AtlasManipulator {start:(source:ManipulationSource)=>void;end:(source:ManipulationSource)=>void;update:()=>void;clear:()=>void;active:()=>boolean}

export const clampAtlasScale=(scale:number)=>T.MathUtils.clamp(scale,MIN_ATLAS_SCALE,MAX_ATLAS_SCALE);
export const twoHandScale=(initialScale:number,initialDistance:number,currentDistance:number)=>clampAtlasScale(initialScale*currentDistance/Math.max(initialDistance,.001));
export const normalizeAngle=(angle:number)=>Math.atan2(Math.sin(angle),Math.cos(angle));

const worldPosition=(source:ManipulationSource,target=new T.Vector3())=>{source.targetRay.updateWorldMatrix(true,false);return target.setFromMatrixPosition(source.targetRay.matrixWorld);};
const worldYaw=(source:ManipulationSource)=>{const quaternion=source.targetRay.getWorldQuaternion(new T.Quaternion()),forward=new T.Vector3(0,0,-1).applyQuaternion(quaternion);return Math.atan2(forward.x,forward.z);};
const pairAngle=(a:T.Vector3,b:T.Vector3)=>Math.atan2(b.x-a.x,b.z-a.z);

export function createAtlasManipulator(atlasRoot:T.Group):AtlasManipulator{
 const sources=new Map<number,ManipulationSource>(),up=new T.Vector3(0,1,0);
 let single:{index:number;hand:T.Vector3;yaw:number;atlasPosition:T.Vector3;atlasYaw:number}|null=null;
 let dual:{indices:[number,number];distance:number;angle:number;midpoint:T.Vector3;offset:T.Vector3;scale:number;atlasYaw:number}|null=null;
 const beginSingle=(source:ManipulationSource)=>{const hand=worldPosition(source);single={index:source.index,hand:hand.clone(),yaw:worldYaw(source),atlasPosition:atlasRoot.position.clone(),atlasYaw:atlasRoot.rotation.y};dual=null;};
 const beginDual=()=>{const active=[...sources.values()].slice(0,2);if(active.length<2)return;const a=worldPosition(active[0]),b=worldPosition(active[1]),midpoint=a.clone().add(b).multiplyScalar(.5);dual={indices:[active[0].index,active[1].index],distance:a.distanceTo(b),angle:pairAngle(a,b),midpoint,offset:atlasRoot.position.clone().sub(midpoint),scale:atlasRoot.scale.x,atlasYaw:atlasRoot.rotation.y};single=null;};
 const clear=()=>{sources.clear();single=null;dual=null;};
 const start=(source:ManipulationSource)=>{sources.set(source.index,source);if(sources.size===1)beginSingle(source);else beginDual();};
 const end=(source:ManipulationSource)=>{sources.delete(source.index);if(sources.size===1)beginSingle([...sources.values()][0]);else if(sources.size===0){single=null;dual=null;}else beginDual();};
 const update=()=>{
  if(dual){const aSource=sources.get(dual.indices[0]),bSource=sources.get(dual.indices[1]);if(!aSource||!bSource)return;const a=worldPosition(aSource),b=worldPosition(bSource),midpoint=a.clone().add(b).multiplyScalar(.5),angleDelta=normalizeAngle(pairAngle(a,b)-dual.angle),scale=twoHandScale(dual.scale,dual.distance,a.distanceTo(b)),scaleRatio=scale/dual.scale;atlasRoot.position.copy(dual.offset).applyAxisAngle(up,angleDelta).multiplyScalar(scaleRatio).add(midpoint);atlasRoot.rotation.y=dual.atlasYaw+angleDelta;atlasRoot.scale.setScalar(scale);atlasRoot.updateMatrixWorld(true);return;}
  if(single){const source=sources.get(single.index);if(!source)return;const hand=worldPosition(source),yawDelta=normalizeAngle(worldYaw(source)-single.yaw);atlasRoot.position.copy(single.atlasPosition).add(hand).sub(single.hand);atlasRoot.rotation.y=single.atlasYaw+yawDelta;atlasRoot.updateMatrixWorld(true);}
 };
 return {start,end,update,clear,active:()=>sources.size>0};
}
