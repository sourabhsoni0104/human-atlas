import type {XRSupport} from './types';

export const NO_XR_SUPPORT:XRSupport={supported:false,mrSupported:false,vrSupported:false};

export async function detectXRSupport():Promise<XRSupport>{
 const xr=navigator.xr;
 if(!xr)return NO_XR_SUPPORT;
 const [mrSupported,vrSupported]=await Promise.all([
  xr.isSessionSupported('immersive-ar').catch(()=>false),
  xr.isSessionSupported('immersive-vr').catch(()=>false),
 ]);
 return {supported:true,mrSupported,vrSupported};
}
