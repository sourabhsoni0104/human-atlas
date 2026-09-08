import * as T from 'three';
import type {XRHandSpace} from 'three/src/renderers/webxr/WebXRController.js';

export interface XRControllerInput {
 index:number;
 targetRay:T.Group;
 rayLine:T.Line;
 connected:boolean;
 grabbing:boolean;
 handTracking:boolean;
}

export interface XRControllerCallbacks {onSelect:(input:XRControllerInput)=>void;onGrabStart?:(input:XRControllerInput)=>void;onGrabEnd?:(input:XRControllerInput)=>void}

export interface XRControllerSet {
 inputs:XRControllerInput[];
 reset:()=>void;
 dispose:()=>void;
}

export interface XRHandSet {update:()=>void;reset:()=>void;dispose:()=>void}

export function rayFromController(controller:T.Object3D,target=new T.Ray()):T.Ray{
 controller.updateWorldMatrix(true,false);
 target.origin.setFromMatrixPosition(controller.matrixWorld);
 target.direction.set(0,0,-1).transformDirection(controller.matrixWorld);
 return target;
}

export function createXRControllers(renderer:T.WebGLRenderer,parent:T.Object3D,callbacks:XRControllerCallbacks):XRControllerSet{
 const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]),materials:T.LineBasicMaterial[]=[];
 const inputs=[0,1].map(index=>{
  const targetRay=renderer.xr.getController(index),material=new T.LineBasicMaterial({color:0x8ee7dc,transparent:true,opacity:.55});materials.push(material);
  const rayLine=new T.Line(geometry,material);rayLine.name=`xr-controller-ray-${index}`;rayLine.scale.z=1.8;rayLine.visible=false;rayLine.frustumCulled=false;targetRay.add(rayLine);
  const input:XRControllerInput={index,targetRay,rayLine,connected:false,grabbing:false,handTracking:false};
  targetRay.addEventListener('connected',event=>{input.connected=event.data.targetRayMode==='tracked-pointer';input.handTracking=!!event.data.hand;rayLine.visible=input.connected;});
  targetRay.addEventListener('disconnected',()=>{if(input.grabbing)callbacks.onGrabEnd?.(input);input.connected=false;input.grabbing=false;input.handTracking=false;rayLine.visible=false;});
  targetRay.addEventListener('select',()=>{if(input.connected&&!input.grabbing&&!input.handTracking)callbacks.onSelect(input);});
  targetRay.addEventListener('squeezestart',()=>{if(input.connected&&!input.grabbing){input.grabbing=true;callbacks.onGrabStart?.(input);}});
  targetRay.addEventListener('squeezeend',()=>{if(input.grabbing){input.grabbing=false;callbacks.onGrabEnd?.(input);}});
  parent.add(targetRay);return input;
 });
 const reset=()=>inputs.forEach(input=>{input.connected=false;input.grabbing=false;input.handTracking=false;input.rayLine.visible=false;input.rayLine.scale.z=1.8;});
 return {inputs,reset,dispose:()=>{reset();inputs.forEach(input=>{input.targetRay.remove(input.rayLine);parent.remove(input.targetRay);});geometry.dispose();materials.forEach(material=>material.dispose());}};
}

export function createXRHands(renderer:T.WebGLRenderer,parent:T.Object3D,controllers:XRControllerSet,onPinch:(input:XRControllerInput)=>void):XRHandSet{
 const geometry=new T.SphereGeometry(1,8,6),material=new T.MeshStandardMaterial({color:0xbcd8d5,roughness:.72,metalness:.02}),matrix=new T.Matrix4(),scale=new T.Vector3();
 const hands=[0,1].map(index=>{const hand=renderer.xr.getHand(index) as XRHandSpace,model=new T.InstancedMesh(geometry,material,30);model.name=`xr-hand-model-${index}`;model.frustumCulled=false;model.count=0;model.instanceMatrix.setUsage(T.DynamicDrawUsage);hand.add(model);hand.visible=false;hand.addEventListener('connected',event=>{hand.visible=!!event.data.hand;});hand.addEventListener('disconnected',()=>{hand.visible=false;model.count=0;});hand.addEventListener('pinchstart',()=>{const input=controllers.inputs[index];if(input.connected&&input.handTracking)onPinch(input);});parent.add(hand);return {hand,model};});
 const update=()=>hands.forEach(({hand,model})=>{if(!hand.visible){model.count=0;return;}let count=0;Object.values(hand.joints).forEach(joint=>{if(!joint?.visible)return;scale.setScalar(joint.jointRadius??.008);matrix.compose(joint.position,joint.quaternion,scale);model.setMatrixAt(count++,matrix);});model.count=count;model.instanceMatrix.needsUpdate=true;});
 const reset=()=>hands.forEach(({hand,model})=>{hand.visible=false;model.count=0;});
 return {update,reset,dispose:()=>{reset();hands.forEach(({hand,model})=>{hand.remove(model);parent.remove(hand);});geometry.dispose();material.dispose();}};
}
