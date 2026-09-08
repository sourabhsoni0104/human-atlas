import type * as T from 'three';
import type {XRMode} from './types';

export interface XRDiagnosticFrame {renderer:T.WebGLRenderer;mode:XRMode;loadedChunks:number;totalChunks:number;visibleSystems:number}
export interface XRDiagnostics {frame:(state:XRDiagnosticFrame)=>void;dispose:()=>void}

export function createXRDiagnostics(parent:HTMLElement):XRDiagnostics{
 const enabled=new URLSearchParams(location.search).get('debugXR')==='1';if(!enabled)return {frame:()=>{},dispose:()=>{}};
 const panel=document.createElement('pre');panel.className='xr-debug';panel.setAttribute('aria-label','XR rendering diagnostics');parent.appendChild(panel);
 let frames=0,last=performance.now();
 return {frame:state=>{frames++;const now=performance.now(),elapsed=now-last;if(elapsed<500)return;const fps=frames*1000/elapsed;panel.textContent=[`XR ${state.mode.toUpperCase()}`,`${fps.toFixed(1)} FPS · ${(elapsed/frames).toFixed(1)} ms`,`Draw calls ${state.renderer.info.render.calls.toLocaleString()}`,`Triangles ${state.renderer.info.render.triangles.toLocaleString()}`,`Chunks ${state.loadedChunks}/${state.totalChunks}`,`Visible systems ${state.visibleSystems}`].join('\n');frames=0;last=now;},dispose:()=>panel.remove()};
}
