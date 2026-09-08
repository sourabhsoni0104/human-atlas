import * as T from 'three';
import type {Part} from '../anatomy';

export interface AnatomyPickingContext {
 parts:readonly Part[];
 pickers:readonly (T.Mesh|undefined)[];
 bounds:readonly T.Box3[];
 partState:Float32Array;
 atlasRoot:T.Object3D;
}

export interface AnatomyHit {
 index:number;
 distance:number;
 point:T.Vector3;
}

const raycaster=new T.Raycaster(),localRay=new T.Ray(),inverseRoot=new T.Matrix4(),candidateBox=new T.Box3(),boxHit=new T.Vector3(),intersections:T.Intersection[]=[];

export function pickAnatomy(ray:T.Ray,context:AnatomyPickingContext):AnatomyHit|null{
 context.atlasRoot.updateWorldMatrix(true,false);inverseRoot.copy(context.atlasRoot.matrixWorld).invert();localRay.copy(ray).applyMatrix4(inverseRoot);raycaster.ray.copy(localRay);
 const hasSolid=context.parts.some((part,index)=>part.system!=='integumentary'&&context.partState[index*4+3]>.5);
 let nearest=Infinity,found=-1;const point=new T.Vector3();
 context.pickers.forEach((mesh,index)=>{
  if(!mesh||context.partState[index*4+3]<.5||(hasSolid&&context.parts[index].system==='integumentary'))return;
  candidateBox.copy(context.bounds[index]).translate(mesh.position);if(!localRay.intersectBox(candidateBox,boxHit))return;
  intersections.length=0;raycaster.intersectObject(mesh,false,intersections);const hit=intersections[0];
  if(hit&&hit.distance<nearest){nearest=hit.distance;found=index;point.copy(hit.point);}
 });
 if(found<0)return null;
 point.applyMatrix4(context.atlasRoot.matrixWorld);return {index:found,distance:ray.origin.distanceTo(point),point};
}
