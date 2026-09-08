import type {ImmersiveXRMode} from './types';

const sessionMode=(mode:ImmersiveXRMode):XRSessionMode=>mode==='mr'?'immersive-ar':'immersive-vr';

export async function createXRSession(mode:ImmersiveXRMode):Promise<XRSession>{
 if(!navigator.xr)throw new Error(`${mode==='mr'?'Mixed reality':'Virtual reality'} is not supported on this browser.`);
 return navigator.xr.requestSession(sessionMode(mode),{
  requiredFeatures:['local-floor'],
  optionalFeatures:['hand-tracking'],
 });
}

export function xrSessionError(mode:ImmersiveXRMode,error:unknown):string{
 if(error instanceof DOMException&&error.name==='NotSupportedError')return `${mode==='mr'?'Mixed reality':'Virtual reality'} is not available on this device.`;
 if(error instanceof DOMException&&error.name==='SecurityError')return 'XR requires a secure connection and permission from the browser.';
 return `The ${mode==='mr'?'mixed reality':'virtual reality'} session could not start.`;
}
