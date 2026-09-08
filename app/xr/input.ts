import * as T from 'three';

export interface XRControllerInput {
 index:number;
 targetRay:T.Group;
 rayLine:T.Line;
 connected:boolean;
}

export interface XRControllerSet {
 inputs:XRControllerInput[];
 reset:()=>void;
 dispose:()=>void;
}

export function rayFromController(controller:T.Object3D,target=new T.Ray()):T.Ray{
 controller.updateWorldMatrix(true,false);
 target.origin.setFromMatrixPosition(controller.matrixWorld);
 target.direction.set(0,0,-1).transformDirection(controller.matrixWorld);
 return target;
}

export function createXRControllers(renderer:T.WebGLRenderer,parent:T.Object3D,onSelect:(input:XRControllerInput)=>void):XRControllerSet{
 const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]),materials:T.LineBasicMaterial[]=[];
 const inputs=[0,1].map(index=>{
  const targetRay=renderer.xr.getController(index),material=new T.LineBasicMaterial({color:0x8ee7dc,transparent:true,opacity:.55});materials.push(material);
  const rayLine=new T.Line(geometry,material);rayLine.name=`xr-controller-ray-${index}`;rayLine.scale.z=1.8;rayLine.visible=false;rayLine.frustumCulled=false;targetRay.add(rayLine);
  const input:XRControllerInput={index,targetRay,rayLine,connected:false};
  targetRay.addEventListener('connected',event=>{input.connected=event.data.targetRayMode==='tracked-pointer';rayLine.visible=input.connected;});
  targetRay.addEventListener('disconnected',()=>{input.connected=false;rayLine.visible=false;});
  targetRay.addEventListener('select',()=>{if(input.connected)onSelect(input);});
  parent.add(targetRay);return input;
 });
 const reset=()=>inputs.forEach(input=>{input.connected=false;input.rayLine.visible=false;input.rayLine.scale.z=1.8;});
 return {inputs,reset,dispose:()=>{reset();inputs.forEach(input=>{input.targetRay.remove(input.rayLine);parent.remove(input.targetRay);});geometry.dispose();materials.forEach(material=>material.dispose());}};
}
